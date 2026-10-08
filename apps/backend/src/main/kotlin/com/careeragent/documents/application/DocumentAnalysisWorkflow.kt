package com.careeragent.documents.application

import com.careeragent.ai.application.*
import com.careeragent.documents.domain.*
import com.careeragent.profile.application.*
import com.careeragent.profile.domain.*
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.util.UUID
import java.util.concurrent.Semaphore
import java.util.concurrent.atomic.AtomicInteger

interface DocumentRunRepository {
    fun latest(identity: VerifiedIdentity, scope: String): DocumentRunState?
    fun load(identity: VerifiedIdentity, id: UUID): DocumentRunState
    fun start(identity: VerifiedIdentity, state: DocumentRunState): DocumentRunState
    fun claim(identity: VerifiedIdentity, id: UUID, revision: Long): DocumentRunState?
    fun finish(identity: VerifiedIdentity, previous: DocumentRunState, next: DocumentRunState): DocumentRunState
    fun lock(identity: VerifiedIdentity, id: UUID): DocumentRunState
    fun attachEntry(identity: VerifiedIdentity, entry: CareerEntry, draft: CareerHistoryDraft)
    fun release(identity: VerifiedIdentity, id: UUID, revision: Long)
}

@Service
@Profile("persistence")
class DocumentAnalysisWorkflow(private val documents: DocumentRepository, private val runs: DocumentRunRepository,
    private val model: AiModel, private val mapper: ObjectMapper, private val entries: CareerEntryService, private val claims: ClaimService,
    @Value("\${DOCUMENT_AI_MAX_REQUESTS:40}") private val maxRequests: Int,
    @Value("\${DOCUMENT_AI_BATCH_DELAY_SECONDS:65}") private val delaySeconds: Int, private val routing: AiRouting = AiRouting(),
    @Value("\${DOCUMENT_GEMINI_BATCH_DELAY_SECONDS:5}") private val geminiDelaySeconds: Int = 5) {
    private val permit=Semaphore(1); private val used=AtomicInteger()
    fun latest(identity: VerifiedIdentity, scope: String) = runs.latest(identity,scope)?.let { checked(identity,it).view() }
    fun load(identity: VerifiedIdentity, id: UUID) = checked(identity,runs.load(identity,id)).view()
    private fun checked(identity: VerifiedIdentity, state: DocumentRunState): DocumentRunState {
        if(state.sources.any { (id,text) -> documents.detail(identity,id).text != text }) throw DocumentFailure("DOCUMENT_ANALYSIS_CONFLICT",409)
        return state
    }
    fun start(identity: VerifiedIdentity, scope: String, excerpts: List<DocumentExcerpt>, locale: String, consent: Boolean, aiApproval: String? = null): DocumentRunView {
        if(!consent) throw DocumentFailure("DOCUMENT_AI_CONSENT_REQUIRED",400)
        val plan=routing.resolveApproval(aiApproval,AiTask.DOCUMENT_EXTRACTION,AiTask.PROFILE_SUMMARY)
        val approval=plan.approval
        if(locale !in setOf("nb","en") || excerpts.size !in 1..20 || excerpts.map { it.documentId }.distinct().size != excerpts.size ||
            excerpts.any { it.text.isBlank() || it.text.length > 60000 } || excerpts.sumOf { it.text.length } !in 40..1200000 ||
            scope != "collection" && (excerpts.size != 1 || excerpts.first().documentId.toString() != scope)) throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400)
        val sources=excerpts.associate { it.documentId to documents.detail(identity,it.documentId) }
        if(sources.values.any { it.text.isBlank() }) throw DocumentFailure("DOCUMENT_AI_NO_TEXT",400)
        val approved=excerpts.associate { it.documentId to it.text }; val id=UUID.randomUUID()
        val analysis=DocumentAnalysis(id,locale,approval.selections.map { it.provider }.distinct().joinToString(" + "),emptyList(),emptyList(),0,sources.values.sumOf { it.text.length },true,0,OffsetDateTime.now(),
            excerpts.map { AnalysisDocument(it.documentId,sources.getValue(it.documentId).document.originalName,0,sources.getValue(it.documentId).text.length) })
        val state=DocumentRunState(id,scope,1,locale,"RUNNING",sources.mapValues { it.value.text },approved,
            DocumentAnalysisPlanner.batches(approved),0,null,null,analysis,approval.token,approval.selections)
        return runs.start(identity,state).view()
    }
    fun switchProvider(identity: VerifiedIdentity, id: UUID, revision: Long, consent: Boolean, aiApproval: String): DocumentRunView {
        if(!consent) throw DocumentFailure("DOCUMENT_AI_CONSENT_REQUIRED",400)
        val plan=routing.resolveApproval(aiApproval,AiTask.DOCUMENT_EXTRACTION,AiTask.PROFILE_SUMMARY)
        val state=checked(identity,runs.load(identity,id))
        if(state.revision!=revision || state.status=="COMPLETED") throw DocumentFailure("DOCUMENT_ANALYSIS_CONFLICT",409)
        if(state.aiApproval==plan.approval.token || state.aiApproval==null && plan.approval.selections.all { it.provider=="Groq" }) return state.view() // Never clear the same provider's quota wait.
        val claimed=runs.claim(identity,id,revision) ?: throw AiFailure("AI_BUSY",429)
        try {
            checked(identity,claimed)
            return runs.finish(identity,claimed,claimed.copy(revision=claimed.revision+1,status="RUNNING",issue=null,nextAt=null,
                aiApproval=plan.approval.token,plannedSelections=plan.approval.selections)).view()
        } finally { runs.release(identity,id,claimed.revision) }
    }
    fun next(identity: VerifiedIdentity, id: UUID, revision: Long): DocumentRunView {
        if(revision < 1) throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400)
        val current=checked(identity,runs.load(identity,id))
        // A repeated HTTP request returns the committed progress instead of spending another model call.
        if(current.revision != revision || current.status == "COMPLETED") return current.view()
        val plan=routing.resolveApproval(current.aiApproval,AiTask.DOCUMENT_EXTRACTION,AiTask.PROFILE_SUMMARY)
        if(current.nextAt?.isAfter(OffsetDateTime.now()) == true) return current.view()
        if(!permit.tryAcquire()) throw AiFailure("AI_BUSY",429)
        var claimed: DocumentRunState?=null
        try {
            claimed=runs.claim(identity,id,revision) ?: return runs.load(identity,id).view()
            val state=checked(identity,claimed)
            if(used.get() >= maxRequests) throw AiFailure("AI_BUDGET_REACHED",429)
            used.incrementAndGet()
            val extractor=DocumentDraftExtractor(ApprovedAiModel(model,routing,plan),mapper)
            val selected=plan.tasks.getValue(if(state.completed==state.batches.size)AiTask.PROFILE_SUMMARY else AiTask.DOCUMENT_EXTRACTION)
            val actual=(state.analysis.aiSelections+selected).distinct()
            if(state.completed==state.batches.size) {
                val profile=extractor.summarize(state.analysis.profile,state.analysis.suggestions,state.locale,state.analysis.careerEntries)
                checked(identity,state)
                val analysis=state.analysis.copy(aiSelections=actual,provider=actual.map { it.provider }.distinct().joinToString(" + "),profile=profile,summary=profile.map { CompetencySummary(it.text.take(500),it.quote.take(600),it.documentId) })
                return runs.finish(identity,state,state.copy(revision=state.revision+1,completed=state.completed+1,status="COMPLETED",issue=null,nextAt=null,analysis=analysis)).view()
            }
            val batch=state.batches[state.completed]
            val raw=extractor.extract(batch,state.approved.getValue(batch.documentId),state.locale)
            val original=state.sources.getValue(batch.documentId)
            val result=raw.copy(suggestions=raw.suggestions.filter { original.contains(it.quote) && (it.contextQuote==null || original.contains(it.contextQuote)) },
                profile=raw.profile.filter { original.contains(it.quote) },entries=raw.entries.filter { original.contains(it.quote) })
            checked(identity,state)
            val completed=state.completed+1
            val suggestions=mergeSuggestions(state.analysis.suggestions+result.suggestions)
            val career=(state.analysis.careerEntries+result.entries).groupBy { listOf(it.content.kind.name,normal(it.content.title),normal(it.content.organization),normal(it.content.client),it.periodText,normal(it.content.description),if(it.periodText.isBlank())it.documentId.toString() else "") }.values.map { group -> val first=group.first();first.copy(additionalSources=(first.additionalSources+group.drop(1).flatMap { listOf(CompetencySource(it.documentId,it.quote))+it.additionalSources }).distinct().take(100)) }
            val profile=(state.analysis.profile+result.profile).distinctBy { listOf(it.kind,normal(it.text),it.documentId.toString()) }
            val covered=state.batches.take(completed).groupBy { it.documentId }.mapValues { it.value.sumOf { batch -> batch.characters } }
            val partial=completed < state.batches.size || state.approved.any { (source,text) -> text != state.sources[source] }
            val analysis=state.analysis.copy(aiSelections=actual,provider=actual.map { it.provider }.distinct().joinToString(" + "),summary=profile.take(20).map { CompetencySummary(it.text.take(500),it.quote.take(600),it.documentId) },
                suggestions=suggestions.take(300),profile=profile.take(80),careerEntries=career.take(50),inputCharacters=maxOf(40,covered.values.sum()),partial=partial,
                omittedItems=minOf(200,state.analysis.omittedItems+result.omitted+(raw.suggestions.size-result.suggestions.size)+(raw.profile.size-result.profile.size)+(raw.entries.size-result.entries.size)+maxOf(0,suggestions.size-300)+maxOf(0,career.size-50)+maxOf(0,profile.size-80)),
                documents=state.analysis.documents.map { it.copy(inputCharacters=covered[it.documentId] ?: 0) })
            return runs.finish(identity,state,state.copy(revision=state.revision+1,completed=completed,
                status="RUNNING",issue=null,
                nextAt=OffsetDateTime.now().plusSeconds((if(plan.tasks.getValue(if(completed==state.batches.size)AiTask.PROFILE_SUMMARY else AiTask.DOCUMENT_EXTRACTION).provider=="Gemini")geminiDelaySeconds else delaySeconds).coerceIn(0,300).toLong()),analysis=analysis)).view()
        } catch(error: AiFailure) {
            val state=claimed ?: throw error
            return runs.finish(identity,state,state.copy(revision=state.revision+1,status="PAUSED",issue=error.code,
                nextAt=error.retryAfterSeconds?.let { OffsetDateTime.now().plusSeconds(it.toLong()) })).view()
        } finally { claimed?.let { runs.release(identity,id,it.revision) }; permit.release() }
    }
    private fun normal(value:String)=java.text.Normalizer.normalize(value,java.text.Normalizer.Form.NFC).trim().replace(Regex("(?U)\\s+")," ").lowercase(java.util.Locale.ROOT)
    private fun mergeSuggestions(values: List<CompetencySuggestion>)=values.groupBy {
        listOf(normal(it.skill),normal(it.context),normal(it.statement),if(it.context in setOf("Kontekst ikke oppgitt","Context not stated"))it.documentId.toString() else "")
    }.values.map { group -> val first=group.first(); first.copy(additionalSources=(first.additionalSources+group.drop(1).flatMap { item -> listOfNotNull(item.documentId?.let { CompetencySource(it,item.quote) })+item.additionalSources }).distinct().filterNot { it.documentId==first.documentId && it.quote==first.quote }.take(100)) }
    @Transactional
    fun importEntry(identity: VerifiedIdentity, id: UUID, key: UUID, content: CareerEntryContent, confirm: Boolean = false): CareerEntry {
        val state=checked(identity,runs.lock(identity,id)); val draft=state.analysis.careerEntries.find { it.key==key } ?: throw DocumentFailure("DOCUMENT_ANALYSIS_CONFLICT",409)
        val source=documents.detail(identity,draft.documentId)
        if(!source.text.contains(draft.quote)) throw DocumentFailure("DOCUMENT_ANALYSIS_CONFLICT",409)
        val sourced=content.copy(sourceNote="${source.document.originalName.take(80)}: ${draft.quote.take(410)}")
        // Repeated import cannot overwrite previously reviewed information or create duplicate timeline rows.
        val imported=entries.list(identity).find { existing -> val c=existing.content
            c.kind==sourced.kind && normal(c.title)==normal(sourced.title) && normal(c.organization)==normal(sourced.organization) &&
                normal(c.client)==normal(sourced.client) && c.startMonth==sourced.startMonth && c.endMonth==sourced.endMonth &&
                c.ongoing==sourced.ongoing && normal(c.description)==normal(sourced.description)
        } ?: entries.create(identity,sourced)
        runs.attachEntry(identity,imported,draft)
        draft.additionalSources.forEach { source -> runs.attachEntry(identity,imported,draft.copy(documentId=source.documentId,quote=source.quote)) }
        return if(confirm && imported.status!=ClaimStatus.CONFIRMED) entries.review(identity,imported.id,imported.revision,ReviewDecision.CONFIRM) else imported
    }
    @Transactional
    fun importClaim(identity: VerifiedIdentity,id:UUID,revision:Long,index:Int,skill:String,statement:String,context:String,confirm:Boolean):CompetencyClaim {
        val state=checked(identity,runs.lock(identity,id))
        if(state.revision!=revision)throw DocumentFailure("DOCUMENT_ANALYSIS_CONFLICT",409)
        val draft=state.analysis.suggestions.getOrNull(index) ?: throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400)
        val evidence=listOf(CompetencySource(draft.documentId ?: throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400),draft.quote))+draft.additionalSources
        var imported:CompetencyClaim?=null
        evidence.forEach { item ->
            val source=documents.detail(identity,item.documentId)
            if(!source.text.contains(item.quote))throw DocumentFailure("DOCUMENT_ANALYSIS_CONFLICT",409)
            val claim=claims.create(identity,ClaimContent(skill,statement,context,"AI-assisted document: ${source.document.originalName}",item.documentId,item.quote))
            if(imported==null)imported=claim
        }
        val claim=imported!!
        return if(confirm && claim.status!=ClaimStatus.CONFIRMED)claims.review(identity,claim.id,ReviewDecision.CONFIRM,claim.revision) else claim
    }
    fun editSummary(identity: VerifiedIdentity,id:UUID,index:Int,revision:Long,text:String):DocumentRunView {
        val state=checked(identity,runs.load(identity,id))
        if(state.status!="COMPLETED" || state.revision!=revision)throw DocumentFailure("DOCUMENT_ANALYSIS_CONFLICT",409)
        if(index !in state.analysis.profile.indices || text.trim().length !in 1..1000 || text.any { it.isISOControl() && it !in "\r\n\t" })throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400)
        val profile=state.analysis.profile.mapIndexed { at,item -> if(at==index)item.copy(text=text.trim()) else item }
        return runs.finish(identity,state,state.copy(revision=state.revision+1,analysis=state.analysis.copy(profile=profile,
            summary=profile.map { CompetencySummary(it.text.take(500),it.quote.take(600),it.documentId) }))).view()
    }
}
