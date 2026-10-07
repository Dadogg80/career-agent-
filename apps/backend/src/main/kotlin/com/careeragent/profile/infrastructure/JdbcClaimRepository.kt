package com.careeragent.profile.infrastructure

import com.careeragent.profile.application.*
import com.careeragent.profile.domain.*
import org.springframework.context.annotation.Profile
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.RowMapper
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.util.UUID

@Repository
@Profile("persistence")
class JdbcClaimRepository(private val jdbc: JdbcTemplate) : ClaimRepository {
    private val mapper = RowMapper { row, _ -> CompetencyClaim(
        row.getObject("id", UUID::class.java), row.getString("skill"), row.getString("statement"), row.getString("context"), row.getString("source_note"),
        ClaimStatus.valueOf(row.getString("status")), row.getLong("revision"), row.getObject("created_at", OffsetDateTime::class.java), row.getObject("updated_at", OffsetDateTime::class.java), row.getObject("source_document_id", UUID::class.java), row.getString("source_quote"),
    ) }
    private fun owner(identity: VerifiedIdentity, lock: Boolean = false): UUID = jdbc.query(
        """SELECT u.id FROM app_user u JOIN career_profile p ON p.owner_id = u.id
           WHERE u.oidc_issuer = ? AND u.oidc_subject = ?""" + if (lock) " FOR UPDATE OF u" else "",
        { row, _ -> row.getObject("id", UUID::class.java) }, identity.issuer, identity.subject,
    ).singleOrNull() ?: throw ClaimFailure("PROFILE_NOT_CREATED", 404)
    private fun current(owner: UUID, id: UUID): CompetencyClaim = jdbc.query(
        "SELECT * FROM competency_claim WHERE owner_id = ? AND id = ?", mapper, owner, id,
    ).singleOrNull() ?: throw ClaimFailure("CLAIM_NOT_FOUND", 404)
    private fun expected(claim: CompetencyClaim, revision: Long) {
        if (claim.revision != revision) throw ClaimFailure("CLAIM_CONFLICT", 409)
    }
    private fun record(owner: UUID, claim: CompetencyClaim, action: ClaimAction) {
        jdbc.update("""INSERT INTO competency_claim_revision(claim_id, revision, recorded_by, skill, statement, context, source_note, status, action, source_document_id, source_quote)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", claim.id, claim.revision, owner, claim.skill, claim.statement, claim.context, claim.sourceNote, claim.status.name, action.name, claim.sourceDocumentId, claim.sourceQuote)
    }

    @Transactional(readOnly = true)
    override fun list(identity: VerifiedIdentity): List<CompetencyClaim> = jdbc.query(
        "SELECT * FROM competency_claim WHERE owner_id = ? ORDER BY created_at DESC, id LIMIT 100", mapper, owner(identity),
    )

    @Transactional
    override fun create(identity: VerifiedIdentity, content: ClaimContent): CompetencyClaim {
        val owner = owner(identity, true)
        if (jdbc.queryForObject("SELECT COUNT(*) FROM competency_claim WHERE owner_id = ?", Long::class.java, owner)!! >= 100) throw ClaimFailure("CLAIM_LIMIT", 409)
        val id = UUID.randomUUID()
        jdbc.update("""INSERT INTO competency_claim(id, owner_id, skill, statement, context, source_note, status, revision, source_document_id, source_quote)
            VALUES (?, ?, ?, ?, ?, ?, 'UNVERIFIED', 1, ?, ?)""", id, owner, content.skill, content.statement, content.context, content.sourceNote, content.sourceDocumentId, content.sourceQuote)
        return current(owner, id).also { record(owner, it, ClaimAction.MANUAL_ENTRY) }
    }

    @Transactional
    override fun edit(identity: VerifiedIdentity, id: UUID, content: ClaimContent, revision: Long): CompetencyClaim {
        val owner = owner(identity, true)
        expected(current(owner, id), revision)
        jdbc.update("""UPDATE competency_claim SET skill = ?, statement = ?, context = ?, source_note = ?, status = ?, revision = revision + 1,
            updated_at = CURRENT_TIMESTAMP WHERE owner_id = ? AND id = ? AND revision = ?""", content.skill, content.statement, content.context, content.sourceNote, ClaimPolicy.afterContentEdit().name, owner, id, revision)
        return current(owner, id).also { record(owner, it, ClaimAction.CONTENT_EDIT) }
    }

    @Transactional
    override fun review(identity: VerifiedIdentity, id: UUID, decision: ReviewDecision, revision: Long): CompetencyClaim {
        val owner = owner(identity, true)
        val claim = current(owner, id)
        expected(claim, revision)
        val (status, action) = try { ClaimPolicy.review(claim.status, decision) } catch (_: IllegalArgumentException) { throw ClaimFailure("CLAIM_REVIEW_INVALID", 400) }
        jdbc.update("UPDATE competency_claim SET status = ?, revision = revision + 1, updated_at = CURRENT_TIMESTAMP WHERE owner_id = ? AND id = ? AND revision = ?", status.name, owner, id, revision)
        return current(owner, id).also { record(owner, it, action) }
    }

    @Transactional(readOnly = true)
    override fun history(identity: VerifiedIdentity, id: UUID): ClaimHistory {
        val owner = owner(identity)
        current(owner, id)
        val items = jdbc.query("""SELECT r.* FROM competency_claim_revision r JOIN competency_claim c ON c.id = r.claim_id
            WHERE c.owner_id = ? AND c.id = ? ORDER BY r.revision DESC LIMIT 20""", { row, _ -> ClaimRevision(
            row.getLong("revision"), row.getString("skill"), row.getString("statement"), row.getString("context"), row.getString("source_note"),
            ClaimStatus.valueOf(row.getString("status")), ClaimAction.valueOf(row.getString("action")), row.getObject("recorded_at", OffsetDateTime::class.java),
            sourceDocumentId = row.getObject("source_document_id", UUID::class.java), sourceQuote = row.getString("source_quote"),
        ) }, owner, id)
        val total = jdbc.queryForObject("SELECT COUNT(*) FROM competency_claim_revision WHERE claim_id = ? AND recorded_by = ?", Long::class.java, id, owner)!!
        return ClaimHistory(items, total)
    }

    @Transactional
    override fun delete(identity: VerifiedIdentity, id: UUID, revision: Long) {
        val owner = owner(identity, true)
        expected(current(owner, id), revision)
        jdbc.update("DELETE FROM competency_claim WHERE owner_id = ? AND id = ? AND revision = ?", owner, id, revision)
    }
}
