package com.careeragent.cv.application

import com.careeragent.jobs.domain.MatchClaim

/** A lexical guard only: matching numbers cannot establish semantic truth or scope. */
object CvWordingGuard {
    private val numbers = Regex("(?<!\\d)\\d+(?:[.,]\\d+)*(?:\\s?%)?(?!\\d)")
    private fun tokens(text: String) = numbers.findAll(text).map { it.value.replace(" ", "") }.toSet()
    private val years = Regex("(?<!\\d)(?:19|20)\\d{2}(?!\\d)")
    fun supported(proposal: CvTextProposal, claims: List<MatchClaim>, preserveYears: Boolean = false): Boolean {
        val evidence = claims.filter { it.id in proposal.claimIds }.joinToString("\n") { it.statement + "\n" + it.context }
        val allowed=tokens(proposal.oldText + "\n" + evidence)
        return tokens(proposal.newText).all { it in allowed } && (!preserveYears || years.findAll(proposal.oldText).all { year -> year.value in tokens(proposal.newText) })
    }
}
