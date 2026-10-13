package com.careeragent.jobs.application

import java.text.Normalizer
import java.util.Locale

/** Narrow source checks, not a general semantic judge of employer requirements. */
object RequirementSourceGuard {
    private val offeredHeading = Regex(
        "^(?:vi tilbyr(?: deg)?|dette tilbyr (?:vi|de)|what we offer|we offer|benefits|what you get|hos oss får du)[: ]*$",
        RegexOption.IGNORE_CASE,
    )
    private val otherHeading = Regex(
        "^(?:arbeidsoppgaver|ansvarsområder|responsibilities|duties|qualifications|required qualifications|" +
            "preferred qualifications|requirements|kvalifikasjoner|ønskede kvalifikasjoner|obligatoriske kvalifikasjoner|" +
            "må[- ]krav|personlige egenskaper|hvem (?:vi|de) søker|hvem søker (?:vi|de)|hvem ser vi etter|who we seek|" +
            "om (?:oss|stillingen)|about (?:us|the role)|kontakt|contact)[:? ]*$",
        RegexOption.IGNORE_CASE,
    )
    private val benefit = Regex(
        "(?U)\\b(?:hjemmekontor|home office|remote work|salary|lønn|pensjon\\p{L}*|pension\\p{L}*|" +
            "forsikring\\p{L}*|insurance|ferie|holiday\\p{L}*|vacation|flexible working hours|" +
            "fleksibel arbeidstid|fleksible arbeidstider)\\b",
        RegexOption.IGNORE_CASE,
    )
    private val offerWording = Regex(
        "(?U)\\b(?:vi tilbyr(?: deg)?|we offer(?: you)?|you (?:get|receive)|du får|hos oss får du)\\b",
        RegexOption.IGNORE_CASE,
    )
    private val candidateWording = Regex(
        "(?U)\\b(?:du må|du skal|du vil|du har|du er|you must|must not|you (?:will|have|are)|" +
            "is required|are required|det kreves|er et krav|er ønskelig|er en fordel|er påkrevd|er obligatorisk|" +
            "is desirable|is preferred|is mandatory|is an advantage|preferably|should have|must have|" +
            "erfaring med|experience (?:with|in)|kunnskap om|knowledge (?:of|in)|" +
            "kompetanse (?:i|innen)|forvent\\p{L}*|expect\\p{L}*|" +
            "ansvar for|responsib\\p{L}*|arbeidsoppgaver|duties)\\b",
        RegexOption.IGNORE_CASE,
    )
    private val negatedStack = Regex(
        "(?U)\\b(?:vi er ikke opptatt av|we (?:are not|aren't) concerned (?:about|whether))\\b.*" +
            "\\b(?:samme|same)\\b.*\\b(?:stack|teknologi\\p{L}*|technolog\\p{L}*)\\b",
        RegexOption.IGNORE_CASE,
    )
    private val additionalClause = Regex("(?U)\\b(?:men|but|however)\\b|[;]", RegexOption.IGNORE_CASE)
    private val sentenceBoundary = Regex("(?<=[.!?])\\s+")
    // Natural-language names only; programming languages are deliberately outside this rule.
    private val languages = mapOf(
        "NORWEGIAN" to Regex("(?U)\\b(?:norsk\\p{L}*|norwegian)\\b", RegexOption.IGNORE_CASE),
        "SWEDISH" to Regex("(?U)\\b(?:svensk\\p{L}*|swedish)\\b", RegexOption.IGNORE_CASE),
        "DANISH" to Regex("(?U)\\b(?:dansk\\p{L}*|danish)\\b", RegexOption.IGNORE_CASE),
        "ENGLISH" to Regex("(?U)\\b(?:engelsk\\p{L}*|english)\\b", RegexOption.IGNORE_CASE),
        "GERMAN" to Regex("(?U)\\b(?:tysk\\p{L}*|german)\\b", RegexOption.IGNORE_CASE),
        "FRENCH" to Regex("(?U)\\b(?:fransk\\p{L}*|french)\\b", RegexOption.IGNORE_CASE),
        "ITALIAN" to Regex("(?U)\\b(?:italiensk\\p{L}*|italian)\\b", RegexOption.IGNORE_CASE),
        "SPANISH" to Regex("(?U)\\b(?:spansk\\p{L}*|spanish)\\b", RegexOption.IGNORE_CASE),
    )
    private val languageCapability = Regex(
        "(?U)\\b(?:språk\\p{L}*|language\\p{L}*|\\p{L}*kunnskap\\p{L}*|proficien\\p{L}*|fluent|" +
            "flytende|morsmål|native|speak\\p{L}*|snakk\\p{L}*|written|spoken|muntlig|skriftlig|" +
            "communicat\\p{L}*|kommuniser\\p{L}*)\\b",
        RegexOption.IGNORE_CASE,
    )

