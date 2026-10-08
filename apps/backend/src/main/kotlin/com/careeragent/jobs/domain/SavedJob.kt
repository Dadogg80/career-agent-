package com.careeragent.jobs.domain

import com.careeragent.jobs.application.ExtractedRequirement
import com.careeragent.jobs.application.JobFact
import java.time.OffsetDateTime
import java.util.UUID

// Immutable received-source snapshot, not independently verified original publication.
data class SavedJobContent(val title: String, val sourceUrl: String?, val sourceType: String,
    val text: String, val locale: String, val requirements: List<ExtractedRequirement>,
    val facts: List<JobFact>, val omittedItems: Int, val retrievedAt: OffsetDateTime?)
data class SavedJob(val id: UUID, val content: SavedJobContent, val createdAt: OffsetDateTime)
