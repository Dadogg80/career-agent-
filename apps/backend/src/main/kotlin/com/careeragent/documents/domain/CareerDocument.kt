package com.careeragent.documents.domain

import java.time.OffsetDateTime
import java.util.UUID

data class CareerDocument(val id: UUID, val originalName: String, val mediaType: String, val byteSize: Long,
    val sha256: String, val language: String, val isMaster: Boolean, val createdAt: OffsetDateTime,
    val textCharacters: Int = 0, val extractionMethod: String = "TEXT", val analysis: DocumentAnalysisMetadata? = null)
data class DocumentDetail(val document: CareerDocument, val text: String)
interface DocumentStorage {
    fun put(id: UUID, bytes: ByteArray)
    fun read(id: UUID): ByteArray
    fun delete(id: UUID)
}

/** Library metadata only: completion is processing status, never factual approval or exhaustive recall. */
data class DocumentAnalysisMetadata(val status: String, val createdAt: OffsetDateTime,
    val collection: Boolean, val competencies: Int, val careerEntries: Int,
    val profileSections: Int, val inputCharacters: Int, val sourceCharacters: Int,
    val selections: List<com.careeragent.ai.application.AiSelection>)
