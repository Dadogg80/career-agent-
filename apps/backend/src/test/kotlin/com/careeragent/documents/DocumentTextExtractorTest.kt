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
    fun docx(text: String, unsafeXml: String? = null, parts: Map<String, String> = emptyMap()): ByteArray {
        val out = ByteArrayOutputStream()
        ZipOutputStream(out).use { zip ->
            zip.putNextEntry(ZipEntry("[Content_Types].xml")); zip.write("<Types>application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml</Types>".toByteArray()); zip.closeEntry()
            zip.putNextEntry(ZipEntry("word/document.xml")); zip.write((unsafeXml ?: """<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>$text</w:t></w:r></w:p></w:body></w:document>""").toByteArray()); zip.closeEntry()
            parts.forEach { (name, xml) -> zip.putNextEntry(ZipEntry(name)); zip.write(xml.toByteArray()); zip.closeEntry() }
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
    @Test fun `letter tracking does not manufacture spaces inside words and real spaces survive`() {
        val output = ByteArrayOutputStream()
        PDDocument().use { document ->
            document.addPage(PDPage())
            PDPageContentStream(document, document.getPage(0)).use { stream ->
                stream.beginText(); stream.setFont(PDType1Font(Standard14Fonts.FontName.HELVETICA), 12f)
                stream.setCharacterSpacing(2f); stream.newLineAtOffset(30f,700f)
                stream.showText("Project description: clinician-facing cloud delivery")
                stream.endText()
            }; document.save(output)
        }
        assertThat(extractor.extract(output.toByteArray(),"pdf")).isEqualTo("Project description: clinician-facing cloud delivery")
    }
    @Test fun `repeated column gutter separates sidebar text from project paragraphs without dropping words`() {
        val output = ByteArrayOutputStream()
        PDDocument().use { document ->
            document.addPage(PDPage())
            PDPageContentStream(document, document.getPage(0)).use { stream ->
                for (row in 0..5) for ((text,x) in listOf("Sidebar context entry $row" to 30f,"Project contribution number $row" to 300f)) {
                    stream.beginText(); stream.setFont(PDType1Font(Standard14Fonts.FontName.HELVETICA),12f)
                    stream.newLineAtOffset(x,700f-row*25); stream.showText(text); stream.endText()
                }
            }; document.save(output)
        }
        val text=extractor.extract(output.toByteArray(),"pdf")
        assertThat(text).contains("Sidebar context entry 0\nSidebar context entry 1", "Project contribution number 0\nProject contribution number 1")
        assertThat(text.indexOf("Sidebar context entry 5")).isLessThan(text.indexOf("Project contribution number 0"))
        for(row in 0..5) {assertThat(text).contains("Sidebar context entry $row","Project contribution number $row")}
    }
    @Test fun `a skills grid does not split later full width employment paragraphs`() {
        val output=ByteArrayOutputStream()
        val description="Delivered reliable backend services and frontend applications for the whole organization."
        PDDocument().use { document ->
            document.addPage(PDPage())
            PDPageContentStream(document,document.getPage(0)).use { stream ->
                fun row(text:String,x:Float,y:Float) {
                    stream.beginText();stream.setFont(PDType1Font(Standard14Fonts.FontName.HELVETICA),11f)
                    stream.newLineAtOffset(x,y);stream.showText(text);stream.endText()
                }
                for (i in 0..4) {row("Frontend technology entry $i",30f,700f-i*22);row("Delivery responsibility item $i",320f,700f-i*22)}
                row("WORK EXPERIENCE",30f,550f)
                row("2021 - 2024",30f,525f);row("Example AS - Senior Developer",170f,525f)
                row(description,30f,500f)
                row("Built APIs with PostgreSQL and Docker across product teams.",30f,480f)
            };document.save(output)
        }
        val text=extractor.extract(output.toByteArray(),"pdf")
        assertThat(text).contains(description,"2021 - 2024 Example AS - Senior Developer",
            "Built APIs with PostgreSQL and Docker across product teams.")
        assertThat(text.indexOf("WORK EXPERIENCE")).isLessThan(text.indexOf(description))
        assertThat(text.indexOf("Delivery responsibility item 4")).isLessThan(text.indexOf("WORK EXPERIENCE"))
    }
    @Test fun `a date column stays associated with its organization and role instead of becoming a separate column`() {
        val output=ByteArrayOutputStream()
        PDDocument().use { document ->
            document.addPage(PDPage())
            PDPageContentStream(document,document.getPage(0)).use { stream ->
                for (i in 0..4) for ((text,x) in listOf("202${i} - 202${i+1}" to 30f,"Company $i - Developer $i" to 220f)) {
                    stream.beginText();stream.setFont(PDType1Font(Standard14Fonts.FontName.HELVETICA),12f)
                    stream.newLineAtOffset(x,700f-i*25);stream.showText(text);stream.endText()
                }
            };document.save(output)
        }
        val text=extractor.extract(output.toByteArray(),"pdf")
        for(i in 0..4)assertThat(text).contains("202${i} - 202${i+1} Company $i - Developer $i")
        assertThat(text.indexOf("Company 0")).isLessThan(text.indexOf("2021 - 2022"))
    }
    @Test fun `UTF8 text and Markdown retain Norwegian company context and reject binary or invalid encodings`() {
        val text="## Example AS\nÅse bygget API-er med Kotlin og PostgreSQL."
        assertThat(extractor.extract(text.toByteArray(),"md")).isEqualTo(text)
        assertThat(extractor.extract(("\uFEFF"+text).toByteArray(),"txt")).isEqualTo(text)
        assertThatThrownBy { extractor.extract(byteArrayOf(0,1,2),"txt") }.isInstanceOf(DocumentFailure::class.java)
        assertThatThrownBy { extractor.extract(byteArrayOf(0xc3.toByte(),0x28),"txt") }.isInstanceOf(DocumentFailure::class.java)
        assertThatThrownBy { extractor.extract("x".repeat(60001).toByteArray(),"md") }.isInstanceOf(DocumentFailure::class.java)
    }
    @Test fun `Word tables text boxes headers footers and line breaks retain source text`() {
        val main = """<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Built APIs</w:t><w:tab/><w:t>with Kotlin</w:t><w:br/><w:t>and PostgreSQL</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Team collaboration</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:txbxContent><w:p><w:r><w:t>Azure course</w:t></w:r></w:p></w:txbxContent></w:body></w:document>"""
        fun part(text: String) = """<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:t>$text</w:t></w:r></w:p></w:hdr>"""
        val bytes = DocumentFixture.docx("", main, mapOf("word/header1.xml" to part("Technical skills: Docker"), "word/header2.xml" to part("Technical skills: Docker"), "word/footer1.xml" to part("Scrum certification")))
        assertThat(extractor.extract(bytes, "docx")).isEqualTo("Built APIs\twith Kotlin\nand PostgreSQL\nTeam collaboration\nAzure course\n\nTechnical skills: Docker\n\nScrum certification")
        assertCode("DOCUMENT_INVALID") { extractor.extract(DocumentFixture.docx("safe", parts = mapOf("word/header1.xml" to "<!DOCTYPE doc [<!ENTITY x SYSTEM 'file:///etc/passwd'>]><p>&x;</p>")), "docx") }
    }
    @Test fun `PDF text follows visual position instead of drawing order`() {
        val out = ByteArrayOutputStream()
        PDDocument().use { document ->
            document.addPage(PDPage())
            PDPageContentStream(document, document.getPage(0)).use { content ->
                for ((text, y) in listOf("Second experience" to 600f, "First experience" to 700f)) {
                    content.beginText(); content.setFont(PDType1Font(Standard14Fonts.FontName.HELVETICA), 12f); content.newLineAtOffset(30f,y); content.showText(text); content.endText()
                }
            }; document.save(out)
        }
        assertThat(extractor.extract(out.toByteArray(), "pdf")).isEqualTo("First experience\nSecond experience")
    }
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
