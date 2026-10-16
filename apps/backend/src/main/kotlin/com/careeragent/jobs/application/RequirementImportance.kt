package com.careeragent.jobs.application

/** Importance needs explicit source wording, not the model's interpretation of emphasis. */
object RequirementImportance {
    private val mandatory = Regex("(?U)\\b(?:du må|you must|must have|must not|is required|are required|er et krav|det kreves|er påkrevd|er obligatorisk)\\b", RegexOption.IGNORE_CASE)
    private val preferred = Regex("(?U)\\b(?:er ønskelig|er en fordel|helst|preferably|preferred|desirable|an advantage)\\b", RegexOption.IGNORE_CASE)
    private val negated = Regex("(?U)\\b(?:ikke et krav|ikke påkrevd|ikke obligatorisk|not required|not mandatory|need not)\\b", RegexOption.IGNORE_CASE)
    private val requiredHeading = Regex("^(?:obligatoriske kvalifikasjoner|må[- ]krav|required qualifications|mandatory requirements|minimum requirements)[: ]*$", RegexOption.IGNORE_CASE)
    private val preferredHeading = Regex("^(?:ønskede kvalifikasjoner|ønskelig kompetanse|preferred qualifications|desirable qualifications|nice to have)[: ]*$", RegexOption.IGNORE_CASE)
    private val otherHeading = Regex("^(?:kvalifikasjoner|qualifications|requirements|egenskaper vi legger ekstra vekt på|personlige egenskaper|arbeidsoppgaver|responsibilities|vi tilbyr|what we offer|benefits|om oss|about us|hvem ser vi etter|kontakt|contact)[:? ]*$", RegexOption.IGNORE_CASE)
    private fun normalize(text: String) = text.replace(Regex("(?U)\\s+"), " ").trim()

    fun classify(source: String, quote: String, label: String? = null): RequirementKind {
        val wanted = normalize(quote)
        val contexts = mutableListOf<RequirementKind>()
        var heading: RequirementKind? = null
        for (raw in source.lines()) {
            val line = raw.trim().removePrefix("- ").removePrefix("* ")
            if (line.isEmpty()) heading = null
            val title = line.replace(Regex("^#{1,6}\\s+"), "").removeSurrounding("**").trim()
            when {
                requiredHeading.matches(title) -> heading = RequirementKind.REQUIRED
                preferredHeading.matches(title) -> heading = RequirementKind.PREFERRED
                otherHeading.matches(title) || raw.trim().startsWith("#") || title.endsWith(":") -> heading = null
            }
            // Use the containing sentence for short quotes, so qualifiers are not lost.
            for (sentence in line.split(Regex("(?<=[.!?])\\s+"))) {
                if (normalize(sentence).contains(wanted)) contexts += scopedPreference(sentence, wanted, label) ?: wording(sentence, heading)
            }
        }
        if (contexts.isEmpty()) {
            // Multi-line contextual quotes still contain independently scoped preferred examples.
            val scoped = quote.lines().mapNotNull { scopedPreference(it, wanted, label) }.distinct()
            return scoped.singleOrNull() ?: wording(quote, null)
        }
        return contexts.distinct().singleOrNull() ?: RequirementKind.UNCLEAR
    }

    // A preferred example after a comma must not weaken the broader capability before it.
    private fun scopedPreference(sentence: String, quote: String, label: String?): RequirementKind? {
        val match = Regex("(?iu),\\s*(?:gjerne|helst|preferably)\\s+([^,;.!?]+)").find(sentence) ?: return null
        val preferred = normalize(match.groupValues[1])
        val prefix = normalize(sentence.substring(0, match.range.first)).lowercase()
        val target = normalize(label ?: quote).lowercase()
        if (preferred.isBlank() || !target.contains(preferred.lowercase())) return null
        // A combined criterion still contains the general capability and has mixed importance.
        val explicitlyPreferredLabel = Regex("^(?:gjerne|helst|preferably)\\b").containsMatchIn(target)
        if (prefix.isNotBlank() && target.contains(prefix) && !explicitlyPreferredLabel) return null
        return RequirementKind.PREFERRED
    }

    private fun wording(text: String, heading: RequirementKind?): RequirementKind {
        if (negated.containsMatchIn(text)) return RequirementKind.UNCLEAR
        val must = mandatory.containsMatchIn(text)
        val wish = preferred.containsMatchIn(text)
        // A sentence mixing mandatory and desirable clauses needs separate, scoped criteria.
        if (must && wish || Regex(",\\s*(?:helst|preferably)\\b", RegexOption.IGNORE_CASE).containsMatchIn(text)) return RequirementKind.UNCLEAR
        if (wish) return RequirementKind.PREFERRED
        if (must) return RequirementKind.REQUIRED
        return heading ?: RequirementKind.UNCLEAR
    }
}
