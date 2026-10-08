package com.careeragent.documents.application

import com.careeragent.documents.domain.AnalysisBatch
import java.util.UUID

/** Exact contiguous source coverage. Repeated nearby context is overhead, not counted twice. */
internal object DocumentAnalysisPlanner {
    const val BATCH_CHARACTERS = 3500
    fun batches(approved: Map<UUID, String>): List<AnalysisBatch> = approved.flatMap { (id, text) ->
        val result = mutableListOf<AnalysisBatch>(); var start = 0
        while (start < text.length) {
            var end = minOf(start + BATCH_CHARACTERS, text.length)
            if (end < text.length) {
                val newline = text.lastIndexOf('\n', end)
                val space = text.lastIndexOf(' ', end)
                val boundary = if (newline > start + BATCH_CHARACTERS / 2) newline + 1 else if (space > start) space + 1 else end
                end = boundary
            }
            val context = nearestHeader(text, start)
            val prefix = context?.takeIf { start > 0 && !text.substring(start, end).contains(it) }?.let { "$it\n" }.orEmpty()
            result.add(AnalysisBatch(id, prefix + text.substring(start, end), end - start)); start = end
        }
        result
    }
    fun headers(text: String): List<Pair<Int, String>> {
        val lines = Regex("[^\\r\\n]+").findAll(text).toList()
        val explicit = Regex("(?i)^(?:(?:project|prosjekt|client|kunde|employer|arbeidsgiver)\\s*:|#{1,6}\\s+|.{1,100}\\s+[-–]\\s+\\()")
        val boundary = Regex("(?i)^(?:profil|profile|kjernekompetanse|core skills|skills|kompetanse|technical skills|teknologier|technologies|utdanning|education|interesser|interests|nøkkelkvalifikasjoner|key qualifications|sertifiseringer|certifications|arbeidserfaring|experience)$")
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
            if (explicit.containsMatchIn(heading) || boundary.matches(heading) || candidate || timeline) line.range.first to heading else null
        }
    }
    private fun nearestHeader(text: String, start: Int) = headers(text).lastOrNull { it.first < start }?.second
    fun contextProof(text: String, quote: String, label: String, selected: String?): String? {
        if (label.isBlank()) return null
        val term = Regex("(?<![\\p{L}\\p{N}_])" + Regex.escape(label) + "(?![\\p{L}\\p{N}_])", RegexOption.IGNORE_CASE)
        val headings = headers(text)
        return Regex(Regex.escape(quote)).findAll(text).mapNotNull { match ->
            val header = headings.lastOrNull { it.first < match.range.first }?.second
            when {
                selected != null && quote.contains(selected) && term.containsMatchIn(selected) -> selected
                header != null && term.containsMatchIn(header) -> header
                term.containsMatchIn(quote) -> quote.take(300)
                else -> null
            }
        }.firstOrNull()
    }
}
