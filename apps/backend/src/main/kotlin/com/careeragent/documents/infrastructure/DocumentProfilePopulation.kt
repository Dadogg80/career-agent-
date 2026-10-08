package com.careeragent.documents.infrastructure

import com.careeragent.documents.domain.*
import com.careeragent.profile.application.*
import com.careeragent.profile.domain.*
import org.springframework.context.annotation.Profile
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import java.security.MessageDigest
import java.text.Normalizer
import java.util.Locale
import java.util.UUID

/** Called under the owner's lock in the same transaction as saved document progress. */
@Component
@Profile("persistence")
class DocumentProfilePopulation(private val jdbc: JdbcTemplate, private val claims: ClaimService, private val entries: CareerEntryService) {
    private fun normal(value: String) = Normalizer.normalize(value, Normalizer.Form.NFC).trim().replace(Regex("(?U)\\s+"), " ").lowercase(Locale.ROOT)
    private fun fingerprint(parts: List<String>) = MessageDigest.getInstance("SHA-256").digest(parts.joinToString("\u0000") { normal(it) }.toByteArray()).joinToString("") { "%02x".format(it) }
    private fun claimKey(draft:CompetencySuggestion)=fingerprint(listOf(draft.skill,draft.context,draft.quote,
        if(normal(draft.context) in setOf("kontekst ikke oppgitt","context not stated"))draft.documentId.toString() else ""))
    private fun entryKey(draft:CareerHistoryDraft)=draft.content.let { c -> fingerprint(listOf(c.kind.name,c.title,c.organization,c.client,c.deliveryRole,draft.periodText,
        if(draft.periodText.isBlank())draft.documentId.toString() else "")) }
    fun linkClaim(owner:UUID,draft:CompetencySuggestion,target:UUID)=link(owner,"CLAIM",claimKey(draft),target)
    fun linkEntry(owner:UUID,draft:CareerHistoryDraft,target:UUID)=link(owner,"ENTRY",entryKey(draft),target)
    private fun link(owner:UUID,kind:String,key:String,target:UUID) {
        jdbc.update("INSERT INTO document_profile_import(owner_id,kind,fingerprint,claim_id,entry_id) VALUES(?,?,?,?,?) ON CONFLICT(owner_id,kind,fingerprint) DO UPDATE SET claim_id=EXCLUDED.claim_id,entry_id=EXCLUDED.entry_id",
            owner,kind,key,if(kind=="CLAIM")target else null,if(kind=="ENTRY")target else null)
    }
    fun decorate(identity:VerifiedIdentity,owner:UUID,state:DocumentRunState):DocumentRunState {
        val ledger=jdbc.query("SELECT kind,fingerprint,claim_id,entry_id FROM document_profile_import WHERE owner_id=?",
            { r,_ -> (r.getString(1) to r.getString(2)) to Previous(r.getObject(if(r.getString(1)=="CLAIM")3 else 4,UUID::class.java)) },owner).toMap()
        if(ledger.isEmpty())return state
        val allClaims=claims.list(identity).associateBy { it.id };val allEntries=entries.list(identity).associateBy { it.id }
        val skills=state.analysis.suggestions.map { draft ->
            val link=ledger["CLAIM" to claimKey(draft)] ?: return@map draft
            val claim=allClaims[link.target]
            val status=if(claim==null)"REMOVED" else if(claim.status==ClaimStatus.CONFIRMED && claim.confirmationBasis==ConfirmationBasis.DOCUMENT)"DOCUMENTED"
                else when(claim.status){ClaimStatus.CONFIRMED->"CONFIRMED";ClaimStatus.REJECTED->"REJECTED";else->"DRAFT"}
            draft.copy(profileClaimId=claim?.id,reviewState=status)
        }
        val history=state.analysis.careerEntries.map { draft ->
            val link=ledger["ENTRY" to entryKey(draft)] ?: return@map draft
            val entry=allEntries[link.target]
            draft.copy(profileEntryId=entry?.id,reviewState=if(entry==null)"REMOVED" else when(entry.status){ClaimStatus.CONFIRMED->"CONFIRMED";ClaimStatus.REJECTED->"REJECTED";else->"DRAFT"})
        }
        return state.copy(analysis=state.analysis.copy(suggestions=skills,careerEntries=history))
    }
    private data class Previous(val target: UUID?)
    private fun previous(owner: UUID, kind: String, key: String): Previous? = jdbc.query(
        "SELECT claim_id,entry_id FROM document_profile_import WHERE owner_id=? AND kind=? AND fingerprint=?",
        { r, _ -> Previous(r.getObject(if(kind=="CLAIM") 1 else 2,UUID::class.java)) },owner,kind,key).singleOrNull()
    private fun remember(owner: UUID, kind: String, key: String, target: UUID) {
        jdbc.update("INSERT INTO document_profile_import(owner_id,kind,fingerprint,claim_id,entry_id) VALUES(?,?,?,?,?)",
            owner,kind,key,if(kind=="CLAIM")target else null,if(kind=="ENTRY")target else null)
    }
    private fun name(owner: UUID, source: CompetencySource): String? = jdbc.query(
        "SELECT original_name,extracted_text FROM career_document WHERE owner_id=? AND id=?",
        { r,_ -> if(r.getString(2).contains(source.quote))r.getString(1) else null },owner,source.documentId).singleOrNull()

