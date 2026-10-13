package com.careeragent.jobs.application

/** Exclude recognizable recommendation tails, keeping analysis quotes literal in the retained source prefix. */
internal object AdvertisementAnalysisSource {
    private fun heading(line: String) = line.trim().replace(Regex("^#{1,6}\\s+"), "")
        .removeSurrounding("**").trim().trimEnd(':').trim()
    private val recommendations = Regex("(?iu)^(?:relaterte stillinger|lignende stillinger|andre stillinger|anbefalte stillinger|similar jobs|related jobs|recommended jobs|people also viewed|you might also like)(?:\\s*\\(\\d+\\))?$")
    private val footer = Regex("(?iu)^(?:annonseinformasjon|advertisement information|ad information)$")
    private val age = Regex("(?iu)^-?\\s*(?:\\d+|en|one)\\s+(?:dag(?:er)?|days?|uker?|weeks?|måned(?:er)?|months?)\\s+(?:siden|ago)$")

    fun prepare(source: String): String {
        val lines = Regex("[^\\r\\n]+").findAll(source).toList()
        var end = lines.firstOrNull { recommendations.matches(heading(it.value)) }?.range?.first ?: source.length
        val footerIndex = lines.indexOfFirst { footer.matches(heading(it.value)) }
        if (footerIndex >= 0) {
            // Some browser excerpts omit the recommendation heading. Require repeated posted-age/title/company cards.
            val cards = (footerIndex + 1 until lines.size).filter { index ->
                age.matches(lines[index].value.trim()) && lines.drop(index + 1).take(2).let { following ->
                    following.size == 2 && following.all { line ->
                        val text = line.value.trim()
                        text.length in 2..200 && !text.startsWith('-') && !text.startsWith('#') && !text.contains(':')
                    }
                }
            }
            if (cards.size >= 2) {
                val first = cards.first()
                val start = if (first > footerIndex + 1 && lines[first - 1].value.trim().startsWith('-')) first - 1 else first
                end = minOf(end, lines[start].range.first)
            }
        }
        return if (end == source.length) source else source.substring(0,end).trimEnd()
    }

    /** Redacting a preview heading must not restore recommendation lines from the saved source. */
    fun preparePreview(source: String, preview: String): String {
        val retained = prepare(source)
        if (preview == source) return retained
        return prepare(preview).lines().filter { it.isBlank() || retained.contains(it) }.joinToString("\n").trimEnd()
    }
}
