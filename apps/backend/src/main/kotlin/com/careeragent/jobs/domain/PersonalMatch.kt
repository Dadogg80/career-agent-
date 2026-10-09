package com.careeragent.jobs.domain

import java.time.OffsetDateTime
import java.util.UUID

data class MatchSelection(val id: UUID, val revision: Long)
data class MatchRequest(val text: String, val claims: List<MatchSelection>, val locale: String, val consent: Boolean, val aiApproval: String? = null)
data class MatchClaim(val id: UUID, val revision: Long, val skill: String, val statement: String, val context: String)
enum class MatchKind { STRONG, PARTIAL, CLARIFY }
data class MatchEvidence(val claimId: UUID, val quote: String)
data class RequirementMatch(val requirementIndex: Int, val classification: MatchKind, val reason: String,
    val evidence: List<MatchEvidence>, val question: String, val evaluated: Boolean = true)
data class PersonalMatch(val id: UUID, val locale: String, val createdAt: OffsetDateTime,
    val assessments: List<RequirementMatch>, val claims: List<MatchClaim>, val omittedItems: Int,
    val inputCharacters: Int, val stale: Boolean = false, val provider: String = "Groq", val model: String? = null, val automaticEvidence: Boolean = false)
