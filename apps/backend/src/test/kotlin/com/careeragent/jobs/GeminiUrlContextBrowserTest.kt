package com.careeragent.jobs

import com.careeragent.ai.infrastructure.AiCooldowns
import com.careeragent.jobs.application.ImportFailure
import com.careeragent.jobs.infrastructure.GeminiUrlContextBrowser
import com.careeragent.jobs.infrastructure.GeminiUrlContextTransport
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verifyNoInteractions

class GeminiUrlContextBrowserTest {
    private val url = "https://www.finn.no/job/ad/123456789"
    private val mapper = jacksonObjectMapper()
    private val transport = mock(GeminiUrlContextTransport::class.java)
    private fun browser() = GeminiUrlContextBrowser(transport, mapper, AiCooldowns(), 10, true)

    private fun response(retrievedUrl: String = url, citedUrl: String = url) = mapper.writeValueAsString(mapOf(
        "status" to "completed",
        "steps" to listOf(
            mapOf("type" to "url_context_result", "url_context_result" to listOf(mapOf("url" to retrievedUrl, "status" to "success"))),
            mapOf("type" to "model_output", "content" to listOf(mapOf(
                "type" to "text",
                "text" to "Backendutvikler\n\nExample AS søker en erfaren utvikler til å bygge API-er med Kotlin og PostgreSQL. Stillingen tilbyr fleksibel arbeidstid.",
                "annotations" to listOf(mapOf("type" to "url_citation", "url" to citedUrl)),
            ))),
        ),
    ))

    @Test fun `URL Context uses only the selected model and exact supplied link`() {
        val body = browser().requestBody(url)
        assertThat(body["model"]).isEqualTo("gemini-3.8-flash")
        assertThat(body["tools"]).isEqualTo(listOf(mapOf("type" to "url_context")))
        assertThat(body["input"].toString()).contains(url)
    }

    @Test fun `Gemini source excerpt requires successful retrieval and a citation to the exact FINN link`() {
        val result = browser().parse(url, response())
        assertThat(result.title).isEqualTo("Backendutvikler")
        assertThat(result.sourceType).isEqualTo("GEMINI_URL_CONTEXT_EXCERPT")
        assertThat(result.aiSelection?.provider).isEqualTo("Gemini")
        assertThat(result.aiSelection?.model).isEqualTo("gemini-3.8-flash")
        assertThat(result.text).contains("Kotlin og PostgreSQL")

        assertThatThrownBy { browser().parse(url, response(retrievedUrl = "https://www.finn.no/job/ad/987654321")) }
            .isInstanceOfSatisfying(ImportFailure::class.java) { assertThat(it.code).isEqualTo("SOURCE_NOT_AVAILABLE") }
        assertThatThrownBy { browser().parse(url, response(citedUrl = "https://www.finn.no/job/ad/987654321")) }
            .isInstanceOfSatisfying(ImportFailure::class.java) { assertThat(it.code).isEqualTo("SOURCE_NOT_AVAILABLE") }
        verifyNoInteractions(transport)
    }

    @Test fun `Gemini URL Context rejects unapproved models and non-FINN links without provider calls`() {
        assertThatThrownBy { browser().load("https://www.finn.no/job/ad/123456789", "gemini-3.5-flash") }
            .isInstanceOfSatisfying(ImportFailure::class.java) { assertThat(it.code).isEqualTo("SOURCE_MODEL_UNSUPPORTED") }
        assertThatThrownBy { browser().load("https://example.test/job/ad/123456789", "gemini-3.8-flash") }
            .isInstanceOf(ImportFailure::class.java)
        verifyNoInteractions(transport)
    }
}
