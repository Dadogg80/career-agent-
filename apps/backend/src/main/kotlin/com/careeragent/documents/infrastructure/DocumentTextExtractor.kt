package com.careeragent.documents.infrastructure

import com.careeragent.documents.application.DocumentFailure
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException
import org.apache.pdfbox.Loader
import org.apache.pdfbox.text.PDFTextStripper
import org.springframework.stereotype.Component
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.util.zip.ZipInputStream
import javax.xml.stream.XMLInputFactory
import javax.xml.stream.XMLStreamConstants

@Component
class DocumentTextExtractor {
    fun extract(bytes: ByteArray, extension: String): String = try {
        val text = when (extension) { "docx" -> docx(bytes); "pdf" -> pdf(bytes); else -> throw DocumentFailure("DOCUMENT_TYPE", 400) }
        if (text.length > 60000) throw DocumentFailure("DOCUMENT_TOO_LARGE", 413)
        text.replace("\u0000", "").trim()
    } catch (failure: DocumentFailure) { throw failure }
      catch (_: InvalidPasswordException) { throw DocumentFailure("DOCUMENT_ENCRYPTED", 400) }
      catch (_: Exception) { throw DocumentFailure("DOCUMENT_INVALID", 400) }
    private fun docx(bytes: ByteArray): String {
        val parts = sortedMapOf<String, ByteArray>(); var types = ""; var count = 0; var expanded = 0
        ZipInputStream(ByteArrayInputStream(bytes)).use { zip ->
            while (true) {
                val entry = zip.nextEntry ?: break
                if (++count > 256) throw DocumentFailure("DOCUMENT_TOO_LARGE", 413)
                val output = ByteArrayOutputStream(); val buffer = ByteArray(8192)
                while (true) {
                    val length = zip.read(buffer); if (length < 0) break
                    expanded += length
                    if (expanded > 20 * 1024 * 1024 || output.size() + length > 2 * 1024 * 1024) throw DocumentFailure("DOCUMENT_TOO_LARGE", 413)
                    output.write(buffer, 0, length)
                }
                if (entry.name == "word/document.xml" || Regex("word/(header|footer)[0-9]+\\.xml").matches(entry.name)) parts[entry.name] = output.toByteArray()
                if (entry.name == "[Content_Types].xml") types = output.toString(Charsets.UTF_8)
            }
        }
        if (!types.contains("application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml")) throw DocumentFailure("DOCUMENT_INVALID", 400)
        val main = parts.remove("word/document.xml") ?: throw DocumentFailure("DOCUMENT_INVALID", 400)
        val extra = parts.entries.sortedWith(compareBy({ it.key.startsWith("word/footer") }, { it.key })).map { it.value }
        val result = (listOf(main) + extra).map(::wordText).filter { it.isNotBlank() }.distinct().joinToString("\n\n")
        if (result.length > 60000) throw DocumentFailure("DOCUMENT_TOO_LARGE", 413)
        return result
    }
    private fun wordText(bytes: ByteArray): String {
        val factory = XMLInputFactory.newFactory().apply { setProperty(XMLInputFactory.SUPPORT_DTD, false); setProperty("javax.xml.stream.isSupportingExternalEntities", false) }
        val reader = factory.createXMLStreamReader(ByteArrayInputStream(bytes))
        val result = StringBuilder(); var inText = false
        try {
            while (reader.hasNext()) {
                val event = reader.next()
                if (event == XMLStreamConstants.DTD) throw DocumentFailure("DOCUMENT_INVALID", 400)
                if (event == XMLStreamConstants.START_ELEMENT && reader.namespaceURI == "http://schemas.openxmlformats.org/wordprocessingml/2006/main") {
                    when (reader.localName) { "t" -> inText = true; "tab" -> result.append('\t'); "br", "cr" -> result.append('\n') }
                }
                if (event == XMLStreamConstants.CHARACTERS && inText) result.append(reader.text)
                if (event == XMLStreamConstants.END_ELEMENT) { if (reader.localName == "t") inText = false; if (reader.localName == "p") result.append('\n') }
                if (result.length > 60000) throw DocumentFailure("DOCUMENT_TOO_LARGE", 413)
            }
        } finally { reader.close() }
        return result.toString().trim()
    }
    private fun pdf(bytes: ByteArray): String {
        if (!bytes.take(5).toByteArray().contentEquals("%PDF-".toByteArray())) throw DocumentFailure("DOCUMENT_INVALID", 400)
        return Loader.loadPDF(bytes).use { document ->
            if (document.isEncrypted) throw DocumentFailure("DOCUMENT_ENCRYPTED", 400)
            if (document.numberOfPages > 100) throw DocumentFailure("DOCUMENT_TOO_LARGE", 413)
            val result = StringBuilder()
            val writer = object : java.io.Writer() {
                override fun write(chars: CharArray, offset: Int, length: Int) {
                    if (result.length + length > 60000) throw DocumentFailure("DOCUMENT_TOO_LARGE", 413)
                    result.append(chars, offset, length)
                }
                override fun flush() {}
                override fun close() {}
            }
            PDFTextStripper().apply { sortByPosition = true }.writeText(document, writer)
            result.toString()
        }
    }
}
