package com.careeragent.jobs.application

/** Recover literal items in explicitly named duty sections, never inferred qualifications. */
internal object SourceDutyRecovery {
    private val duties = Regex("(?iu)^(?:viktigste arbeidsoppgaver|arbeidsoppgaver|dine arbeidsoppgaver|ansvarsområder|responsibilities|your responsibilities|key responsibilities|duties|main duties)[: ]*$")
    private val boundary = Regex("(?iu)^(?:hvem ser vi etter|hvem er du|kvalifikasjoner|qualifications|requirements|personlige egenskaper|personal attributes|vi tilbyr|what we offer|we offer|what you can expect|benefits|hvorfor .+|why .+|om .+|about .+|kontakt|contact|søknadsfrist|application deadline)[:? ]*$")
    private val bullet = Regex("^[-*•]\\s+")
    private fun heading(line: String) = line.trim().replace(Regex("^#{1,6}\\s+"), "").removeSurrounding("**").trim()
    private fun normal(text: String) = text.trim().replaceFirst(bullet, "").replace(Regex("(?U)\\s+"), " ").trim()

    fun recover(source: String, existing: List<ExtractedRequirement>): List<ExtractedRequirement> {
        val found = mutableListOf<ExtractedRequirement>()
        val lines = Regex("[^\\r\\n]+").findAll(source).toList()
        var active = false
        var index = 0
        while (index < lines.size) {
            val line = lines[index]
            val title = heading(line.value)
            if (duties.matches(title)) { active = true; index++; continue }
            if (boundary.matches(title) || line.value.trimStart().startsWith('#')) active = false
            if (!active || title.isBlank()) { index++; continue }
            // An unrecognized short heading is an ambiguous boundary, not another duty.
            if (!bullet.containsMatchIn(title) && title.split(Regex("\\s+")).size < 4 && !title.endsWith('.')) {
                active = false; index++; continue
            }
            val start = line.range.first + line.value.indexOfFirst { !it.isWhitespace() }.coerceAtLeast(0)
            var end = line.range.last + 1
            if (bullet.containsMatchIn(title)) {
                // Only indented continuations belong to this bullet; ambiguous layout stays with AI review.
                while (index + 1 < lines.size) {
                    val next = lines[index + 1]
                    if (!next.value.startsWith("  ") || bullet.containsMatchIn(next.value.trim()) || boundary.matches(heading(next.value)) || duties.matches(heading(next.value))) break
                    index++; end = next.range.last + 1
                }
            }
            val quote = source.substring(start, end).trimEnd()
            val content = quote.replaceFirst(bullet, "")
            // Unformatted source lists must still be substantive complete rows, not isolated wrapping fragments.
            val standalone = content.firstOrNull()?.isUpperCase() == true && content.split(Regex("\\s+")).size >= 4
            if (quote.length in 10..600 && (bullet.containsMatchIn(quote) || standalone) &&
                (existing + found).none { normal(it.quote).contains(normal(quote)) }) {
                val label = content.replace(Regex("(?U)\\s+"), " ").let { if (it.length <= 200) it else it.take(200).substringBeforeLast(' ') }
                found += ExtractedRequirement(label, RequirementImportance.classify(source, quote, label), quote)
            }
            index++
        }
        return found
    }
}
