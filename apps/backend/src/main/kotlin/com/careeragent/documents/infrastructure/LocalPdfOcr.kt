package com.careeragent.documents.infrastructure

import com.careeragent.documents.application.DocumentFailure
import org.apache.pdfbox.Loader
import org.apache.pdfbox.rendering.PDFRenderer
import org.apache.pdfbox.text.PDFTextStripper
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.nio.file.Files
import java.nio.file.attribute.PosixFilePermissions
import java.util.concurrent.TimeUnit
import javax.imageio.ImageIO

data class ReadDocument(val text: String, val method: String)

@Component
class LocalOcrEngine(@Value("\${DOCUMENT_OCR_LANGUAGES:eng}") private val languages: String) {
    fun read(image: java.awt.image.BufferedImage): String {
        if (!languages.matches(Regex("[a-z]{3}(\\+[a-z]{3})*"))) throw DocumentFailure("DOCUMENT_OCR_UNAVAILABLE", 503)
        val dir = Files.createTempDirectory("career-ocr-", PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rwx------")))
        try {
            val input = dir.resolve("page.png"); val output = dir.resolve("result")
            ImageIO.write(image, "png", input.toFile())
            Files.setPosixFilePermissions(input, PosixFilePermissions.fromString("rw-------"))
            val process = try {
                ProcessBuilder("tesseract", input.toString(), output.toString(), "-l", languages, "--psm", "3")
                    .apply {
                        val path = environment()["PATH"]; val data = environment()["TESSDATA_PREFIX"]
                        environment().clear(); if (path != null) environment()["PATH"] = path
                        if (data != null) environment()["TESSDATA_PREFIX"] = data
                        environment()["LANG"] = "C.UTF-8"
                    }.redirectOutput(ProcessBuilder.Redirect.DISCARD).redirectError(ProcessBuilder.Redirect.DISCARD).start()
            } catch (_: java.io.IOException) { throw DocumentFailure("DOCUMENT_OCR_UNAVAILABLE", 503) }
            try {
                if (!process.waitFor(8, TimeUnit.SECONDS)) throw DocumentFailure("DOCUMENT_OCR_TIMEOUT", 503)
                if (process.exitValue() != 0) throw DocumentFailure("DOCUMENT_OCR_UNAVAILABLE", 503)
                val result = dir.resolve("result.txt")
                if (!Files.exists(result) || Files.size(result) > 240000) throw DocumentFailure("DOCUMENT_TOO_LARGE", 413)
                return Files.readString(result).trim()
            } finally { if (process.isAlive) { process.destroyForcibly(); process.waitFor(1, TimeUnit.SECONDS) } }
        } finally { Files.list(dir).use { files -> files.forEach { Files.deleteIfExists(it) } }; Files.deleteIfExists(dir) }
    }
}

@Component
class LocalPdfOcr(private val engine: LocalOcrEngine) {
    fun extract(bytes: ByteArray): ReadDocument = try { Loader.loadPDF(bytes).use { document ->
        if (document.isEncrypted) throw DocumentFailure("DOCUMENT_ENCRYPTED", 400)
        if (document.numberOfPages > 10) throw DocumentFailure("DOCUMENT_OCR_TOO_LARGE", 413)
        val renderer = PDFRenderer(document); var usedOcr = false; var count = 0
        val pages = (0 until document.numberOfPages).map { index ->
            val text = PDFTextStripper().apply { sortByPosition = true; startPage = index + 1; endPage = index + 1 }.getText(document).trim()
            val pageText = if (text.isNotBlank()) text else {
                val box = document.getPage(index).cropBox
                val pixels = box.width.toDouble() * box.height * (120.0 / 72) * (120.0 / 72)
                if (!pixels.isFinite() || pixels <= 0 || pixels > 10000000) throw DocumentFailure("DOCUMENT_OCR_TOO_LARGE", 413)
                val image = renderer.renderImageWithDPI(index, 120f)
                usedOcr = true
                try { engine.read(image) } finally { image.flush() }
            }
            count += pageText.length + 2
            if (count > 60000) throw DocumentFailure("DOCUMENT_TOO_LARGE", 413)
            pageText
        }
        ReadDocument(pages.joinToString("\n\n").replace("\u0000", "").trim(), if (usedOcr) "OCR" else "TEXT")
    } } catch (failure: DocumentFailure) { throw failure }
      catch (_: org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException) { throw DocumentFailure("DOCUMENT_ENCRYPTED", 400) }
      catch (_: Exception) { throw DocumentFailure("DOCUMENT_INVALID", 400) }
}
