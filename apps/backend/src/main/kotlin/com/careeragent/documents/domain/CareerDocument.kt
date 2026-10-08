package com.careeragent.documents.domain

import java.time.OffsetDateTime
import java.util.UUID

data class CareerDocument(val id: UUID, val originalName: String, val mediaType: String, val byteSize: Long,
    val sha256: String, val language: String, val isMaster: Boolean, val createdAt: OffsetDateTime,
    val textCharacters: Int = 0, val extractionMethod: String = "TEXT")
data class DocumentDetail(val document: CareerDocument, val text: String)
interface DocumentStorage {
    fun put(id: UUID, bytes: ByteArray)
    fun read(id: UUID): ByteArray
    fun delete(id: UUID)
}
