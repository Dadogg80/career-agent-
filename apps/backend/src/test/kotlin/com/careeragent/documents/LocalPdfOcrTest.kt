package com.careeragent.documents

import com.careeragent.documents.infrastructure.*
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import java.awt.image.BufferedImage

class LocalPdfOcrTest {
    @Test fun `OCR reads only pages without text and keeps normal source text`() {
        var pages = 0
        val engine = mock(LocalOcrEngine::class.java) { invocation ->
            if (invocation.method.name == "read") { pages++; "Completed an Azure course" } else null
        }
        val extractor = LocalPdfOcr(engine)
        val read = extractor.extract(DocumentFixture.pdf("Built Kotlin APIs", pages = 2))
        assertThat(read.text).isEqualTo("Built Kotlin APIs\n\nCompleted an Azure course")
        assertThat(read.method).isEqualTo("OCR"); assertThat(pages).isEqualTo(1)
        assertThat(extractor.extract(DocumentFixture.pdf()).method).isEqualTo("TEXT")
        assertThat(pages).isEqualTo(1)
        assertThatThrownBy { extractor.extract(DocumentFixture.pdf(pages=11)) }.hasMessage("DOCUMENT_OCR_TOO_LARGE")
        assertThatThrownBy { extractor.extract(DocumentFixture.pdf(encrypted=true)) }.hasMessage("DOCUMENT_ENCRYPTED")
    }
    @Test fun `invalid OCR language configuration fails before invoking a subprocess`() {
        assertThatThrownBy { LocalOcrEngine("eng;cat /etc/passwd").read(BufferedImage(20,20,BufferedImage.TYPE_INT_RGB)) }.hasMessage("DOCUMENT_OCR_UNAVAILABLE")
    }
}
