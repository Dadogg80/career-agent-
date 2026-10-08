package com.careeragent.documents.application

/** Normalize only explicit endpoint months; preserve year precision and source wording. */
internal object DocumentCareerPeriod {
    data class Months(val start: String?, val end: String?)
    private const val endpoint = "(?:(?:19|20)\\d{2}(?:-(?:0[1-9]|1[0-2]))?|(?:0[1-9]|1[0-2])[./](?:19|20)\\d{2})"
    private val range = Regex("(?iu)^($endpoint)\\s*[-–—]\\s*($endpoint|present|now|nå|dags dato|ongoing)$")
    private val iso = Regex("^(?:19|20)\\d{2}-(?:0[1-9]|1[0-2])$")
    private val local = Regex("^(0[1-9]|1[0-2])[./]((?:19|20)\\d{2})$")
    private fun month(value: String): String? = if (iso.matches(value)) value else local.matchEntire(value)?.let { "${it.groupValues[2]}-${it.groupValues[1]}" }
    fun parse(period: String): Months {
        val text = period.trim()
        val match = range.matchEntire(text) ?: return Months(month(text),null)
        return Months(month(match.groupValues[1]),month(match.groupValues[2]))
    }
}
