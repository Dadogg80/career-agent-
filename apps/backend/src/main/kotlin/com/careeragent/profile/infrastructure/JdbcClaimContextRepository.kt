package com.careeragent.profile.infrastructure

import com.careeragent.profile.application.*
import com.careeragent.profile.domain.*
import org.springframework.context.annotation.Profile
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Isolation
import org.springframework.transaction.annotation.Transactional
import java.text.Normalizer
import java.util.Locale
import java.util.UUID

@Repository
@Profile("persistence")
class JdbcClaimContextRepository(private val jdbc: JdbcTemplate, private val claims: ClaimRepository,
    private val entries: CareerEntryRepository) : ClaimContextRepository {
    private fun owner(identity: VerifiedIdentity, lock: Boolean = false): UUID = jdbc.query(
        "SELECT u.id FROM app_user u JOIN career_profile p ON p.owner_id=u.id WHERE u.oidc_issuer=? AND u.oidc_subject=?" + if(lock) " FOR UPDATE OF u" else "",
        { r, _ -> r.getObject(1, UUID::class.java) }, identity.issuer, identity.subject).singleOrNull()
        ?: throw ContextFailure("PROFILE_NOT_CREATED", 404)
    private fun claim(identity: VerifiedIdentity, id: UUID) = claims.list(identity).find { it.id == id }
        ?: throw ContextFailure("CLAIM_NOT_FOUND", 404)
    private data class Event(val entryId: UUID, val version: Long, val claimRevision: Long, val entryRevision: Long,
        val decision: ContextDecision, val basis: ConfirmationBasis, val document: UUID?, val quote: String?, val unchanged: Boolean)
    private fun events(owner: UUID, claimId: UUID): List<Event> = jdbc.query(
        """SELECT DISTINCT ON (l.entry_id) l.*,
           (c.skill=r.skill AND c.statement=r.statement AND c.context=r.context
            AND c.source_note=r.source_note AND c.source_document_id IS NOT DISTINCT FROM r.source_document_id
            AND c.source_quote IS NOT DISTINCT FROM r.source_quote AND e.content=er.snapshot->'content') AS unchanged
           FROM claim_career_context l JOIN competency_claim c ON c.id=l.claim_id AND c.owner_id=l.owner_id
           JOIN competency_claim_revision r ON r.claim_id=l.claim_id AND r.revision=l.claim_revision AND r.recorded_by=l.owner_id
           JOIN career_entry e ON e.id=l.entry_id AND e.owner_id=l.owner_id
           JOIN career_entry_revision er ON er.entry_id=l.entry_id AND er.revision=l.entry_revision AND er.owner_id=l.owner_id
           WHERE l.owner_id=? AND l.claim_id=? ORDER BY l.entry_id,l.version DESC""",
        { r, _ -> Event(r.getObject("entry_id",UUID::class.java),r.getLong("version"),r.getLong("claim_revision"),r.getLong("entry_revision"),
            ContextDecision.valueOf(r.getString("decision")),ConfirmationBasis.valueOf(r.getString("basis")),r.getObject("document_id",UUID::class.java),
            r.getString("source_quote"),r.getBoolean("unchanged")) },owner,claimId)
    private fun overview(identity: VerifiedIdentity, owner: UUID, claim: CompetencyClaim): ClaimContextOverview {
        val current = entries.list(identity).associateBy { it.id }
        return ClaimContextOverview(claim.revision, events(owner,claim.id).mapNotNull { event -> current[event.entryId]?.let { entry ->
            val state = when {
                event.decision == ContextDecision.UNLINK -> ContextState.REMOVED
                !event.unchanged -> ContextState.STALE
                claim.status == ClaimStatus.REJECTED || entry.status == ClaimStatus.REJECTED -> ContextState.INACTIVE
                else -> ContextState.CURRENT
            }
            ClaimCareerContext(entry,event.version,state,event.basis,event.document,event.quote)
        } })
    }
    @Transactional(readOnly=true, isolation=Isolation.REPEATABLE_READ) override fun overview(identity: VerifiedIdentity, claimId: UUID): ClaimContextOverview =
        overview(identity,owner(identity),claim(identity,claimId))

    @Transactional override fun decide(identity: VerifiedIdentity, claimId: UUID, command: ContextCommand): ClaimContextOverview {
        val owner=owner(identity,true);val claim=claim(identity,claimId)
        val entry=entries.list(identity).find { it.id==command.entryId } ?: throw ContextFailure("ENTRY_NOT_FOUND",404)
        if(claim.revision!=command.claimRevision || entry.revision!=command.entryRevision) throw ContextFailure("CONTEXT_CONFLICT",409)
        val previous=events(owner,claimId).find { it.entryId==entry.id }
        if((previous?.version ?: 0)!=command.version) {
            // A retried identical command is safe; a different tab's decision is never overwritten.
            if(previous?.version==command.version+1 && previous.decision==command.decision && previous.basis==ConfirmationBasis.USER &&
                previous.claimRevision==claim.revision && previous.entryRevision==entry.revision) return overview(identity,owner,claim)
            throw ContextFailure("CONTEXT_CONFLICT",409)
        }
        if(command.decision==ContextDecision.LINK && (claim.status==ClaimStatus.REJECTED || entry.status==ClaimStatus.REJECTED))
            throw ContextFailure("CONTEXT_INVALID",400)
        if(command.decision==ContextDecision.UNLINK && (previous==null || previous.decision==ContextDecision.UNLINK))
            throw ContextFailure("CONTEXT_INVALID",400)
        if(command.version>=1000) throw ContextFailure("CONTEXT_LIMIT",409)
        append(owner,claim,entry,command.version+1,command.decision,ConfirmationBasis.USER,null,null)
        return overview(identity,owner,claim)
    }
    private fun append(owner: UUID, claim: CompetencyClaim, entry: CareerEntry, version: Long, decision: ContextDecision,
        basis: ConfirmationBasis, document: UUID?, quote: String?) {
        jdbc.update("""INSERT INTO claim_career_context(owner_id,claim_id,entry_id,version,claim_revision,entry_revision,decision,basis,document_id,source_quote)
            VALUES(?,?,?,?,?,?,?,?,?,?)""",owner,claim.id,entry.id,version,claim.revision,entry.revision,decision.name,basis.name,document,quote)
    }
    private fun normal(value: String) = Normalizer.normalize(value,Normalizer.Form.NFC).trim().replace(Regex("(?U)\\s+")," ").lowercase(Locale.ROOT)
    private data class Proof(val entryId: UUID, val document: UUID, val quote: String)
    @Transactional override fun linkDocumentFacts(identity: VerifiedIdentity, claimIds: Set<UUID>) {
        if(claimIds.isEmpty()) return
        val owner=owner(identity,true)
        val currentEntries=entries.list(identity).associateBy { it.id }
        claims.list(identity).filter { it.id in claimIds && it.revision==1L && it.confirmationBasis==ConfirmationBasis.DOCUMENT && it.status==ClaimStatus.CONFIRMED }.forEach { claim ->
            if(events(owner,claim.id).isNotEmpty()) return@forEach
            val proof=jdbc.query("""SELECT ee.entry_id,ee.document_id,ee.quote
                FROM competency_evidence ce JOIN career_entry_evidence ee ON ee.owner_id=ce.owner_id AND ee.document_id=ce.document_id
                JOIN career_document d ON d.id=ee.document_id AND d.owner_id=ee.owner_id
                JOIN career_entry e ON e.id=ee.entry_id AND e.owner_id=ee.owner_id
                JOIN career_entry_revision er ON er.entry_id=ee.entry_id AND er.owner_id=ee.owner_id AND er.revision=ee.revision
                WHERE ce.owner_id=? AND ce.claim_id=? AND ce.statement=? AND ce.context=?
                AND e.content=er.snapshot->'content' AND strpos(ee.quote,ce.quote)>0 AND strpos(d.extracted_text,ee.quote)>0 ORDER BY ee.entry_id,ee.id""",
                { r,_ -> Proof(r.getObject(1,UUID::class.java),r.getObject(2,UUID::class.java),r.getString(3)) },owner,claim.id,claim.statement,claim.context)
                .filter { p -> currentEntries[p.entryId]?.content?.let { c ->
                    normal(claim.context) in listOf(c.organization,c.client,c.title).filter { it.isNotBlank() }.map(::normal) &&
                        Regex("(?<![\\p{L}\\p{N}])"+Regex.escape(normal(claim.context))+"(?![\\p{L}\\p{N}])").containsMatchIn(normal(p.quote))
                } == true }
            val entryId=proof.map { it.entryId }.distinct().singleOrNull() ?: return@forEach
            if(currentEntries.getValue(entryId).revision!=1L || currentEntries.getValue(entryId).status==ClaimStatus.REJECTED) return@forEach
            val source=proof.first { it.entryId==entryId }
            append(owner,claim,currentEntries.getValue(entryId),1,ContextDecision.LINK,ConfirmationBasis.DOCUMENT,source.document,source.quote)
        }
    }
}
