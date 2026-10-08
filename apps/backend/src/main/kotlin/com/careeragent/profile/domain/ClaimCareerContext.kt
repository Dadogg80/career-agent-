package com.careeragent.profile.domain

import java.util.UUID

enum class ContextDecision { LINK, UNLINK }
enum class ContextState { CURRENT, STALE, INACTIVE, REMOVED }
data class ClaimCareerContext(val entry: CareerEntry, val version: Long, val state: ContextState,
    val basis: ConfirmationBasis, val sourceDocumentId: UUID?, val sourceQuote: String?)
data class ClaimContextOverview(val claimRevision: Long, val links: List<ClaimCareerContext>)
data class ContextCommand(val entryId: UUID, val claimRevision: Long, val entryRevision: Long,
    val version: Long, val decision: ContextDecision)
