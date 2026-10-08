package com.careeragent.documents.application

import com.careeragent.documents.domain.AnalysisBatch
import java.util.UUID

/** Exact contiguous source coverage. Repeated nearby context is overhead, not counted twice. */
internal object DocumentAnalysisPlanner {
    const val BATCH_CHARACTERS = 3500
    private val globalBoundary = Regex("(?iu)^(?:profil|profile|kjernekompetanse|core (?:skills|competencies)|skills|kompetanse|technical skills|utdanning|education|interesser|interests|nøkkelkvalifikasjoner|key qualifications|sertifiseringer|certifications|arbeidserfaring|work experience|experience|projects|prosjekter|courses|kurs)$")
    private val detailHeading = Regex("(?iu)^(?:teknologi(?:er)?|technology|technologies|tech stack|stack|frontend|backend(?:\\s*&\\s*api)?|sky\\s*&\\s*devops|cloud(?:\\s*&\\s*devops)?|data|integrasjoner|integrations|arkitektur|architecture|languages|programmeringsspråk|responsibilities|ansvar|key contributions|contributions|leveranser)$")
    private fun headingLabel(value: String) = value.trim().trimStart('#',' ').trimEnd(':').trim()
    /** Generic subsection labels keep the current literal context; global sections reset it. */
    fun contextHeader(text: String, start: Int): Pair<Int,String>? = contextHeader(headers(text),start)
    fun contextHeader(headings: List<Pair<Int,String>>, start: Int): Pair<Int,String>? {
        var current: Pair<Int,String>? = null
        fun level(value: String) = value.trimStart().takeWhile { it == '#' }.length
        headings.takeWhile { it.first < start }.forEach { header ->
            when {
                globalBoundary.matches(headingLabel(header.second)) -> current = null
                detailHeading.matches(headingLabel(header.second)) -> {
                    // A same-level Markdown section is not part of the previous employer/project.
                    val depth = level(header.second)
                    val parent = current?.second?.let(::level) ?: 0
                    if (depth > 0 && (parent == 0 || depth <= parent)) current = null
                }
                else -> current = header
            }
        }
        return current
    }
    fun batches(approved: Map<UUID, String>): List<AnalysisBatch> = approved.flatMap { (id, text) ->
        val result = mutableListOf<AnalysisBatch>(); var start = 0
        val headings = headers(text)
        while (start < text.length) {
            var end = minOf(start + BATCH_CHARACTERS, text.length)
            if (end < text.length) {
                val newline = text.lastIndexOf('\n', end)
                val space = text.lastIndexOf(' ', end)
                val boundary = if (newline > start + BATCH_CHARACTERS / 2) newline + 1 else if (space > start) space + 1 else end
                end = boundary
            }
            val context = contextHeader(headings,start)?.second
            val prefix = context?.takeIf { start > 0 && !text.substring(start, end).contains(it) }?.let { "$it\n" }.orEmpty()
            result.add(AnalysisBatch(id, prefix + text.substring(start, end), end - start, start)); start = end
        }
        result
    }
    fun headers(text: String): List<Pair<Int, String>> {
        val lines = Regex("[^\\r\\n]+").findAll(text).toList()
        val explicit = Regex("(?i)^(?:(?:project|prosjekt|client|kunde|employer|arbeidsgiver)\\s*:|#{1,6}\\s+|.{1,100}\\s+[-–]\\s+\\()")
        val boundary = globalBoundary
        val date = "(?:\\d{2}[./](?:19|20)\\d{2}|(?:19|20)\\d{2}(?:-\\d{2})?)"
        val datedHeader = Regex("(?i)^$date\\s*[-–—]\\s*(?:$date|present|now|nå|dags dato)\\s+.+[\\p{L}].*$")
        val roleOrDate = Regex("(?i)(developer|utvikler|consultant|konsulent|lead|leder|engineer|cto|founder|student|bachelor|master|\\b(?:19|20)\\d{2}\\b)")
        return lines.mapIndexedNotNull { index, line ->
            val heading = line.value.trim()
            val next = lines.drop(index + 1).take(2).joinToString(" ") { it.value }
            val candidate = heading.length in 2..120 && heading.split(Regex("\\s+")).size <= 9 &&
                !heading.endsWith('.') && !heading.startsWith('-') && !heading.contains('@') && !heading.contains(':') &&
                !Regex("(?i)(teknologi|technology|ansvar|responsibilities|frontend|backend|skills|\\b(?:19|20)\\d{2}\\b)").containsMatchIn(heading) && roleOrDate.containsMatchIn(next)
            val timeline = heading.length <= 300 && datedHeader.matches(heading)
            if (explicit.containsMatchIn(heading) || boundary.matches(headingLabel(heading)) || detailHeading.matches(headingLabel(heading)) || candidate || timeline) line.range.first to heading else null
        }
    }
    fun contextProof(text: String, quote: String, label: String, selected: String?): String? {
        if (label.isBlank()) return null
        val term = Regex("(?<![\\p{L}\\p{N}_])" + Regex.escape(label) + "(?![\\p{L}\\p{N}_])", RegexOption.IGNORE_CASE)
        val headings = headers(text)
        return Regex(Regex.escape(quote)).findAll(text).mapNotNull { match ->
            val header = contextHeader(headings,match.range.first)?.second
            when {
                selected != null && quote.contains(selected) && term.containsMatchIn(selected) -> selected
                header != null && term.containsMatchIn(header) -> header
                term.containsMatchIn(quote) -> quote.take(300)
                else -> null
            }
        }.firstOrNull()
    }
}
