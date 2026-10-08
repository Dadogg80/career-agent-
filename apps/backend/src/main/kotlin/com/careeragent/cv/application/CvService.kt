package com.careeragent.cv.application

import com.careeragent.cv.domain.*
import com.careeragent.documents.domain.DocumentStorage
import com.careeragent.jobs.application.SavedJobRepository
import com.careeragent.profile.application.*
import com.careeragent.profile.domain.ClaimStatus
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import java.security.MessageDigest
import java.util.UUID
import java.util.concurrent.Semaphore

class CvFailure(val code: String, val status: Int) : RuntimeException(code)
interface CvRepository {
    fun list(identity: VerifiedIdentity): List<CvVersion>
    fun get(identity: VerifiedIdentity, id: UUID): CvVersion
    fun create(identity: VerifiedIdentity, title: String, content: CvContent): CvVersion
    fun approve(identity: VerifiedIdentity, id: UUID, revision: Long, artifacts: List<CvArtifact>): CvVersion
    fun delete(identity: VerifiedIdentity, id: UUID, revision: Long): CvVersion
    fun pendingCleanup(identity: VerifiedIdentity): List<UUID>
    fun acknowledgeCleanup(identity: VerifiedIdentity, id: UUID)
}
@Service
@Profile("persistence")
class CvService(private val versions: CvRepository, private val claims: ClaimRepository, private val entries: CareerEntryRepository,
                private val jobs: SavedJobRepository, private val renderer: CvRenderer, private val storage: DocumentStorage) {
    private val generating = Semaphore(1)
    private fun current(identity: VerifiedIdentity, version: CvVersion): CvVersion {
        if (version.status == CvStatus.APPROVED) return version
        val c = claims.list(identity).filter { it.status == ClaimStatus.CONFIRMED }.associate { it.id to it.revision }
        val e = entries.list(identity).filter { it.status == ClaimStatus.CONFIRMED }.associate { it.id to it.revision }
        return version.copy(stale = version.content.claims.any { c[it.id] != it.revision } || version.content.entries.any { e[it.id] != it.revision })
    }
    fun list(identity: VerifiedIdentity): List<CvVersion> {
        val all = versions.list(identity)
        if (all.none { it.status == CvStatus.DRAFT }) return all
        val c = claims.list(identity).filter { it.status == ClaimStatus.CONFIRMED }.associate { it.id to it.revision }
        val e = entries.list(identity).filter { it.status == ClaimStatus.CONFIRMED }.associate { it.id to it.revision }
        return all.map { version -> if (version.status == CvStatus.APPROVED) version else version.copy(stale = version.content.claims.any { c[it.id] != it.revision } || version.content.entries.any { e[it.id] != it.revision }) }
    }
    fun get(identity: VerifiedIdentity, id: UUID) = current(identity, versions.get(identity, id))
    fun create(identity: VerifiedIdentity, request: CvDraftRequest): CvVersion {
        fun text(value: String, max: Int, required: Boolean = false) = value.length <= max && (!required || value.isNotBlank()) && value.none { it.isISOControl() && it !in "\n\r\t" }
        val h = request.identity
        if (!text(request.title,200,true) || request.locale !in listOf("nb","en") || !text(h.name,200,true) || !text(h.headline,200) || !text(h.email,200) || !text(h.phone,100) || !text(h.location,200) || !text(h.summary,1500)) throw CvFailure("CV_INVALID",400)
        fun selections(values: List<CvSelection>, limit: Int) = values.size <= limit && values.map { it.id }.distinct().size == values.size && values.all { it.revision > 0 }
        if (!selections(request.claims,30) || !selections(request.entries,20) || request.claims.isEmpty() && request.entries.isEmpty()) throw CvFailure("CV_INVALID",400)
        val confirmedClaims = claims.list(identity).filter { it.status == ClaimStatus.CONFIRMED }.associateBy { it.id }
        val confirmedEntries = entries.list(identity).filter { it.status == ClaimStatus.CONFIRMED }.associateBy { it.id }
        val c = request.claims.map { selected -> confirmedClaims[selected.id]?.takeIf { it.revision == selected.revision } ?: throw CvFailure("CV_SOURCE_CONFLICT",409) }
        val e = request.entries.map { selected -> confirmedEntries[selected.id]?.takeIf { it.revision == selected.revision } ?: throw CvFailure("CV_SOURCE_CONFLICT",409) }
        val job = request.jobId?.let { jobs.get(identity,it) }
        val header = h.copy(name=h.name.trim(), headline=h.headline.trim(), email=h.email.trim(), phone=h.phone.trim(), location=h.location.trim(), summary=h.summary.trim())
        val content = CvContent(request.locale,header,c,e,job?.id,job?.content?.title)
        val characters = header.toString().length + c.sumOf { it.skill.length+it.statement.length+it.context.length } + e.sumOf { it.content.toString().length }
        if (characters > 20000) throw CvFailure("CV_CONTENT_LIMIT",400)
        return versions.create(identity,request.title.trim(),content)
    }
    fun approve(identity: VerifiedIdentity, id: UUID, revision: Long, approved: Boolean): CvVersion {
        if (!approved || revision < 1) throw CvFailure("CV_APPROVAL_REQUIRED",400)
        if (!generating.tryAcquire()) throw CvFailure("CV_BUSY",429)
        val written = mutableListOf<UUID>()
        try {
            val version = get(identity,id)
            if (version.status != CvStatus.DRAFT || version.revision != revision) throw CvFailure("CV_CONFLICT",409)
            if (version.stale) throw CvFailure("CV_SOURCE_CONFLICT",409)
            val files = renderer.generate(version.content)
            if (files.map { it.format }.toSet() != CvFormat.entries.toSet() || files.size != 2 || files.any { it.bytes.size !in 1..5_000_000 }) throw CvFailure("CV_EXPORT_FAILED",503)
            val artifacts = files.map { file ->
                val objectId = UUID.randomUUID(); storage.put(objectId,file.bytes); written.add(objectId)
                CvArtifact(objectId,file.format,file.bytes.size,hash(file.bytes))
            }
            return versions.approve(identity,id,revision,artifacts)
        } catch (error: Exception) {
            written.forEach { try { storage.delete(it) } catch (_: Exception) { } }
            if (error is CvFailure) throw error
            throw CvFailure("CV_EXPORT_FAILED",503)
        } finally { generating.release() }
    }
    fun download(identity: VerifiedIdentity, id: UUID, format: CvFormat): ByteArray {
        val version = versions.get(identity,id)
        if (version.status != CvStatus.APPROVED) throw CvFailure("CV_APPROVAL_REQUIRED",409)
        val artifact = version.artifacts.singleOrNull { it.format == format } ?: throw CvFailure("CV_EXPORT_FAILED",503)
        val bytes = try { storage.read(artifact.id) } catch (_: Exception) { throw CvFailure("CV_EXPORT_FAILED",503) }
        if (bytes.size != artifact.byteSize || hash(bytes) != artifact.sha256) throw CvFailure("CV_EXPORT_FAILED",503)
        return bytes
    }
    fun delete(identity: VerifiedIdentity, id: UUID, revision: Long) {
        if (revision < 1) throw CvFailure("CV_INVALID",400)
        versions.delete(identity,id,revision)
        cleanup(identity)
    }
    fun cleanupStatus(identity: VerifiedIdentity) = versions.pendingCleanup(identity).size
    fun cleanup(identity: VerifiedIdentity): Int {
        var remaining = 0
        versions.pendingCleanup(identity).forEach { objectId ->
            try { storage.delete(objectId); versions.acknowledgeCleanup(identity,objectId) }
            catch (_: Exception) { remaining++ }
        }
        return remaining
    }
    private fun hash(bytes: ByteArray) = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
}
