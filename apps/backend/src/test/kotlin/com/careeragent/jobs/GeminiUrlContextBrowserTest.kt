package com.careeragent.jobs

import com.careeragent.ai.infrastructure.AiCooldowns
import com.careeragent.ai.application.GeminiSourceModels
import com.careeragent.jobs.application.ImportFailure
import com.careeragent.jobs.infrastructure.GeminiUrlContextBrowser
import com.careeragent.jobs.infrastructure.GeminiUrlContextTransport
import com.careeragent.jobs.infrastructure.GeminiContextResponse
import com.careeragent.jobs.infrastructure.GeminiUrlContextHttpTransport
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.`when`
import org.mockito.Mockito.verify
import org.mockito.Mockito.times
import org.mockito.ArgumentMatchers.anyMap
import org.mockito.ArgumentMatchers.any
import org.mockito.ArgumentCaptor
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.net.http.HttpHeaders

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

    private val excerpt = "Backendutvikler\n\nExample AS søker en utvikler til å bygge API-er med Kotlin og PostgreSQL. Kontakt: rekruttering@example.test. Søknadsfrist: 1. november."
    private fun generation(
        retrievedUrl: String = url,
        status: String = "URL_RETRIEVAL_STATUS_SUCCESS",
        finish: String = "STOP",
        text: String = excerpt,
        thought: Boolean = false,
    ) = mapper.writeValueAsString(mapOf(
        "candidates" to listOf(mapOf(
            "finishReason" to finish,
            "content" to mapOf("parts" to listOf(mapOf("text" to text, "thought" to thought))),
            "urlContextMetadata" to mapOf("urlMetadata" to listOf(mapOf(
                "retrievedUrl" to retrievedUrl, "urlRetrievalStatus" to status,
            ))),
        )),
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
        assertThatThrownBy { browser().load("https://www.finn.no/job/ad/123456789", "gemini-unlisted-flash") }
            .isInstanceOfSatisfying(ImportFailure::class.java) { assertThat(it.code).isEqualTo("SOURCE_MODEL_UNSUPPORTED") }
        assertThatThrownBy { browser().load("https://example.test/job/ad/123456789", "gemini-3.8-flash") }
            .isInstanceOf(ImportFailure::class.java)
        verifyNoInteractions(transport)
    }

    @Test fun `additional source models use generation URL Context with bounded original language instructions`() {
        GeminiSourceModels.models.filter { it != "gemini-3.8-flash" }.forEach { model ->
            val body = browser().requestBody(url, model)
            assertThat(body["model"]).isEqualTo(model)
            assertThat(body).doesNotContainKeys("input", "store")
            assertThat(body["tools"]).isEqualTo(listOf(mapOf("url_context" to emptyMap<String, Any>())))
            assertThat(body["contents"].toString()).contains(url, "deadline and contacts", "original language")
            assertThat(body["generationConfig"]).isEqualTo(mapOf(
                "candidateCount" to 1, "maxOutputTokens" to 8192,
                "thinkingConfig" to mapOf("thinkingLevel" to "LOW"),
            ))
        }
    }

    @Test fun `HTTP source transport selects generation endpoint for Lite and retains the Interactions endpoint`() {
        val client = mock(HttpClient::class.java)
        @Suppress("UNCHECKED_CAST") val response = mock(HttpResponse::class.java) as HttpResponse<String>
        `when`(response.statusCode()).thenReturn(200)
        `when`(response.body()).thenReturn("{}")
        `when`(response.headers()).thenReturn(HttpHeaders.of(emptyMap()) { _, _ -> true })
        `when`(client.send(any(HttpRequest::class.java), any<HttpResponse.BodyHandler<String>>())).thenReturn(response)
        val http = GeminiUrlContextHttpTransport(mapper, "fictional-key", client)
        http.complete(browser().requestBody(url, "gemini-3.5-flash-lite"))
        http.complete(browser().requestBody(url, "gemini-3.8-flash"))
        val requests = ArgumentCaptor.forClass(HttpRequest::class.java)
        verify(client, times(2)).send(requests.capture(), any<HttpResponse.BodyHandler<String>>())
        assertThat(requests.allValues.map { it.uri().toString() }).containsExactly(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
            "https://generativelanguage.googleapis.com/v1beta/interactions",
        )
        assertThat(requests.allValues).allMatch { it.method() == "POST" && it.headers().firstValue("x-goog-api-key").orElse("") == "fictional-key" }
    }

    @Test fun `generation source excerpt accepts same candidate successful exact URL metadata without inventing a citation`() {
        GeminiSourceModels.models.filter { it != "gemini-3.8-flash" }.forEach { model ->
            val result = browser().parse(url, generation(), model)
            assertThat(result.sourceType).isEqualTo("GEMINI_URL_CONTEXT_EXCERPT")
            assertThat(result.aiSelection?.model).isEqualTo(model)
            assertThat(result.text).contains("rekruttering@example.test", "1. november")
        }
        verifyNoInteractions(transport)
    }

    @Test fun `generation source rejects failed retrieval wrong URL and text-only fabricated links`() {
        val payloads = listOf(
            generation(status = "URL_RETRIEVAL_STATUS_ERROR"),
            generation(retrievedUrl = "https://www.finn.no/job/ad/987654321"),
            """{"candidates":[{"finishReason":"STOP","content":{"parts":[{"text":"$url"}]}}]}""",
        )
        payloads.forEach { raw ->
            assertThatThrownBy { browser().parse(url, raw, "gemini-3.5-flash-lite") }
                .isInstanceOfSatisfying(ImportFailure::class.java) { assertThat(it.code).isEqualTo("SOURCE_NOT_AVAILABLE") }
        }
    }

    @Test fun `generation rejects incomplete output thought-only text and excessive excerpt`() {
        assertThatThrownBy { browser().parse(url, generation(finish = "MAX_TOKENS"), "gemini-3.5-flash-lite") }
            .isInstanceOfSatisfying(ImportFailure::class.java) { assertThat(it.code).isEqualTo("SOURCE_INVALID") }
        assertThatThrownBy { browser().parse(url, generation(thought = true), "gemini-3.5-flash-lite") }
            .isInstanceOfSatisfying(ImportFailure::class.java) { assertThat(it.code).isEqualTo("SOURCE_NOT_AVAILABLE") }
        assertThatThrownBy { browser().parse(url, generation(text = "x".repeat(15001)), "gemini-3.5-flash-lite") }
            .isInstanceOfSatisfying(ImportFailure::class.java) { assertThat(it.code).isEqualTo("SOURCE_TOO_LARGE") }
    }

    @Test fun `successful retrieval cannot be borrowed from another candidate or response protocol`() {
        val root = mapper.readTree(generation())
        val candidates = root.path("candidates") as com.fasterxml.jackson.databind.node.ArrayNode
        candidates.add(candidates[0].deepCopy<com.fasterxml.jackson.databind.node.ObjectNode>())
        assertThatThrownBy { browser().parse(url, root.toString(), "gemini-3.5-flash-lite") }
            .isInstanceOfSatisfying(ImportFailure::class.java) { assertThat(it.code).isEqualTo("SOURCE_INVALID") }
        assertThatThrownBy { browser().parse(url, generation(), "gemini-3.8-flash") }
            .isInstanceOfSatisfying(ImportFailure::class.java) { assertThat(it.code).isEqualTo("SOURCE_INVALID") }
        assertThatThrownBy { browser().parse(url, response(), "gemini-3.5-flash-lite") }
            .isInstanceOfSatisfying(ImportFailure::class.java) { assertThat(it.code).isEqualTo("SOURCE_INVALID") }
    }

    @Test fun `selected source model is called once and temporary capacity failure never switches models`() {
        `when`(transport.complete(anyMap())).thenReturn(GeminiContextResponse(503, "{}", null))
        assertThatThrownBy { browser().load(url, "gemini-3.7-flash") }
            .isInstanceOfSatisfying(ImportFailure::class.java) { assertThat(it.code).isEqualTo("SOURCE_UNAVAILABLE") }
        verify(transport, times(1)).complete(browser().requestBody(url, "gemini-3.7-flash"))
    }
}
