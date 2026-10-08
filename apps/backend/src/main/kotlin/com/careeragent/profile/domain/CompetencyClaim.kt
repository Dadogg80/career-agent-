package com.careeragent.profile.domain

import java.time.OffsetDateTime
import java.util.UUID

enum class ClaimStatus { UNVERIFIED, INFERRED, CONFIRMED, REJECTED }
enum class ClaimAction { MANUAL_ENTRY, CONTENT_EDIT, USER_CONFIRMATION, USER_REJECTION, DOCUMENT_IMPORT }
enum class ConfirmationBasis { NONE, USER, DOCUMENT }
enum class ReviewDecision { CONFIRM, REJECT }
data class ClaimContent(val skill: String, val statement: String, val context: String, val sourceNote: String, val sourceDocumentId: UUID? = null, val sourceQuote: String? = null)
data class CompetencyClaim(
    val id: UUID, val skill: String, val statement: String, val context: String, val sourceNote: String,
    val status: ClaimStatus, val revision: Long, val createdAt: OffsetDateTime, val updatedAt: OffsetDateTime,
    val sourceDocumentId: UUID? = null, val sourceQuote: String? = null,
    val confirmationBasis: ConfirmationBasis = ConfirmationBasis.NONE,
)
data class ClaimRevision(
    val revision: Long, val skill: String, val statement: String, val context: String, val sourceNote: String,
    val status: ClaimStatus, val action: ClaimAction, val recordedAt: OffsetDateTime,
    val recordedBy: String = "PROFILE_OWNER",
    val sourceDocumentId: UUID? = null, val sourceQuote: String? = null,
    val confirmationBasis: ConfirmationBasis = ConfirmationBasis.NONE,
)
data class ClaimEvidence(val id: UUID, val documentId: UUID?, val originalName: String, val quote: String, val statement: String, val context: String, val recordedAt: OffsetDateTime)
data class ClaimHistory(val items: List<ClaimRevision>, val total: Long)

object ClaimPolicy {
    fun review(status: ClaimStatus, decision: ReviewDecision): Pair<ClaimStatus, ClaimAction> {
        val target = if (decision == ReviewDecision.CONFIRM) ClaimStatus.CONFIRMED else ClaimStatus.REJECTED
        require(status != target) { "Claim already has this review status" }
        return target to if (decision == ReviewDecision.CONFIRM) ClaimAction.USER_CONFIRMATION else ClaimAction.USER_REJECTION
    }
    fun afterContentEdit(): ClaimStatus = ClaimStatus.UNVERIFIED
}
