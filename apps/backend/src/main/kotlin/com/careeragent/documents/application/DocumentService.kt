package com.careeragent.documents.application

import com.careeragent.documents.domain.*
import com.careeragent.documents.infrastructure.DocumentTextExtractor
import com.careeragent.documents.infrastructure.LocalPdfOcr
import com.careeragent.profile.application.*
import com.careeragent.profile.domain.*
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.MessageDigest
import java.util.UUID
import java.util.concurrent.Semaphore

class DocumentFailure(val code: String, val status: Int) : RuntimeException(code)
interface DocumentRepository {
    fun list(identity: VerifiedIdentity): List<CareerDocument>
    fun detail(identity: VerifiedIdentity, id: UUID): DocumentDetail
    fun create(identity: VerifiedIdentity, id: UUID, name: String, mediaType: String, size: Long, hash: String, text: String, language: String): CareerDocument
    fun selectMaster(identity: VerifiedIdentity, id: UUID): CareerDocument
    fun delete(identity: VerifiedIdentity, id: UUID)
    fun replaceText(identity: VerifiedIdentity, id: UUID, text: String, method: String): DocumentDetail
}
@Service
@Profile("persistence")
class DocumentService(private val repository: DocumentRepository, private val storage: DocumentStorage,
    private val extractor: DocumentTextExtractor, private val claims: ClaimService,
    private val analyses: DocumentAnalysisRepository, private val ocr: LocalPdfOcr) {
    private val permit = Semaphore(1)
    fun list(identity: VerifiedIdentity) = repository.list(identity)
    fun detail(identity: VerifiedIdentity, id: UUID) = repository.detail(identity, id)
    fun original(identity: VerifiedIdentity, id: UUID): Pair<CareerDocument, ByteArray> {
        val document = repository.detail(identity, id).document
        return document to storage.read(id)
    }
    fun upload(identity: VerifiedIdentity, name: String, language: String, bytes: ByteArray): CareerDocument {
        if (bytes.isEmpty() || bytes.size > 5242880) throw DocumentFailure("DOCUMENT_TOO_LARGE", 413)
        if (language !in setOf("nb", "en") || name.length !in 1..120 || name.any { it.isISOControl() || it in "/\\\"" }) throw DocumentFailure("DOCUMENT_INVALID", 400)
        val extension = name.substringAfterLast('.', "").lowercase()
        if (extension !in setOf("docx", "pdf")) throw DocumentFailure("DOCUMENT_TYPE", 400)
        repository.list(identity)
        if (!permit.tryAcquire()) throw DocumentFailure("DOCUMENT_BUSY", 429)
        try {
            val text = extractor.extract(bytes, extension)
            val id = UUID.randomUUID(); val hash = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
            storage.put(id, bytes)
            try { return repository.create(identity, id, name, if (extension == "pdf") "application/pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes.size.toLong(), hash, text, language) }
            catch (error: Exception) { storage.delete(id); throw error }
        } finally { permit.release() }
    }
    fun selectMaster(identity: VerifiedIdentity, id: UUID) = repository.selectMaster(identity, id)
    fun reread(identity: VerifiedIdentity, id: UUID, useOcr: Boolean): DocumentDetail {
        val (document, bytes) = original(identity, id)
        if (useOcr && document.mediaType != "application/pdf") throw DocumentFailure("DOCUMENT_TYPE", 400)
        if (!permit.tryAcquire()) throw DocumentFailure("DOCUMENT_BUSY", 429)
        try {
            val result = if (useOcr) ocr.extract(bytes) else com.careeragent.documents.infrastructure.ReadDocument(extractor.extract(bytes, if (document.mediaType == "application/pdf") "pdf" else "docx"), "TEXT")
            if (result.text.isBlank() && repository.detail(identity, id).text.isNotBlank()) throw DocumentFailure("DOCUMENT_AI_NO_TEXT", 400)
            return repository.replaceText(identity, id, result.text, result.method)
        } finally { permit.release() }
    }
    fun delete(identity: VerifiedIdentity, id: UUID) {
        val original = original(identity, id).second
        storage.delete(id)
        try { repository.delete(identity, id) }
        catch (error: Exception) { storage.put(id, original); throw error }
    }
    @Transactional
    fun claim(identity: VerifiedIdentity, id: UUID, skill: String, statement: String, context: String, quote: String, analysisId: UUID? = null): CompetencyClaim {
        val source = repository.detail(identity, id)
        if (quote.isBlank() || quote.length > 1000 || !source.text.contains(quote)) throw DocumentFailure("DOCUMENT_QUOTE_INVALID", 400)
        if (analysisId != null && analyses.load(identity, id)?.id != analysisId) {
            val collection = analyses.loadCollection(identity)
            if (collection?.id != analysisId || collection.documents.none { it.documentId == id }) throw DocumentFailure("DOCUMENT_ANALYSIS_CONFLICT", 409)
        }
        val note = if (analysisId == null) "CV" else "AI-assisted CV"
        return claims.create(identity, ClaimContent(skill, statement, context, "$note: ${source.document.originalName}", id, quote))
    }
}
