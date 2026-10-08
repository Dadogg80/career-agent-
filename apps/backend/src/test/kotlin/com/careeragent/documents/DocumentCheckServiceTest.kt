package com.careeragent.documents

import com.careeragent.documents.application.*
import com.careeragent.documents.domain.*
import com.careeragent.documents.infrastructure.DocumentTextExtractor
import com.careeragent.profile.application.VerifiedIdentity
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import java.security.MessageDigest
import java.time.OffsetDateTime
import java.util.UUID

class DocumentCheckServiceTest {
    private val docs = mock(DocumentRepository::class.java)
    private val analyses = mock(DocumentAnalysisRepository::class.java)
    private val storage = mock(DocumentStorage::class.java)
    private val extractor = mock(DocumentTextExtractor::class.java)
    private val identity = VerifiedIdentity("https://identity.example.test", "synthetic")
    private val id = UUID.randomUUID()
    private val text = "Built Kotlin APIs."
    private val bytes = text.toByteArray()
    private val hash = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
    private val service = DocumentCheckService(docs, analyses, storage, extractor)
    private fun source(method: String = "TEXT") {
        val doc = CareerDocument(id, "synthetic.txt", "text/plain", bytes.size.toLong(), hash, "nb", false, OffsetDateTime.now(), extractionMethod = method)
        `when`(docs.list(identity)).thenReturn(listOf(doc))
        `when`(docs.detail(identity, id)).thenReturn(DocumentDetail(doc, text))
    }
    private fun codes() = service.check(identity).documents.single().checks.associate { it.kind to it.code }

    @Test fun `missing or changed originals are never reported intact and stored text is preserved`() {
        source()
        `when`(storage.read(id)).thenThrow(DocumentFailure("DOCUMENT_UNAVAILABLE", 503))
        assertThat(codes()["ORIGINAL"]).isEqualTo("ORIGINAL_MISSING")
        doReturn("wrong".toByteArray()).`when`(storage).read(id)
        assertThat(codes()["ORIGINAL"]).isEqualTo("ORIGINAL_CHANGED")
        verifyNoInteractions(extractor)
        verify(docs, times(2)).list(identity)
        verify(docs, times(2)).detail(identity, id)
        verify(storage, times(2)).read(id)
        verifyNoMoreInteractions(docs, storage)
    }

    @Test fun `OCR and a failed fresh reader require review instead of a green text result`() {
        source("OCR")
        `when`(storage.read(id)).thenReturn(bytes)
        `when`(extractor.extract(bytes, "txt")).thenThrow(DocumentFailure("DOCUMENT_INVALID", 400))
        assertThat(codes()["TEXT"]).isEqualTo("OCR_REQUIRES_REVIEW")
        source()
        assertThat(codes()["TEXT"]).isEqualTo("READER_UNAVAILABLE")
        doReturn("Different text").`when`(extractor).extract(bytes, "txt")
        assertThat(codes()["TEXT"]).isEqualTo("READER_DIFFERENT")
    }

    @Test fun `unsupported stored quotations fail evidence checks even when original and reader pass`() {
        source()
        `when`(storage.read(id)).thenReturn(bytes)
        `when`(extractor.extract(bytes, "txt")).thenReturn(text)
        `when`(analyses.load(identity, id)).thenReturn(DocumentAnalysis(UUID.randomUUID(), "nb", "Groq", emptyList(),
            listOf(CompetencySuggestion("Kafka", "Invented delivery", "Unknown", "Never in the source")), text.length, text.length, false, 0, OffsetDateTime.now()))
        val result = service.check(identity).documents.single().checks
        assertThat(result.first { it.kind == "ORIGINAL" }.state).isEqualTo("PASS")
        assertThat(result.first { it.kind == "TEXT" }.state).isEqualTo("PASS")
        assertThat(result.first { it.kind == "INDIVIDUAL_AI" }.state).isEqualTo("FAIL")
        assertThat(result.first { it.kind == "INDIVIDUAL_AI" }.code).isEqualTo("EVIDENCE_CHANGED")
        verify(extractor, times(1)).extract(bytes, "txt")
        verifyNoMoreInteractions(extractor)
    }
}