    /** A repeated short quote is rejected only when every occurrence has a rejected context. */
    fun omissionReason(source: String, label: String, quote: String): String? {
        val lines = contextLines(source)
        val normalizedSource = lines.joinToString(" ") { it.text }
        val wanted = normalize(quote)
        if (wanted.isEmpty()) return null
        val reasons = mutableListOf<String>()
        var offset = normalizedSource.indexOf(wanted)
        while (offset >= 0) {
            val selected = lines.filter { it.end > offset && it.start < offset + wanted.length }
            val line = selected.singleOrNull()
            // Keep complete qualifiers when the AI cited only a term from a longer sentence.
            val context = if (line != null) sentenceContext(line.text, offset - line.start, wanted.length)
                else selected.joinToString(" ") { it.text }
            val reason = rejection(context, wanted, selected.isNotEmpty() && selected.all { it.offer })
                ?: return languageLabelReason(label, wanted)
            reasons += reason
            offset = normalizedSource.indexOf(wanted, offset + wanted.length)
        }
        if (reasons.isEmpty()) return null
        return reasons.distinct().singleOrNull() ?: "NON_REQUIREMENT_SOURCE"
    }

    private fun languageLabelReason(label: String, quote: String): String? {
        if (!languageCapability.containsMatchIn(quote)) return null
        val sourceLanguages = languages.filterValues { it.containsMatchIn(quote) }.keys
        val labelLanguages = languages.filterValues { it.containsMatchIn(label) }.keys
        return if (sourceLanguages.isNotEmpty() && (labelLanguages - sourceLanguages).isNotEmpty())
            "UNSUPPORTED_LANGUAGE_LABEL" else null
    }

    private fun rejection(context: String, quote: String, offerSection: Boolean): String? {
        val sentence = context.removePrefix("- ").removePrefix("* ").trim()
        // Explicit non-interest in the same stack differs from an optional or prohibited qualification.
        if (negatedStack.find(sentence)?.range?.first == 0 && !additionalClause.containsMatchIn(sentence) &&
            !sentenceBoundary.containsMatchIn(sentence))
            return "NEGATED_STACK_EXPECTATION"
        if (benefit.containsMatchIn(quote) && !candidateWording.containsMatchIn(context) &&
            !additionalClause.containsMatchIn(context) &&
            (offerSection || offerWording.containsMatchIn(context))) return "OFFERED_BENEFIT"
        return null
    }

    /** Formatting-equivalent repeated criteria only; different evidence or labels remain distinct. */
    fun equivalent(first: ExtractedRequirement, second: ExtractedRequirement): Boolean =
        first.kind == second.kind && labelKey(first.label) == labelKey(second.label) &&
            normalize(first.quote) == normalize(second.quote)

    private fun labelKey(label: String) = normalize(label).lowercase(Locale.ROOT).trimEnd('.', ':', ';', ' ')
    private fun normalize(text: String) = Normalizer.normalize(text, Normalizer.Form.NFC)
        .replace(Regex("(?U)\\s+"), " ").trim()

    private fun sentenceContext(line: String, start: Int, length: Int): String {
        val boundaries = sentenceBoundary.findAll(line).toList()
        val beginning = boundaries.lastOrNull { it.range.last < start }?.range?.last?.plus(1) ?: 0
        val end = boundaries.firstOrNull { it.range.first >= start + length }?.range?.first ?: line.length
        return line.substring(beginning, end).trim()
    }

    private data class ContextLine(val text: String, val start: Int, val end: Int, val offer: Boolean)
    private fun contextLines(source: String): List<ContextLine> {
        var offer = false
        var offset = 0
        return source.lines().map { raw ->
            val text = normalize(raw)
            val title = text.replace(Regex("^#{1,6}\\s+"), "").removeSurrounding("**").trim()
            when {
                offeredHeading.matches(title) -> offer = true
                otherHeading.matches(title) || text.startsWith("#") -> offer = false
            }
            ContextLine(text, 0, 0, offer)
        }.filter { it.text.isNotEmpty() }.let { lines ->
            offset = 0
            lines.map { line -> line.copy(start = offset, end = offset + line.text.length)
                .also { offset += line.text.length + 1 } }
        }
    }
}
