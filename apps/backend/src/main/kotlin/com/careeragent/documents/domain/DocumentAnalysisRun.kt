package com.careeragent.documents.domain

import java.time.OffsetDateTime
import java.util.UUID

data class AnalysisBatch(val documentId: UUID, val text: String, val characters: Int, val sourceStart: Int = 0, val repair: Boolean = false)
data class DocumentCoveragePassage(val documentId: UUID, val kind: String, val sourceStart: Int, val quote: String,
    val profileClaimId: UUID? = null, val profileEntryId: UUID? = null, val reviewState: String? = null)
data class DocumentCoverageReport(val detected: Int, val represented: Int, val remaining: Int,
    val passages: List<DocumentCoveragePassage>, val limited: Boolean, val repairCalls: Int)
data class DocumentRunState(val id: UUID, val scope: String, val revision: Long, val locale: String,
    val status: String, val sources: Map<UUID, String>, val approved: Map<UUID, String>,
    val batches: List<AnalysisBatch>, val completed: Int, val nextAt: OffsetDateTime?, val issue: String?,
    val analysis: DocumentAnalysis, val aiApproval: String? = null, val plannedSelections: List<com.careeragent.ai.application.AiSelection> = emptyList(), val populateProfile: Boolean = false, val populationLimited: Boolean = false,
    val coverageReview: Boolean = false, val coverage: DocumentCoverageReport? = null, val repairScheduled: Boolean = false)
data class DocumentRunView(val id: UUID, val scope: String, val revision: Long, val status: String,
    val completedBatches: Int, val totalBatches: Int, val nextAt: OffsetDateTime?, val issue: String?, val analysis: DocumentAnalysis, val aiApproval: String? = null, val plannedSelections: List<com.careeragent.ai.application.AiSelection> = emptyList(), val approvedDocuments: List<DocumentExcerpt> = emptyList(), val populateProfile: Boolean = false, val populationLimited: Boolean = false,
    val coverageReview: Boolean = false, val coverage: DocumentCoverageReport? = null, val phase: String = "SOURCE")
fun DocumentRunState.view() = DocumentRunView(id, scope, revision, status, completed, batches.size + 1, nextAt, issue, analysis, aiApproval, plannedSelections, approved.map { DocumentExcerpt(it.key,it.value) }, populateProfile, populationLimited,
    coverageReview,coverage,if(status=="COMPLETED")"COMPLETED" else if(completed==batches.size)"SUMMARY" else if(batches.getOrNull(completed)?.repair==true)"REPAIR" else "SOURCE")
