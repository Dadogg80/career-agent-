package com.careeragent.documents

import com.careeragent.documents.application.DocumentFailure
import com.careeragent.documents.infrastructure.DocumentTextExtractor
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.pdmodel.PDPage
import org.apache.pdfbox.pdmodel.PDPageContentStream
import org.apache.pdfbox.pdmodel.font.PDType1Font
import org.apache.pdfbox.pdmodel.font.Standard14Fonts
import org.apache.pdfbox.pdmodel.encryption.AccessPermission
import org.apache.pdfbox.pdmodel.encryption.StandardProtectionPolicy
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import java.io.ByteArrayOutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

object DocumentFixture {
    fun docx(text: String, unsafeXml: String? = null): ByteArray {
        val out = ByteArrayOutputStream()
        ZipOutputStream(out).use { zip ->
            zip.putNextEntry(ZipEntry("[Content_Types].xml")); zip.write("<Types>application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml</Types>".toByteArray()); zip.closeEntry()
            zip.putNextEntry(ZipEntry("word/document.xml")); zip.write((unsafeXml ?: """<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>$text</w:t></w:r></w:p></w:body></w:document>""").toByteArray()); zip.closeEntry()
        }
        return out.toByteArray()
    }
    fun pdf(text: String = "Synthetic CV: built APIs", encrypted: Boolean = false, pages: Int = 1): ByteArray {
        val out = ByteArrayOutputStream()
        PDDocument().use { document ->
            repeat(pages) { document.addPage(PDPage()) }
            if (text.isNotBlank()) PDPageContentStream(document, document.getPage(0)).use { content -> content.beginText(); content.setFont(PDType1Font(Standard14Fonts.FontName.HELVETICA), 12f); content.newLineAtOffset(30f, 700f); content.showText(text); content.endText() }
            if (encrypted) document.protect(StandardProtectionPolicy("synthetic-owner", "synthetic-user", AccessPermission()))
            document.save(out)
        }
        return out.toByteArray()
    }
}
class DocumentTextExtractorTest {
    private val extractor = DocumentTextExtractor()
    @Test fun `DOCX and PDF extract text without altering originals`() {
        val docx = DocumentFixture.docx("Built APIs with Kotlin"); val before = docx.copyOf()
        assertThat(extractor.extract(docx, "docx")).isEqualTo("Built APIs with Kotlin"); assertThat(docx).isEqualTo(before)
        assertThat(extractor.extract(DocumentFixture.pdf(), "pdf")).contains("Synthetic CV: built APIs")
    }
    @Test fun `scanned PDF is retained with empty text while encryption and excess pages are rejected`() {
        assertThat(extractor.extract(DocumentFixture.pdf(""), "pdf")).isEmpty()
        assertCode("DOCUMENT_ENCRYPTED") { extractor.extract(DocumentFixture.pdf(encrypted = true), "pdf") }
        assertCode("DOCUMENT_TOO_LARGE") { extractor.extract(DocumentFixture.pdf(pages = 101), "pdf") }
    }
    @Test fun `malformed files external entities and large expanded documents fail closed`() {
        assertCode("DOCUMENT_INVALID") { extractor.extract("not a PDF".toByteArray(), "pdf") }
        assertCode("DOCUMENT_INVALID") { extractor.extract("not a DOCX".toByteArray(), "docx") }
        val xml = """<!DOCTYPE doc [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:t>&xxe;</w:t></w:document>"""
        assertCode("DOCUMENT_INVALID") { extractor.extract(DocumentFixture.docx("", xml), "docx") }
        assertCode("DOCUMENT_TOO_LARGE") { extractor.extract(DocumentFixture.docx("x".repeat(2 * 1024 * 1024)), "docx") }
    }
    private fun assertCode(code: String, block: () -> Unit) { assertThatThrownBy { block() }.isInstanceOfSatisfying(DocumentFailure::class.java) { assertThat(it.code).isEqualTo(code) } }
}
