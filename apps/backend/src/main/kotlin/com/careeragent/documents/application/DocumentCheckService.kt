package com.careeragent.documents.application

import com.careeragent.documents.domain.*
import com.careeragent.documents.infrastructure.DocumentTextExtractor
import com.careeragent.profile.application.VerifiedIdentity
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import java.security.MessageDigest
import java.time.OffsetDateTime
import java.util.UUID
import java.util.concurrent.Semaphore

data class DocumentCheck(val kind: String, val state: String, val code: String, val items: Int = 0)
data class CheckedDocument(val documentId: UUID, val characters: Int, val checks: List<DocumentCheck>)
data class DocumentCheckReport(val checkedAt: OffsetDateTime, val documents: List<CheckedDocument>)

@Service
@Profile("persistence")
class DocumentCheckService(private val documents: DocumentRepository, private val analyses: DocumentAnalysisRepository,
    private val storage: DocumentStorage, private val extractor: DocumentTextExtractor) {
    private val permit = Semaphore(1)
    fun check(identity: VerifiedIdentity): DocumentCheckReport {
        val owned = documents.list(identity)
        if (!permit.tryAcquire()) throw DocumentFailure("DOCUMENT_BUSY", 429)
        try {
            val sources = owned.associate { it.id to documents.detail(identity, it.id) }
            val combined = analyses.loadCollection(identity)
            val result = owned.map { document ->
                val source = sources.getValue(document.id)
                val checks = mutableListOf<DocumentCheck>()
                val bytes = try { storage.read(document.id) } catch (_: Exception) { null }
                val intact = bytes != null && bytes.size.toLong() == document.byteSize &&
                    MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) } == document.sha256
                checks.add(DocumentCheck("ORIGINAL", if (intact) "PASS" else "FAIL", if (bytes == null) "ORIGINAL_MISSING" else if (!intact) "ORIGINAL_CHANGED" else "ORIGINAL_UNCHANGED"))
                val fresh = if (intact) try { extractor.extract(bytes!!, when(document.mediaType) {
                    "application/pdf" -> "pdf"; "text/plain" -> "txt"; "text/markdown" -> "md"; else -> "docx"
                }) } catch (_: Exception) { null } else null
                val textCode = when {
                    source.text.isBlank() -> "TEXT_EMPTY"
                    document.extractionMethod == "OCR" -> "OCR_REQUIRES_REVIEW"
                    source.text.length >= 60000 -> "TEXT_LIMIT_REACHED"
                    fresh == null -> "READER_UNAVAILABLE"
                    fresh != source.text -> "READER_DIFFERENT"
                    else -> "TEXT_READABLE"
                }
                checks.add(DocumentCheck("TEXT", if (textCode == "TEXT_READABLE") "PASS" else "REVIEW", textCode))
                fun analysisCheck(kind: String, analysis: DocumentAnalysis?) {
                    if (analysis == null) { checks.add(DocumentCheck(kind, "MISSING", "NOT_ANALYZED")); return }
                    val summaries = analysis.summary.filter { it.documentId == document.id || it.documentId == null && kind == "INDIVIDUAL_AI" }
                    val proposals = analysis.suggestions.filter { it.documentId == document.id || it.documentId == null && kind == "INDIVIDUAL_AI" || it.additionalSources.any { s -> s.documentId == document.id } }
                    val quotes = summaries.map { it.quote } + proposals.flatMap { item ->
                        listOfNotNull(item.quote.takeIf { item.documentId == document.id || item.documentId == null && kind == "INDIVIDUAL_AI" }) + item.additionalSources.filter { it.documentId == document.id }.map { it.quote }
                    }
                    val invalid = quotes.any { !source.text.contains(it) }
                    val covered = kind == "INDIVIDUAL_AI" || analysis.documents.any { it.documentId == document.id }
                    val code = when { !covered -> "NOT_INCLUDED"; invalid -> "EVIDENCE_CHANGED"; quotes.isEmpty() -> "NO_SUGGESTIONS"; analysis.partial -> "PARTIAL_ANALYSIS"; else -> "EVIDENCE_SUPPORTED" }
                    checks.add(DocumentCheck(kind, if (invalid) "FAIL" else if (code == "EVIDENCE_SUPPORTED") "PASS" else "REVIEW", code, summaries.size + proposals.size))
                }
                analysisCheck("INDIVIDUAL_AI", analyses.load(identity, document.id))
                analysisCheck("COMBINED_AI", combined)
                CheckedDocument(document.id, source.text.length, checks)
            }
            return DocumentCheckReport(OffsetDateTime.now(), result)
        } finally { permit.release() }
    }
}
