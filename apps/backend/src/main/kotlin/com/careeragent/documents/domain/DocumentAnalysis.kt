package com.careeragent.documents.domain

import java.time.OffsetDateTime
import java.util.UUID

data class CompetencySummary(val text: String, val quote: String, val documentId: UUID? = null)
data class CompetencySource(val documentId: UUID, val quote: String)
data class CompetencySuggestion(val skill: String, val statement: String, val context: String, val quote: String, val documentId: UUID? = null, val additionalSources: List<CompetencySource> = emptyList(), val contextQuote: String? = null, val category: String = "OTHER", val drafted: Boolean = false)
data class ProfileSummaryDraft(val kind: String, val text: String, val documentId: UUID, val quote: String, val additionalSources: List<CompetencySource> = emptyList())
data class CareerHistoryDraft(val key: UUID, val content: com.careeragent.profile.domain.CareerEntryContent, val periodText: String, val documentId: UUID, val quote: String, val additionalSources: List<CompetencySource> = emptyList())
data class AnalysisDocument(val documentId: UUID, val originalName: String, val inputCharacters: Int, val sourceCharacters: Int)
data class DocumentExcerpt(val documentId: UUID, val text: String)
data class DocumentAnalysis(val id: UUID, val locale: String, val provider: String,
    val summary: List<CompetencySummary>, val suggestions: List<CompetencySuggestion>,
    val inputCharacters: Int, val sourceCharacters: Int, val partial: Boolean, val omittedItems: Int,
    val createdAt: OffsetDateTime, val documents: List<AnalysisDocument> = emptyList(),
    val profile: List<ProfileSummaryDraft> = emptyList(), val careerEntries: List<CareerHistoryDraft> = emptyList(), val aiSelections: List<com.careeragent.ai.application.AiSelection> = emptyList())
