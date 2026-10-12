package com.careeragent.cv.infrastructure

import com.careeragent.cv.application.*
import com.careeragent.jobs.domain.PersonalMatch
import com.careeragent.profile.application.VerifiedIdentity
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.context.annotation.Profile
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.RowMapper
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.util.UUID

@Repository
@Profile("persistence")
class JdbcCvTailoringSessionRepository(private val jdbc: JdbcTemplate, private val json: ObjectMapper) : CvTailoringSessionRepository {
    private fun owner(identity: VerifiedIdentity, lock: Boolean = false): UUID = jdbc.query(
        "SELECT u.id FROM app_user u JOIN career_profile p ON p.owner_id=u.id WHERE u.oidc_issuer=? AND u.oidc_subject=?" + if (lock) " FOR UPDATE OF u" else "",
        { row, _ -> row.getObject(1, UUID::class.java) }, identity.issuer, identity.subject).singleOrNull() ?: throw CvFailure("PROFILE_NOT_CREATED", 404)
    private val rowMapper = RowMapper { row, _ -> CvTailoringSession(row.getObject("id", UUID::class.java),
        row.getObject("job_id", UUID::class.java), row.getLong("revision"), json.readValue(row.getString("snapshot"), TailoringSnapshot::class.java),
        json.readValue(row.getString("reviews"), Array<WordingReview>::class.java).toList(), row.getObject("created_at", OffsetDateTime::class.java)) }
    private fun job(owner: UUID, jobId: UUID) {
        if (jdbc.queryForObject("SELECT COUNT(*) FROM saved_job WHERE owner_id=? AND id=?", Long::class.java, owner, jobId) != 1L)
            throw CvFailure("SAVED_JOB_NOT_FOUND", 404)
    }
    private fun capacity(owner: UUID) {
        if (jdbc.queryForObject("SELECT COUNT(*) FROM cv_tailoring_session WHERE owner_id=?", Long::class.java, owner)!! >= 30)
            throw CvFailure("CV_LIMIT", 409)
    }
    private fun current(owner: UUID, snapshot: TailoringSnapshot, jobId: UUID): Boolean {
        val text = jdbc.query("SELECT extracted_text FROM career_document WHERE owner_id=? AND id=?", { row, _ -> row.getString(1) }, owner, snapshot.result.documentId).singleOrNull()
        if (text != snapshot.text) return false
        val match = jdbc.query("SELECT result FROM job_match_analysis WHERE owner_id=? AND job_id=?", { row, _ -> json.readValue(row.getString(1), PersonalMatch::class.java) }, owner, jobId).singleOrNull()
        if (match == null || match.id != snapshot.result.matchId || !match.automaticEvidence || match.claims != snapshot.claims) return false
        val claims = jdbc.query("SELECT id,revision FROM competency_claim WHERE owner_id=? AND status='CONFIRMED'", { row, _ -> row.getObject(1, UUID::class.java) to row.getLong(2) }, owner).toMap()
        return claims == snapshot.claims.associate { it.id to it.revision }
    }
    @Transactional(readOnly = true)
    override fun checkCapacity(identity: VerifiedIdentity, jobId: UUID) { val owner = owner(identity); job(owner, jobId); capacity(owner) }
    @Transactional
    override fun create(identity: VerifiedIdentity, jobId: UUID, snapshot: TailoringSnapshot): CvTailoringSession {
        val owner = owner(identity, true); job(owner, jobId); capacity(owner)
        if (!current(owner, snapshot, jobId)) throw CvFailure("CV_SOURCE_CONFLICT", 409)
        val id = UUID.randomUUID()
        val bound = snapshot.copy(result = snapshot.result.copy(sessionId = id))
        jdbc.update("INSERT INTO cv_tailoring_session(id,owner_id,job_id,snapshot) VALUES(?,?,?,?::jsonb)", id, owner, jobId, json.writeValueAsString(bound))
        return read(owner, jobId, id)
    }
    private fun read(owner: UUID, jobId: UUID, id: UUID) = jdbc.query("SELECT * FROM cv_tailoring_session WHERE owner_id=? AND job_id=? AND id=?", rowMapper, owner, jobId, id).singleOrNull()
        ?: throw CvFailure("CV_NOT_FOUND", 404)
    @Transactional(readOnly = true)
    override fun latest(identity: VerifiedIdentity, jobId: UUID): CvTailoringSession? {
        val owner = owner(identity); job(owner, jobId)
        val session = jdbc.query("SELECT * FROM cv_tailoring_session WHERE owner_id=? AND job_id=? ORDER BY created_at DESC,id DESC LIMIT 1", rowMapper, owner, jobId).singleOrNull() ?: return null
        return session.copy(stale = !current(owner, session.snapshot, jobId))
    }
    @Transactional
    override fun review(identity: VerifiedIdentity, jobId: UUID, request: TailoringReviewRequest): CvTailoringSession {
        val owner = owner(identity, true); val session = read(owner, jobId, request.sessionId)
        if (session.revision != request.revision) throw CvFailure("CV_CONFLICT", 409)
        if (!current(owner, session.snapshot, jobId)) throw CvFailure("CV_SOURCE_CONFLICT", 409)
        TailoringReviewPolicy.validate(session.snapshot, request.reviews)
        jdbc.update("UPDATE cv_tailoring_session SET reviews=?::jsonb,revision=revision+1 WHERE owner_id=? AND id=?", json.writeValueAsString(request.reviews), owner, session.id)
        return read(owner, jobId, session.id)
    }
}
