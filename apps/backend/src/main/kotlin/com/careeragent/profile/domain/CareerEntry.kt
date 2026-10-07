package com.careeragent.profile.domain

import java.time.OffsetDateTime
import java.util.UUID

enum class EntryKind { EMPLOYMENT, PROJECT, EDUCATION, CERTIFICATION }
data class CareerEntryContent(val kind: EntryKind, val title: String, val organization: String,
    val client: String, val deliveryRole: String, val startMonth: String?, val endMonth: String?,
    val ongoing: Boolean, val description: String, val sourceNote: String)
data class CareerEntry(val id: UUID, val content: CareerEntryContent, val status: ClaimStatus,
    val revision: Long, val createdAt: OffsetDateTime, val updatedAt: OffsetDateTime)
