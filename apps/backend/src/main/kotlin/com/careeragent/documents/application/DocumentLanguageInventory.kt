package com.careeragent.documents.application

import com.careeragent.documents.domain.AnalysisBatch
import com.careeragent.documents.domain.CompetencySuggestion
import java.util.Locale

/** Recover literal natural-language rows, retaining stated proficiency rather than translating it into a level. */
internal object DocumentLanguageInventory {
    // A bounded Norwegian/English vocabulary deliberately excludes programming languages. Unsupported
    // names and narrative descriptions remain available to the existing reviewed AI extraction.
    private val names = ("norsk bokmål|norsk nynorsk|norwegian bokmål|norwegian nynorsk|mandarin chinese|" +
        "norsk|norwegian|bokmål|nynorsk|engelsk|english|italiensk|italian|svensk|swedish|dansk|danish|" +
        "finsk|finnish|islandsk|icelandic|tysk|german|fransk|french|spansk|spanish|portugisisk|portuguese|" +
        "nederlandsk|dutch|gresk|greek|polsk|polish|tsjekkisk|czech|slovakisk|slovak|ungarsk|hungarian|" +
        "rumensk|romanian|bulgarsk|bulgarian|albansk|albanian|bosnisk|bosnian|kroatisk|croatian|" +
        "serbisk|serbian|slovensk|slovenian|makedonsk|macedonian|estisk|estonian|latvisk|latvian|" +
        "litauisk|lithuanian|russisk|russian|ukrainsk|ukrainian|belarusian|tyrkisk|turkish|" +
        "arabisk|arabic|hebraisk|hebrew|persisk|persian|farsi|dari|pashto|kurdisk|kurdish|" +
        "urdu|hindi|punjabi|bengali|bengalsk|tamil|telugu|gujarati|nepali|nepalsk|" +
        "kinesisk|chinese|mandarin|kantonesisk|cantonese|japansk|japanese|koreansk|korean|" +
        "vietnamesisk|vietnamese|thai|indonesisk|indonesian|malayisk|malay|tagalog|filipino|" +
        "swahili|somali|somalisk|amharic|amharisk|tigrinya|tigrinja|sami|samisk|nordsamisk|" +
        "northern sami|sørsamisk|southern sami|lulesamisk|lule sami|irsk|irish|welsh|walisisk|" +
        "katalansk|catalan|baskisk|basque|georgisk|georgian|armensk|armenian|afrikaans|zulu").split('|')
    private val namePattern = names.sortedByDescending { it.length }.joinToString("|") { Regex.escape(it) }
    private val language = "(?:$namePattern)(?=$|[\\s,:;–—/()&-])"
    private val row = Regex("(?iu)^[-*•]?\\s*($language(?:\\s*(?:,|/|&|\\bog\\b|\\band\\b)\\s*$language)*)(.*)$")
    private val name = Regex("(?iu)(?<![\\p{L}\\p{N}])$language")
    private val section = Regex("(?iu)^(?:språk|språkkunnskaper|språkferdigheter|languages|language skills|language proficiency|spoken languages)(?:\\s*:\\s*(.*))?$")
    private val proficiency = Regex("(?iu)^(?:morsmål|mother tongue|first language|native(?: speaker| language)?|flytende|fluent|" +
        "grunnleggende|basic|elementary|nybegynner|beginner|middels|intermediate|avansert|advanced|" +
        "conversational|proficient|working proficiency|professional(?: working proficiency)?|profesjonelt(?: nivå)?|gode?(?: kunnskaper)?|" +
        "very good|svært gode?|[abc][12])(?:[\\s,;/&-]+(?:muntlig|skriftlig|oral|written|spoken|speaking|writing|reading|listening|speech|og|and|in|both|både))*[.]?$")
    private val negative = Regex("(?iu)\\b(?:not|never|without|no|none|wish|want|plan|planning|learn|learning|ikke|aldri|ingen|uten|ønsker|planlegger|lære|mangler)\\b")
    private val continuation = Regex("(?iu)^(?:muntlig|skriftlig|oral|written|spoken|speaking|writing|reading|listening|speech|og|and|in|both|både)(?:[\\s,;/&-]+(?:muntlig|skriftlig|oral|written|spoken|speaking|writing|reading|listening|speech|og|and|in|both|både))*[.]?$")
    private fun normalized(value: String) = value.trim().lowercase(Locale.ROOT).replace(Regex("(?U)\\s+"), " ")
    private fun level(value: String) = value.trim().trimStart(':', ',', ';', '-', '–', '—').trim().removeSurrounding("(", ")").trim().replace(Regex("(?U)\\s+"), " ")
    fun isLanguageRow(value: String) = row.matches(value.trim()) || name.containsMatchIn(value) && negative.containsMatchIn(value)
    fun isLanguageName(value: String) = normalized(value) in names

