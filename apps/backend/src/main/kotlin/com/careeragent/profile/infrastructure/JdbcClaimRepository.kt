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
        ClaimStatus.valueOf(row.getString("status")), row.getLong("revision"), row.getObject("created_at", OffsetDateTime::class.java), row.getObject("updated_at", OffsetDateTime::class.java), row.getObject("source_document_id", UUID::class.java), row.getString("source_quote"), ConfirmationBasis.valueOf(row.getString("confirmation_basis")),
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
        jdbc.update("""INSERT INTO competency_claim_revision(claim_id, revision, recorded_by, skill, statement, context, source_note, status, action, source_document_id, source_quote, confirmation_basis)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", claim.id, claim.revision, owner, claim.skill, claim.statement, claim.context, claim.sourceNote, claim.status.name, action.name, claim.sourceDocumentId, claim.sourceQuote, claim.confirmationBasis.name)
    }

    @Transactional(readOnly = true)
    override fun list(identity: VerifiedIdentity): List<CompetencyClaim> = jdbc.query(
        "SELECT * FROM competency_claim WHERE owner_id = ? ORDER BY created_at DESC, id LIMIT 500", mapper, owner(identity),
    )

    private fun normalized(value: String) = java.text.Normalizer.normalize(value,java.text.Normalizer.Form.NFC).trim().replace(Regex("(?U)\\s+")," ").lowercase(java.util.Locale.ROOT)
    private fun attach(owner: UUID,claim: UUID,content: ClaimContent) {
        val document=content.sourceDocumentId ?: return
        val quote=content.sourceQuote ?: return
        val row=jdbc.query("SELECT original_name,extracted_text FROM career_document WHERE owner_id=? AND id=?",{r,_->r.getString(1) to r.getString(2)},owner,document).singleOrNull() ?: throw ClaimFailure("CLAIM_INVALID",400)
        if(!row.second.contains(quote)) throw ClaimFailure("CLAIM_INVALID",400)
        val hash=java.security.MessageDigest.getInstance("SHA-256").digest(quote.toByteArray()).joinToString("") { "%02x".format(it) }
        val duplicate=jdbc.queryForObject("SELECT COUNT(*) FROM competency_evidence WHERE owner_id=? AND claim_id=? AND document_id=? AND quote_hash=?",Long::class.java,owner,claim,document,hash)!!>0
        if(!duplicate && jdbc.queryForObject("SELECT COUNT(*) FROM competency_evidence WHERE owner_id=? AND claim_id=?",Long::class.java,owner,claim)!!>=100)throw ClaimFailure("CLAIM_EVIDENCE_LIMIT",409)
        jdbc.update("INSERT INTO competency_evidence(id,claim_id,owner_id,document_id,original_name,quote,quote_hash,statement,context) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(claim_id,document_id,quote_hash) DO NOTHING",UUID.randomUUID(),claim,owner,document,row.first,quote,hash,content.statement,content.context)
    }
    @Transactional(readOnly=true) override fun evidence(identity: VerifiedIdentity,id: UUID): List<ClaimEvidence> {
        val owner=owner(identity);current(owner,id)
        return jdbc.query("SELECT * FROM competency_evidence WHERE owner_id=? AND claim_id=? ORDER BY recorded_at LIMIT 100",{r,_->ClaimEvidence(r.getObject("id",UUID::class.java),r.getObject("document_id",UUID::class.java),r.getString("original_name"),r.getString("quote"),r.getString("statement"),r.getString("context"),r.getObject("recorded_at",OffsetDateTime::class.java))},owner,id)
    }
    @Transactional
    override fun create(identity: VerifiedIdentity, content: ClaimContent): CompetencyClaim {
        val owner = owner(identity, true)
        val knownContext=normalized(content.context) !in setOf("kontekst ikke oppgitt","context not stated")
        val existing=jdbc.query("SELECT * FROM competency_claim WHERE owner_id=?",mapper,owner).firstOrNull { normalized(it.skill)==normalized(content.skill) && normalized(it.statement)==normalized(content.statement) && normalized(it.context)==normalized(content.context) && (knownContext || it.sourceDocumentId==content.sourceDocumentId && it.sourceNote==content.sourceNote) }
        if(existing!=null) { attach(owner,existing.id,content);return existing }
        if (jdbc.queryForObject("SELECT COUNT(*) FROM competency_claim WHERE owner_id = ?", Long::class.java, owner)!! >= 500) throw ClaimFailure("CLAIM_LIMIT", 409)
        val id = UUID.randomUUID()
        jdbc.update("""INSERT INTO competency_claim(id, owner_id, skill, statement, context, source_note, status, revision, source_document_id, source_quote)
            VALUES (?, ?, ?, ?, ?, ?, 'UNVERIFIED', 1, ?, ?)""", id, owner, content.skill, content.statement, content.context, content.sourceNote, content.sourceDocumentId, content.sourceQuote)
        attach(owner,id,content)
        return current(owner, id).also { record(owner, it, ClaimAction.MANUAL_ENTRY) }
    }

    @Transactional
    override fun importDocumentFact(identity: VerifiedIdentity, content: ClaimContent): CompetencyClaim {
        val owner = owner(identity, true)
        val existing = jdbc.query("SELECT * FROM competency_claim WHERE owner_id=?", mapper, owner).firstOrNull {
            normalized(it.skill)==normalized(content.skill) && normalized(it.statement)==normalized(content.statement) &&
                normalized(it.context)==normalized(content.context) &&
                (normalized(content.context) !in setOf("kontekst ikke oppgitt", "context not stated") || it.sourceDocumentId==content.sourceDocumentId)
        }
        // Import cannot change a previously edited/reviewed claim or its evidence.
        if (existing != null) {
            if (existing.status==ClaimStatus.CONFIRMED && existing.confirmationBasis==ConfirmationBasis.DOCUMENT && existing.revision==1L)
                attach(owner, existing.id, content)
            return existing
        }
        if (jdbc.queryForObject("SELECT COUNT(*) FROM competency_claim WHERE owner_id=?", Long::class.java, owner)!! >= 500)
            throw ClaimFailure("CLAIM_LIMIT",409)
        val id=UUID.randomUUID()
        jdbc.update("INSERT INTO competency_claim(id,owner_id,skill,statement,context,source_note,status,revision,source_document_id,source_quote,confirmation_basis) VALUES(?,?,?,?,?,?,'CONFIRMED',1,?,?,'DOCUMENT')",
            id,owner,content.skill,content.statement,content.context,content.sourceNote,content.sourceDocumentId,content.sourceQuote)
        attach(owner,id,content)
        return current(owner,id).also { record(owner,it,ClaimAction.DOCUMENT_IMPORT) }
    }

    @Transactional
    override fun edit(identity: VerifiedIdentity, id: UUID, content: ClaimContent, revision: Long): CompetencyClaim {
        val owner = owner(identity, true)
        expected(current(owner, id), revision)
        jdbc.update("""UPDATE competency_claim SET skill = ?, statement = ?, context = ?, source_note = ?, confirmation_basis = 'NONE', status = ?, revision = revision + 1,
            updated_at = CURRENT_TIMESTAMP WHERE owner_id = ? AND id = ? AND revision = ?""", content.skill, content.statement, content.context, content.sourceNote, ClaimPolicy.afterContentEdit().name, owner, id, revision)
        return current(owner, id).also { record(owner, it, ClaimAction.CONTENT_EDIT) }
    }

    @Transactional
    override fun review(identity: VerifiedIdentity, id: UUID, decision: ReviewDecision, revision: Long): CompetencyClaim {
        val owner = owner(identity, true)
        val claim = current(owner, id)
        expected(claim, revision)
        val (status, action) = try { ClaimPolicy.review(if(claim.confirmationBasis==ConfirmationBasis.DOCUMENT && decision==ReviewDecision.CONFIRM) ClaimStatus.UNVERIFIED else claim.status, decision) } catch (_: IllegalArgumentException) { throw ClaimFailure("CLAIM_REVIEW_INVALID", 400) }
        jdbc.update("UPDATE competency_claim SET status = ?, confirmation_basis = ?, revision = revision + 1, updated_at = CURRENT_TIMESTAMP WHERE owner_id = ? AND id = ? AND revision = ?", status.name, if(status==ClaimStatus.CONFIRMED) "USER" else "NONE", owner, id, revision)
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
            sourceDocumentId = row.getObject("source_document_id", UUID::class.java), sourceQuote = row.getString("source_quote"), confirmationBasis = ConfirmationBasis.valueOf(row.getString("confirmation_basis")),
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