    fun populate(identity: VerifiedIdentity, owner: UUID, state: DocumentRunState): DocumentRunState {
        val knownClaims=claims.list(identity).toMutableList()
        val knownEntries=entries.list(identity).toMutableList()
        var limited=state.populationLimited
        val suggestions=state.analysis.suggestions.map { draft ->
            val document=draft.documentId ?: return@map draft
            // A source mentioning a gap, wish or proposed skill is not an assertion of experience.
            if(Regex("(?iu)\\b(?:not|never|without|no experience|ikke|aldri|mangler|ønsker|planlegger)\\b").containsMatchIn(draft.quote)) return@map draft
            val source=CompetencySource(document,draft.quote)
            val original=name(owner,source) ?: return@map draft
            val key=claimKey(draft)
            val previous=previous(owner,"CLAIM",key)
            if(previous!=null) {
                val claim=knownClaims.find { it.id==previous.target }
                // Edited, rejected or deleted information is never restored by another analysis.
                if(claim?.revision==1L && claim.confirmationBasis==ConfirmationBasis.DOCUMENT && claim.status==ClaimStatus.CONFIRMED)
                    attachClaimSources(identity,owner,claim,draft)
                return@map draft.copy(profileClaimId=claim?.id)
            }
            if(knownClaims.size>=500){limited=true;return@map draft}
            val claim=claims.importDocumentFact(identity,ClaimContent(draft.skill,draft.quote.trim(),draft.context,"Document: $original",document,draft.quote))
            remember(owner,"CLAIM",key,claim.id)
            if(knownClaims.none { it.id==claim.id })knownClaims.add(claim)
            if(claim.revision==1L && claim.confirmationBasis==ConfirmationBasis.DOCUMENT)attachClaimSources(identity,owner,claim,draft)
            draft.copy(profileClaimId=claim.id)
        }
        val history=state.analysis.careerEntries.map { draft ->
            val source=CompetencySource(draft.documentId,draft.quote)
            val original=name(owner,source) ?: return@map draft
            // Description is generated wording. Identity relies on literal relationships and period.
            val c=draft.content
            val key=entryKey(draft)
            val previous=previous(owner,"ENTRY",key)
            if(previous!=null) {
                val entry=knownEntries.find { it.id==previous.target }
                if(entry?.revision==1L)attachEntrySources(owner,entry,draft)
                return@map draft.copy(profileEntryId=entry?.id)
            }
            val existing=knownEntries.find { entry -> val other=entry.content
                other.kind==c.kind && normal(other.title)==normal(c.title) && normal(other.organization)==normal(c.organization) &&
                    normal(other.client)==normal(c.client) && normal(other.deliveryRole)==normal(c.deliveryRole) &&
                    other.startMonth==c.startMonth && other.endMonth==c.endMonth && other.ongoing==c.ongoing && normal(other.description)==normal(c.description)
            }
            if(existing==null && knownEntries.size>=50){limited=true;return@map draft}
            val entry=existing ?: entries.create(identity,c.copy(sourceNote="${original.take(80)}: ${draft.quote.take(410)}"))
            remember(owner,"ENTRY",key,entry.id)
            if(existing==null)knownEntries.add(entry)
            if(entry.revision==1L)attachEntrySources(owner,entry,draft)
            draft.copy(profileEntryId=entry.id)
        }
        return state.copy(populationLimited=limited,analysis=state.analysis.copy(suggestions=suggestions,careerEntries=history))
    }
    private fun attachClaimSources(identity: VerifiedIdentity,owner: UUID,claim: CompetencyClaim,draft: CompetencySuggestion) {
        val known=claims.evidence(identity,claim.id)
        var count=known.size
        draft.additionalSources.distinct().forEach { source ->
            val original=name(owner,source) ?: return@forEach
            if(count<100 && known.none { it.documentId==source.documentId && it.quote==source.quote }) {
                // Only equivalent literal evidence belongs to this documentary assertion.
                if(normal(source.quote)==normal(claim.statement)) {
                    claims.importDocumentFact(identity,ClaimContent(claim.skill,source.quote.trim(),claim.context,"Document: $original",source.documentId,source.quote));count++
                }
            }
        }
    }
    private fun attachEntrySources(owner: UUID,entry: CareerEntry,draft: CareerHistoryDraft) {
        (listOf(CompetencySource(draft.documentId,draft.quote))+draft.additionalSources).distinct().take(100).forEach { source ->
            val original=name(owner,source) ?: return@forEach
            val count=jdbc.queryForObject("SELECT COUNT(*) FROM career_entry_evidence WHERE owner_id=? AND entry_id=?",Long::class.java,owner,entry.id)!!
            if(count<100)jdbc.update("INSERT INTO career_entry_evidence(entry_id,owner_id,revision,document_id,original_name,quote,period_text) VALUES(?,?,?,?,?,?,?) ON CONFLICT(entry_id,revision,document_id,quote) DO NOTHING",
                entry.id,owner,entry.revision,source.documentId,original,source.quote,draft.periodText)
        }
    }
}