    fun recover(batch: AnalysisBatch, source: String, locale: String, existing: List<CompetencySuggestion>): List<CompetencySuggestion> {
        val result = mutableListOf<CompetencySuggestion>()
        val lines = Regex("[^\\r\\n]+").findAll(source).filter { it.value.isNotBlank() }.toList()
        val end = minOf(source.length, batch.sourceStart + batch.characters)
        var inSection = false
        var consumed = -1
        lines.forEachIndexed { index, line ->
            if (index <= consumed) return@forEachIndexed
            val text = line.value.trim()
            val heading = section.matchEntire(text.trimStart('#', ' ').trimEnd(':').trim())
            if (heading != null) inSection = true
            val contents = if (heading != null) heading.groupValues[1].trim().takeIf { it.isNotEmpty() } else text
            if (contents == null) return@forEachIndexed
            val matched = row.matchEntire(contents)
            if (matched == null) {
                inSection = false
                return@forEachIndexed
            }
            if (negative.containsMatchIn(contents)) return@forEachIndexed
            val labels = name.findAll(matched.groupValues[1]).map { it.value }.toList()
            var suffix = level(matched.groupValues[2])
            var last = line
            if (suffix.isEmpty()) {
                // PDF tables may put the name and level on separate rows. Quote both only after
                // the complete proof belongs to this portion, including the original whitespace.
                val next = lines.getOrNull(index + 1)
                val nextLevel = next?.value?.let(::level)
                when {
                    nextLevel != null && proficiency.matches(nextLevel) -> { last = next; consumed = index + 1; suffix = nextLevel }
                    nextLevel != null && negative.containsMatchIn(nextLevel) && row.matchEntire(next.value.trim()) == null -> {
                        inSection = false
                        return@forEachIndexed
                    }
                    !inSection -> return@forEachIndexed
                }
            }
            // Narrow oral/written continuations can wrap in PDFs; do not absorb other prose.
            if (suffix.isNotEmpty()) {
                var nextIndex = maxOf(index, consumed) + 1
                while (nextIndex < lines.size && nextIndex <= index + 3 && continuation.matches(level(lines[nextIndex].value))) {
                    suffix += " " + level(lines[nextIndex].value)
                    last = lines[nextIndex]
                    consumed = nextIndex++
                }
            }
            if (suffix.isNotEmpty() && !proficiency.matches(suffix)) return@forEachIndexed
            val quote = source.substring(line.range.first, last.range.last + 1).trim()
            if (quote.length !in 1..600 || labels.isEmpty()) return@forEachIndexed
            val belongs = if (batch.characters > 0) last.range.last in batch.sourceStart until end
                else line.range.first >= batch.sourceStart && batch.text.contains(quote)
            if (!belongs) return@forEachIndexed
            labels.forEach { skill ->
                if ((existing + result).none { normalized(it.skill) == normalized(skill) && it.quote.contains(quote) }) {
                    result.add(CompetencySuggestion(skill, quote,
                        if (locale == "nb") "Kontekst ikke oppgitt" else "Context not stated",
                        quote, batch.documentId, category = "OTHER", recovered = true))
                }
            }
        }
        return result
    }
}
