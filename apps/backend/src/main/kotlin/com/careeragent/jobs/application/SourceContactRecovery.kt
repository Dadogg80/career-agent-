package com.careeragent.jobs.application

/** Recover literal contact blocks, without inferring people, titles or phone ownership. */
internal object SourceContactRecovery {
    private val related = Regex("(?im)^\\s*(?:#{1,6}\\s*)?(?:relaterte stillinger|lignende stillinger|andre stillinger|anbefalte stillinger|similar jobs|related jobs|recommended jobs)\\s*:?.*$")
    private val intro = Regex("(?iu)\\b(?:(?:kontaktperson(?:er)?|contact persons?|contact details)(?:[ \\t]*:|[ \\t]*$)|kontakt\\s*:|contact\\s*:|(?:ring|call)[ \\t]+[\\p{L}]|ta gjerne kontakt|for (?:more|further) information.{0,60}contact|spørsmål om stillingen)")
    private val email = Regex("[\\p{L}\\p{N}._%+\\-]+@[\\p{L}\\p{N}.\\-]+\\.[\\p{L}]{2,}")
    private val phone = Regex("(?<!\\d)(?:\\+\\d{1,3}[ \\t]*)?(?:\\d[ \\t-]*){8,12}(?!\\d)")
    private val labelledPhone = Regex("(?iu)\\b(?:tlf|tel|telefon|phone|mobile|mobil)\\b[ .:\\t\\r\\n]{0,20}(?:nr\\.?|number)?[ :\\t\\r\\n]{0,20}("+phone.pattern+")")
    private val callNumber = Regex("(?imu)^(?:ring|call)[ \\t]+[^\\r\\n]{1,120}\\r?\\n[ \\t\\r\\n]{0,20}("+phone.pattern+")")
    private val date = Regex("(?:\\d{1,2}[-./]\\d{1,2}[-./]\\d{2,4}|\\d{4}[-./]\\d{1,2}[-./]\\d{1,2}|\\d{4}\\s*[-–]\\s*\\d{4})")
    private val formal = Regex("(?iu)^(?:kontaktperson(?:er)?|contact persons?|contact details)(?:[ \\t]*:|[ \\t]*$)")
    private val boundary = Regex("(?iu)^(?:#{1,6}\\s|søknadsfrist\\b|frist\\b|deadline\\b|arbeidssted\\b|location\\b|ferdigheter\\b|skills\\b|om arbeidsgiveren\\b|om bedriften\\b|about the company\\b)")
    private val inlineBoundary = Regex("(?iu)\\b(?:søknadsfrist|frist|deadline|arbeidssted|sted|location)[ \\t]*:")
    private fun normal(text: String) = text.replace(Regex("(?U)\\s+"), " ").trim()
    private fun phoneNumber(text: String) = phone.matches(text.trim()) && !date.matches(text.trim())
    private fun hasPhone(text: String) = labelledPhone.findAll(text).any { phoneNumber(it.groupValues[1]) } || callNumber.findAll(text).any { phoneNumber(it.groupValues[1]) }

    fun merge(source: String, locale: String, facts: List<JobFact>): List<JobFact> {
        val cutoff = related.find(source)?.range?.first ?: source.length
        val lines = Regex("[^\\r\\n]+").findAll(source.substring(0, cutoff)).toList()
        val recovered = mutableListOf<JobFact>()
        for ((index, line) in lines.withIndex()) {
            val marker = intro.find(line.value) ?: continue
            val prefix = line.value.substring(0,marker.range.first)
            val startsWithName = formal.containsMatchIn(line.value.substring(marker.range.first)) && Regex("^[\\p{L}\\p{M}.' -]+,[ \\t]*$").matches(prefix)
            val start = line.range.first + if(startsWithName) 0 else marker.range.first
            val spacedSection = formal.containsMatchIn(line.value.substring(marker.range.first))
            var end = line.range.last + 1
            for (next in lines.drop(index + 1).take(5)) {
                val text = next.value.trim()
                val gap = source.substring(end, next.range.first)
                if (!spacedSection && Regex("\\r?\\n[ \\t]*\\r?\\n").containsMatchIn(gap) || intro.containsMatchIn(text) || boundary.containsMatchIn(text) ||
                    Regex("^[-*•]\\s").containsMatchIn(text) && !email.containsMatchIn(text) && !hasPhone(text) || next.range.last + 1 - start > 500) break
                end = next.range.last + 1
            }
            inlineBoundary.find(source.substring(start,end))?.let { end=start+it.range.first }
            val quote = source.substring(start,end)
            if (quote.length > 500 || !email.containsMatchIn(quote) && !hasPhone(quote)) continue
            // An invitation/header without inline metadata is evidence, not part of the contact value.
            val heading = source.substring(start,line.range.last + 1)
            val directCall = Regex("(?iu)^(?:ring|call)[ \\t]+").containsMatchIn(heading)
            val value = if (!startsWithName && !directCall && !email.containsMatchIn(heading) && !hasPhone(heading) && end > line.range.last + 1)
                source.substring(line.range.last + 1,end).trim() else quote.trim()
            if (value.isNotBlank() && recovered.none { it.value == value }) recovered.add(JobFact(JobFactKind.CONTACT,
                if (locale == "nb") "Kontaktopplysninger" else "Contact details",value,quote))
            if (recovered.size == 10) break
        }
        val result = facts.toMutableList()
        for (contact in recovered) {
            val matches = result.withIndex().filter { (_,fact) -> fact.kind == JobFactKind.CONTACT &&
                normal(contact.quote).contains(normal(fact.value)) &&
                (normal(fact.quote).length >= 20 || normal(fact.quote)==normal(fact.value) && (email.matches(fact.quote.trim()) || phoneNumber(fact.quote))) &&
                (normal(contact.quote).contains(normal(fact.quote)) || normal(fact.quote).contains(normal(contact.quote))) }
            val complete = matches.firstOrNull { normal(it.value.value)==normal(contact.value) }?.value
            // Prefer complete literal details over overlapping model paraphrases; retain unrelated contacts.
            val position = matches.firstOrNull()?.index ?: result.size
            matches.asReversed().forEach { result.removeAt(it.index) }
            result.add(position,complete ?: contact)
        }
        return result
    }
}
