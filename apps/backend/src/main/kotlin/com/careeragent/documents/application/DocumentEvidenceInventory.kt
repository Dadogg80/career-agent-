package com.careeragent.documents.application

import com.careeragent.documents.domain.*
import java.util.Locale
import java.util.UUID

/** Literal source coverage signals, not a semantic completeness or truth score. */
internal object DocumentEvidenceInventory {
    const val MAX_REPAIR_CALLS = 4
    private const val MAX_CANDIDATES = 2000
    private val contact = Regex("(?iu)(@|https?://|www\\.|\\+\\d|^(?:phone|telefon|email|e-post|referanser|references|født|born)\\b)")
    private val action = Regex("(?iu)\\b(?:built|developed|implemented|architected|designed|created|delivered|integrated|led|mentored|managed|owned|coordinated|utviklet|implementerte|designet|bygget|leverte|integrerte|ledet|veiledet|ansvar(?:lig)?|samarbeidet)\\b")
    private val learning = Regex("(?iu)\\b(?:education|utdanning|certification|sertifisering|course|kurs|bachelor|master|studier|university|universitet)\\b")
    private val dated = Regex("(?iu)^(?:\\d{2}[./])?(?:19|20)\\d{2}\\s*[-–—]\\s*(?:(?:\\d{2}[./])?(?:19|20)\\d{2}|present|nå|dags dato)\\s+.+")
    data class Candidate(val documentId: UUID, val kind: String, val start: Int, val quote: String, val skills: List<String> = emptyList(), val contextQuote: String? = null, val ambiguous: Boolean = false)
    data class Assessment(val candidates: List<Candidate>, val missing: List<Candidate>, val limited: Boolean) {
        fun report(repairCalls: Int) = DocumentCoverageReport(candidates.size, candidates.size - missing.size, missing.size,
            missing.take(40).map { DocumentCoveragePassage(it.documentId,it.kind,it.start,it.quote) }, limited, repairCalls)
    }
    fun assess(approved: Map<UUID,String>, analysis: DocumentAnalysis): Assessment {
        val candidates = approved.flatMap { (id,text) -> inventory(id,text) }
        val bounded = candidates.take(MAX_CANDIDATES)
        val evidence = (analysis.suggestions.flatMap { item -> listOfNotNull(item.documentId?.let { CompetencySource(it,item.quote) }) + item.additionalSources } +
            analysis.profile.flatMap { listOf(CompetencySource(it.documentId,it.quote)) + it.additionalSources } +
            analysis.careerEntries.flatMap { listOf(CompetencySource(it.documentId,it.quote)) + it.additionalSources }).groupBy { it.documentId }
        fun related(candidate: Candidate, source: CompetencySource, contextQuote: String? = null): Boolean =
            source.documentId==candidate.documentId && source.quote.contains(candidate.quote) &&
                (!candidate.ambiguous || candidate.contextQuote!=null && (contextQuote==candidate.contextQuote || source.quote.contains(candidate.contextQuote)))
        val missing = bounded.filter { candidate ->
            if (candidate.skills.isEmpty()) evidence[candidate.documentId].orEmpty().none { related(candidate,it) } &&
                analysis.suggestions.none { item -> item.documentId!=null && related(candidate,CompetencySource(item.documentId,item.quote),item.contextQuote) }
            else candidate.skills.any { skill -> analysis.suggestions.none { item -> normal(item.skill)==normal(skill) &&
                (item.documentId?.let { related(candidate,CompetencySource(it,item.quote),item.contextQuote) }==true ||
                    item.additionalSources.any { related(candidate,it) }) } }
        }
        return Assessment(bounded,missing,candidates.size > MAX_CANDIDATES)
    }
    fun inventory(id: UUID, text: String): List<Candidate> {
        val listFacts = DocumentCompetencyInventory.recover(AnalysisBatch(id,text,text.length),text,"en",emptyList())
            .groupBy { it.quote }
        val candidates = mutableListOf<Candidate>()
        var section = ""
        var searchAt = 0
        listFacts.forEach { (quote,items) ->
            // Keep every repeated occurrence, so evidence from one employer cannot cover another.
            Regex(Regex.escape(quote)).findAll(text).forEach { occurrence ->
                candidates.add(Candidate(id,"TECHNOLOGY",occurrence.range.first,quote,items.map { it.skill }.distinct()))
            }
        }
        val lines = Regex("[^\\r\\n]+").findAll(text).toList()
        val sourceHeaders = DocumentAnalysisPlanner.headers(text)
        val headers = sourceHeaders.map { it.first }.toSet()
        lines.forEachIndexed { index, line ->
            val content = line.value.trim()
            val heading = content.trimStart('#',' ').trimEnd(':')
            if (heading.length < 80 && !heading.endsWith('.') && !contact.containsMatchIn(heading)) {
                when {
                    Regex("(?iu)^(utdanning|education|kurs(?: og sertifiseringer)?|courses|certifications|sertifiseringer)$").matches(heading) -> section = "EDUCATION"
                    Regex("(?iu)^(interesser|interests)$").matches(heading) -> section = "INTERESTS"
                    line.range.first in headers -> section = ""
                }
            }
            if (content.length !in 12..600 || contact.containsMatchIn(content) || listFacts.containsKey(content)) return@forEachIndexed
            val kind = when {
                dated.matches(content) -> "EXPERIENCE"
                action.containsMatchIn(content) -> "DELIVERY"
                learning.containsMatchIn(content) || section == "EDUCATION" && Regex("\\b(?:19|20)\\d{2}\\b").containsMatchIn(content) -> "EDUCATION"
                section == "INTERESTS" && !Regex("(?iu)^(interesser|interests)$").matches(heading) -> "INTERESTS"
                else -> return@forEachIndexed
            }
            // Preserve wrapped prose and same-row role/date context within the quote bound.
            var quote = line.value
            if (kind == "DELIVERY") {
                for (next in lines.drop(index + 1).take(3)) {
                    val gap = text.substring(line.range.first + quote.length,next.range.first)
                    if (gap.count { it == '\n' } > 1 || action.containsMatchIn(next.value) ||
                        DocumentAnalysisPlanner.headers(next.value).isNotEmpty() || contact.containsMatchIn(next.value) ||
                        next.value.trim().startsWith('-') || quote.length + gap.length + next.value.length > 600) break
                    quote += gap + next.value
                }
            }
            if (line.range.first >= searchAt) {
                candidates.add(Candidate(id,kind,line.range.first,quote))
                searchAt = line.range.first + quote.length
            }
        }
        return candidates.distinctBy { listOf(it.documentId,it.start,it.kind) }.sortedBy { it.start }.map {
            it.copy(contextQuote=DocumentAnalysisPlanner.contextHeader(sourceHeaders,it.start)?.second,
                ambiguous=text.indexOf(it.quote)!=text.lastIndexOf(it.quote))
        }
    }
    fun repairBatches(assessment: Assessment, approved: Map<UUID,String>): List<AnalysisBatch> {
        val counts = mutableMapOf<UUID,Int>()
        val headers = approved.mapValues { DocumentAnalysisPlanner.headers(it.value) }
        return assessment.missing.asSequence().filter { it.kind != "TECHNOLOGY" }.sortedBy {
            when(it.kind) { "EXPERIENCE" -> 0; "EDUCATION" -> 1; "DELIVERY" -> 2; else -> 3 }
        }.filter { counts.getOrDefault(it.documentId,0) < 2 }.map { item ->
            counts[item.documentId] = counts.getOrDefault(item.documentId,0) + 1
            val text = approved.getValue(item.documentId)
            val sourceHeaders = headers.getValue(item.documentId)
            val heading = DocumentAnalysisPlanner.contextHeader(sourceHeaders,item.start)?.second
            var excerpt = item.quote
            // Date/organization rows need adjacent literal role evidence for history extraction.
            if (item.kind in setOf("EXPERIENCE","EDUCATION")) {
                val end = minOf(text.length,item.start + 1000)
                val nextHeader = sourceHeaders.firstOrNull { it.first > item.start }?.first ?: end
                excerpt = text.substring(item.start,minOf(end,nextHeader)).trimEnd().take(1000)
            }
            AnalysisBatch(item.documentId,(heading?.let { "$it\n" }.orEmpty()) + excerpt,0,item.start,repair=true)
        }.take(MAX_REPAIR_CALLS).toList()
    }
    private fun normal(value: String) = value.trim().lowercase(Locale.ROOT)
}
