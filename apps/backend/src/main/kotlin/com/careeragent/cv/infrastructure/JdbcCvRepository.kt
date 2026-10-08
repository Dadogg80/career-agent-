package com.careeragent.cv.infrastructure

import com.careeragent.cv.application.*
import com.careeragent.cv.domain.*
import com.careeragent.profile.application.VerifiedIdentity
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.context.annotation.Profile
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.util.UUID

@Repository
@Profile("persistence")
class JdbcCvRepository(private val jdbc: JdbcTemplate, private val json: ObjectMapper) : CvRepository {
    private fun owner(identity: VerifiedIdentity, lock: Boolean = false) = jdbc.query("SELECT u.id FROM app_user u JOIN career_profile p ON p.owner_id=u.id WHERE u.oidc_issuer=? AND u.oidc_subject=?" + if(lock) " FOR UPDATE OF u" else "", { row,_ -> row.getObject(1,UUID::class.java) },identity.issuer,identity.subject).singleOrNull() ?: throw CvFailure("PROFILE_NOT_CREATED",404)
    private val map = org.springframework.jdbc.core.RowMapper { row,_ -> CvVersion(row.getObject("id",UUID::class.java),row.getString("title"),json.readValue(row.getString("content"),CvContent::class.java),CvStatus.valueOf(row.getString("status")),row.getLong("revision"),row.getString("template_version"),row.getObject("created_at",OffsetDateTime::class.java),row.getObject("approved_at",OffsetDateTime::class.java),json.readValue(row.getString("artifacts"),Array<CvArtifact>::class.java).toList()) }
    private fun read(owner: UUID,id: UUID) = jdbc.query("SELECT * FROM cv_version WHERE owner_id=? AND id=?",map,owner,id).singleOrNull() ?: throw CvFailure("CV_NOT_FOUND",404)
    private fun sources(owner: UUID,content: CvContent) {
        val claims=jdbc.query("SELECT id,revision FROM competency_claim WHERE owner_id=? AND status='CONFIRMED'",{ row,_ -> row.getObject(1,UUID::class.java) to row.getLong(2) },owner).toMap()
        val entries=jdbc.query("SELECT id,revision FROM career_entry WHERE owner_id=? AND status='CONFIRMED'",{ row,_ -> row.getObject(1,UUID::class.java) to row.getLong(2) },owner).toMap()
        if(content.claims.any { claims[it.id] != it.revision } || content.entries.any { entries[it.id] != it.revision }) throw CvFailure("CV_SOURCE_CONFLICT",409)
        if(content.jobId != null && jdbc.queryForObject("SELECT COUNT(*) FROM saved_job WHERE owner_id=? AND id=?",Long::class.java,owner,content.jobId) != 1L) throw CvFailure("CV_SOURCE_CONFLICT",409)
    }
    @Transactional(readOnly=true) override fun list(identity: VerifiedIdentity) = jdbc.query("SELECT * FROM cv_version WHERE owner_id=? ORDER BY created_at DESC LIMIT 30",map,owner(identity))
    @Transactional(readOnly=true) override fun get(identity: VerifiedIdentity,id: UUID) = read(owner(identity),id)
    @Transactional override fun create(identity: VerifiedIdentity,title: String,content: CvContent): CvVersion {
        val owner=owner(identity,true);sources(owner,content)
        if(jdbc.queryForObject("SELECT COUNT(*) FROM cv_version WHERE owner_id=?",Long::class.java,owner)!! >= 30) throw CvFailure("CV_LIMIT",409)
        val id=UUID.randomUUID();jdbc.update("INSERT INTO cv_version(id,owner_id,job_id,title,content,status,revision,template_version,artifacts) VALUES(?,?,?,?,?::jsonb,'DRAFT',1,'standard-v1','[]'::jsonb)",id,owner,content.jobId,title,json.writeValueAsString(content))
        return read(owner,id)
    }
    @Transactional override fun approve(identity: VerifiedIdentity,id: UUID,revision: Long,artifacts: List<CvArtifact>): CvVersion {
        val owner=owner(identity,true);val version=read(owner,id)
        if(version.revision != revision || version.status != CvStatus.DRAFT) throw CvFailure("CV_CONFLICT",409)
        sources(owner,version.content)
        jdbc.update("UPDATE cv_version SET status='APPROVED',revision=revision+1,approved_at=CURRENT_TIMESTAMP,artifacts=?::jsonb WHERE owner_id=? AND id=?",json.writeValueAsString(artifacts),owner,id)
        return read(owner,id)
    }
    @Transactional override fun delete(identity: VerifiedIdentity,id: UUID,revision: Long): CvVersion {
        val owner=owner(identity,true);val version=read(owner,id)
        if(version.revision != revision) throw CvFailure("CV_CONFLICT",409)
        if(jdbc.queryForObject("SELECT COUNT(*) FROM application_case WHERE owner_id=? AND cv_version_id=?",Long::class.java,owner,id) != 0L) throw CvFailure("CV_IN_USE",409)
        version.artifacts.forEach { jdbc.update("INSERT INTO cv_file_cleanup(object_id,owner_id) VALUES(?,?) ON CONFLICT(object_id) DO NOTHING",it.id,owner) }
        jdbc.update("DELETE FROM cv_version WHERE owner_id=? AND id=?",owner,id)
        return version
    }
    @Transactional(readOnly=true) override fun pendingCleanup(identity: VerifiedIdentity) = jdbc.query("SELECT object_id FROM cv_file_cleanup WHERE owner_id=? ORDER BY created_at LIMIT 100",{row,_ -> row.getObject(1,UUID::class.java)},owner(identity))
    @Transactional override fun acknowledgeCleanup(identity: VerifiedIdentity,id: UUID) {jdbc.update("DELETE FROM cv_file_cleanup WHERE owner_id=? AND object_id=?",owner(identity,true),id)}
}
