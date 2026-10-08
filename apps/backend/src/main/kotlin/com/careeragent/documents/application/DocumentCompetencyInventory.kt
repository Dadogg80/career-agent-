package com.careeragent.documents.application

import com.careeragent.documents.domain.AnalysisBatch
import com.careeragent.documents.domain.CompetencySuggestion
import java.util.Locale

/** Recover explicit list items without guessing neighboring skills or delivered work. */
internal object DocumentCompetencyInventory {
    private val label=Regex("(?iu)^(?:teknologi(?:er)?|technology|technologies|tech stack|stack|frontend|backend(?:\\s*&\\s*api)?|sky\\s*&\\s*devops|cloud\\s*&\\s*devops|cloud|data|integrasjoner|integrations|arkitektur|architecture|languages|programmeringsspråk)\\s*:\\s*(.+)$")
    private val section=Regex("(?iu)^(?:kjernekompetanse|core (?:skills|competencies)|technical skills|teknologier|technologies|frontend|backend(?:\\s*&\\s*api)?|sky\\s*&\\s*devops|cloud\\s*&\\s*devops|cloud|data|integrasjoner|integrations|arkitektur|architecture|languages|programmeringsspråk)$")
    private fun normal(text: String)=text.trim().lowercase(Locale.ROOT).replace(Regex("(?U)\\s+")," ")

    fun recover(batch: AnalysisBatch, source: String, locale: String, existing: List<CompetencySuggestion>): List<CompetencySuggestion> {
        val result=mutableListOf<CompetencySuggestion>()
        val headers=DocumentAnalysisPlanner.headers(source)
        var inList=false
        var position=batch.sourceStart
        Regex("[^\\r\\n]+").findAll(batch.text).forEach { line ->
            val text=line.value.trim()
            val heading=text.trimStart('#',' ').trimEnd(':')
            if(section.matches(heading)) {inList=true;return@forEach}
            if(Regex("(?iu)^(?:utdanning|education|interesser|interests|profil|profile|arbeidserfaring|work experience|experience|projects|prosjekter|courses|kurs|certifications|sertifiseringer)$").matches(heading)){inList=false;return@forEach}
            val explicit=label.matchEntire(text)
            val contents=explicit?.groupValues?.get(1) ?: text.takeIf { inList && (it.contains(',') || it.contains(';') || it.contains('•') || Regex("\\s+[-–]\\s+").containsMatchIn(it) || Regex("^[\\p{L}\\p{N}_+.#/-]{1,80}$").matches(it)) }
            if(contents==null) {
                // Empty lines do not end a list, but narrative and another section do.
                if(text.isNotEmpty()){inList=false}
                return@forEach
            }
            val at=source.indexOf(line.value,position)
            if(at<0 || text.length>600)return@forEach
            position=at+line.value.length
            val proof=DocumentAnalysisPlanner.contextHeader(headers,at)?.second
            val context=if(proof==null) {if(locale=="nb")"Kontekst ikke oppgitt" else "Context not stated"}
                else proof.trimStart('#',' ').replace(Regex("(?iu)^(?:project|prosjekt|client|kunde|employer|arbeidsgiver)\\s*:\\s*"),"").take(200)
            val words=contents.split(Regex("\\s*[,;•|]\\s*|\\s+[-–]\\s+")).map { it.trim().trimEnd('.') }.filter { it.isNotBlank() }
            // Lists only: reject sentences, contact data, empty labels and overlong free text.
            if(words.size !in 1..30 || words.any { it.length>120 || it.split(Regex("\\s+")).size>5 || it.contains('@') || it.contains("https://") })return@forEach
            words.distinctBy(::normal).forEach { skill ->
                if((existing+result).none { normal(it.skill)==normal(skill) && normal(it.context)==normal(context) && it.quote.contains(text) }) {
                    val statement=if(locale=="nb")"Dokumentet oppgir $skill i denne kompetanselisten." else "The document lists $skill in this skills section."
                    result.add(CompetencySuggestion(skill,statement,context,text,batch.documentId,contextQuote=proof?.takeIf { it.length<=300 },category="TECHNOLOGY",recovered=true))
                }
            }
        }
        return result
    }
}
