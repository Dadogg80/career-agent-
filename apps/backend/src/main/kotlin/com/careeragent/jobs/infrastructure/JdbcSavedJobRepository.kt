package com.careeragent.jobs.infrastructure

import com.careeragent.jobs.application.*
import com.careeragent.jobs.domain.*
import com.careeragent.profile.application.VerifiedIdentity
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.context.annotation.Profile
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.security.MessageDigest
import java.time.OffsetDateTime
import java.util.UUID

@Repository
@Profile("persistence")
class JdbcSavedJobRepository(private val jdbc: JdbcTemplate, private val mapper: ObjectMapper) : SavedJobRepository {
    private fun owner(identity: VerifiedIdentity, lock: Boolean = false): UUID = jdbc.query("SELECT u.id FROM app_user u JOIN career_profile p ON p.owner_id = u.id WHERE u.oidc_issuer = ? AND u.oidc_subject = ?" + if (lock) " FOR UPDATE OF u" else "", { row, _ -> row.getObject(1, UUID::class.java) }, identity.issuer, identity.subject).singleOrNull() ?: throw SavedJobFailure("PROFILE_NOT_CREATED", 404)
    private fun read(owner: UUID, id: UUID): SavedJob = jdbc.query("SELECT * FROM saved_job WHERE owner_id = ? AND id = ?", { row, _ -> SavedJob(row.getObject("id", UUID::class.java), mapper.readValue(row.getString("snapshot"), SavedJobContent::class.java), row.getObject("created_at", OffsetDateTime::class.java)) }, owner, id).singleOrNull() ?: throw SavedJobFailure("SAVED_JOB_NOT_FOUND", 404)
    @Transactional(readOnly = true)
    override fun get(identity: VerifiedIdentity, id: UUID) = read(owner(identity), id)
    @Transactional(readOnly = true)
    override fun list(identity: VerifiedIdentity): List<SavedJob> = jdbc.query("SELECT * FROM saved_job WHERE owner_id = ? ORDER BY created_at DESC LIMIT 100", { row, _ -> SavedJob(row.getObject("id", UUID::class.java), mapper.readValue(row.getString("snapshot"), SavedJobContent::class.java), row.getObject("created_at", OffsetDateTime::class.java)) }, owner(identity))
    @Transactional
    override fun save(identity: VerifiedIdentity, content: SavedJobContent): SavedJob {
        val owner = owner(identity, true)
        // Identical content reopens its immutable snapshot; changed analysis is a separate version.
        val fingerprint = MessageDigest.getInstance("SHA-256").digest(mapper.writeValueAsBytes(content.copy(retrievedAt = null))).joinToString("") { "%02x".format(it) }
        val existing = jdbc.query("SELECT id FROM saved_job WHERE owner_id = ? AND fingerprint = ?", { row, _ -> row.getObject(1, UUID::class.java) }, owner, fingerprint).singleOrNull()
        if (existing != null) return read(owner, existing)
        if (jdbc.queryForObject("SELECT COUNT(*) FROM saved_job WHERE owner_id = ?", Long::class.java, owner)!! >= 100) throw SavedJobFailure("SAVED_JOB_LIMIT", 409)
        val id = UUID.randomUUID()
        jdbc.update("INSERT INTO saved_job(id, owner_id, fingerprint, snapshot) VALUES (?, ?, ?, ?::jsonb)", id, owner, fingerprint, mapper.writeValueAsString(content))
        return read(owner, id)
    }
    @Transactional
    override fun delete(identity: VerifiedIdentity, id: UUID) {
        val owner = owner(identity, true); read(owner, id)
        if (jdbc.queryForObject("SELECT COUNT(*) FROM cv_version WHERE owner_id=? AND job_id=?", Long::class.java, owner, id) != 0L) throw SavedJobFailure("SAVED_JOB_IN_USE", 409)
        if(jdbc.queryForObject("SELECT COUNT(*) FROM application_case WHERE owner_id=? AND job_id=?",Long::class.java,owner,id) != 0L) throw SavedJobFailure("SAVED_JOB_IN_USE",409)
        jdbc.update("DELETE FROM saved_job WHERE owner_id = ? AND id = ?", owner, id)
    }
}
