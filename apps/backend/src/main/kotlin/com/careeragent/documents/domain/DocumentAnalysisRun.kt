package com.careeragent.documents.domain

import java.time.OffsetDateTime
import java.util.UUID

data class AnalysisBatch(val documentId: UUID, val text: String, val characters: Int)
data class DocumentRunState(val id: UUID, val scope: String, val revision: Long, val locale: String,
    val status: String, val sources: Map<UUID, String>, val approved: Map<UUID, String>,
    val batches: List<AnalysisBatch>, val completed: Int, val nextAt: OffsetDateTime?, val issue: String?,
    val analysis: DocumentAnalysis, val aiApproval: String? = null, val plannedSelections: List<com.careeragent.ai.application.AiSelection> = emptyList())
data class DocumentRunView(val id: UUID, val scope: String, val revision: Long, val status: String,
    val completedBatches: Int, val totalBatches: Int, val nextAt: OffsetDateTime?, val issue: String?, val analysis: DocumentAnalysis, val aiApproval: String? = null, val plannedSelections: List<com.careeragent.ai.application.AiSelection> = emptyList(), val approvedDocuments: List<DocumentExcerpt> = emptyList())
fun DocumentRunState.view() = DocumentRunView(id, scope, revision, status, completed, batches.size + 1, nextAt, issue, analysis, aiApproval, plannedSelections, approved.map { DocumentExcerpt(it.key,it.value) })
