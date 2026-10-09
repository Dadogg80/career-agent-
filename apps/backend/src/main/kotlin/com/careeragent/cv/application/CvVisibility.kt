package com.careeragent.cv.application

import com.careeragent.jobs.domain.*
import com.fasterxml.jackson.databind.JsonNode
import java.util.UUID

enum class CvVisibility { VISIBLE, WEAKLY_VISIBLE, NOT_VISIBLE, NEEDS_CLARIFICATION, UNASSESSED }
data class CvPassageEvidence(val paragraphIndex: Int, val quote: String)
data class CvVisibilityAssessment(val requirementIndex: Int, val status: CvVisibility, val reason: String,
    val claimIds: List<UUID>, val passages: List<CvPassageEvidence>)

/** Provenance and completion checks, not independent semantic verification of visibility. */
internal fun validatedVisibility(root: JsonNode, paragraphs: List<String>, match: PersonalMatch, count: Int, locale: String): List<CvVisibilityAssessment> {
    val found = mutableMapOf<Int,CvVisibilityAssessment>()
    val items=root.path("visibility")
    if(items.isArray && items.size() <= 256) for(item in items) try {
        require(item.isObject && item.fieldNames().asSequence().toSet()==setOf("requirementIndex","status","reason","claimIds","passages"))
        val index=item.path("requirementIndex"); require(index.isInt && index.asInt() in 0 until count && index.asInt() !in found)
        require(item.path("status").isTextual)
        val status=CvVisibility.valueOf(item.path("status").asText())
        val reason=item.path("reason");require(reason.isTextual && reason.asText().isNotBlank() && reason.asText().length<=600 && reason.asText().none {it.isISOControl() && it !in "\n\r\t"})
        val ids=item.path("claimIds");require(ids.isArray && ids.size()<=10)
        val claims=ids.map {require(it.isTextual);UUID.fromString(it.asText()).also {id->require(match.claims.any {c->c.id==id})}}.distinct()
        val sources=item.path("passages");require(sources.isArray && sources.size()<=5)
        val passages=sources.map {source->
            require(source.isObject && source.fieldNames().asSequence().toSet()==setOf("paragraphIndex","quote"))
            val position=source.path("paragraphIndex");val quote=source.path("quote")
            require(position.isInt && position.asInt() in paragraphs.indices && quote.isTextual && quote.asText().isNotBlank() && quote.asText().length<=500 && paragraphs[position.asInt()].contains(quote.asText()))
            CvPassageEvidence(position.asInt(),quote.asText())
        }.distinct()
        if(status in setOf(CvVisibility.VISIBLE,CvVisibility.WEAKLY_VISIBLE))require(passages.isNotEmpty())
        if(status==CvVisibility.NOT_VISIBLE)require(passages.isEmpty())
        val assessment=match.assessments.find {it.requirementIndex==index.asInt()}
        val established=assessment!=null && assessment.evaluated && assessment.classification!=MatchKind.CLARIFY && assessment.evidence.isNotEmpty()
        if(established && status in setOf(CvVisibility.VISIBLE,CvVisibility.WEAKLY_VISIBLE,CvVisibility.NOT_VISIBLE)) {
            require(claims.isNotEmpty() && claims.all {id->assessment?.evidence?.any {it.claimId==id}==true})
        }
        val adjusted=if(!established && status!=CvVisibility.UNASSESSED)CvVisibility.NEEDS_CLARIFICATION else status
        found[index.asInt()]=CvVisibilityAssessment(index.asInt(),adjusted,
            if(adjusted!=status) clarificationVisibilityReason(locale) else reason.asText(),claims,passages)
    }catch(_:IllegalArgumentException){ /* A malformed item cannot establish absence or a visibility gap. */ }
    return (0 until count).map {index->found[index]?:CvVisibilityAssessment(index,CvVisibility.UNASSESSED,
        if(locale=="nb")"AI returnerte ingen gyldig CV-vurdering for dette kravet. Det betyr ikke at kompetansen mangler."
        else "AI returned no valid CV assessment for this criterion. This does not establish a skill gap.",emptyList(),emptyList())}
}
private fun clarificationVisibilityReason(locale:String)=if(locale=="nb")
    "Kandidatgrunnlaget avklarer ikke dette kravet ennå. Kontroller erfaring eller kvalifikasjon før du legger det til i CV-en."
    else "The candidate evidence does not establish this criterion yet. Clarify the experience or qualification before adding it to your CV."
