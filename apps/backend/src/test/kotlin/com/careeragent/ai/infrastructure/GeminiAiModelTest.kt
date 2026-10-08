package com.careeragent.ai.infrastructure

import com.careeragent.ai.application.*
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.ArgumentCaptor
import org.mockito.Mockito.*
import org.springframework.mock.env.MockEnvironment
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.net.http.HttpHeaders
import java.util.Optional

class GeminiAiModelTest {
    private val mapper = jacksonObjectMapper()
    private val routing = AiRouting(MockEnvironment().withProperty("AI_PROVIDER", "gemini"))
    private fun adapter() = GeminiAiModel(mapper, "fictional-key", routing)

    @Test fun `structured output separates instructions from data and bounds thinking and output`() {
        val schema = mapOf<String,Any>("type" to "object", "additionalProperties" to false)
        val body = adapter().requestBody("rules", "untrusted data", schema, AiTask.DOCUMENT_EXTRACTION)
        val json = mapper.valueToTree<com.fasterxml.jackson.databind.JsonNode>(body)
        assertThat(json.at("/systemInstruction/parts/0/text").asText()).isEqualTo("rules")
        assertThat(json.at("/contents/0/parts/0/text").asText()).isEqualTo("untrusted data")
        assertThat(json.at("/generationConfig/responseJsonSchema/additionalProperties").asBoolean()).isFalse()
        assertThat(json.at("/generationConfig/thinkingConfig/thinkingLevel").asText()).isEqualTo("LOW")
        assertThat(body).doesNotContainKeys("tools", "cachedContent")
    }

    @Test fun `thought text is excluded and blocked truncated empty or malformed outputs remain recoverable`() {
        val model = adapter()
        assertThat(model.content("""{"candidates":[{"finishReason":"STOP","content":{"parts":[{"thought":true,"text":"PRIVATE REASONING"},{"text":"{\"skills\":[]}"}]}}]}""")).isEqualTo("""{"skills":[]}""")
        for (body in listOf("{}", "not json", """{"promptFeedback":{"blockReason":"SAFETY"}}""", """{"candidates":[{"finishReason":"MAX_TOKENS"}]}""", """{"candidates":[{"finishReason":"STOP","content":{"parts":[{"text":"invalid"}]}}]}""")) {
            assertThatThrownBy { model.content(body) }.isInstanceOfSatisfying(AiFailure::class.java) {
                assertThat(it.code).isEqualTo("AI_INVALID_RESULT")
                assertThat(it.message).doesNotContain("PRIVATE")
            }
        }
    }

    @Test fun `quota retry info preserves the longest duration without exposing account details or retrying`() {
        val model = adapter()
        val body = """{"error":{"message":"PRIVATE ACCOUNT","details":[{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"967.68s"}]}}"""
        val failure = model.providerFailure(429, body, "300")!!
        assertThat(failure.retryAfterSeconds).isBetween(967, 968)
        assertThat(failure.message).isEqualTo("AI_RATE_LIMITED")
        assertThatThrownBy { model.generateJson("rules","data", emptyMap()) }.isInstanceOfSatisfying(AiFailure::class.java) { assertThat(it.retryAfterSeconds).isBetween(967,968) }
        assertThat(GroqCooldown().remainingSeconds()).isZero()
        assertThat(adapter().providerFailure(429,"""{"error":{"details":[{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"15.4s"}]}}""",null)!!.retryAfterSeconds).isBetween(15,16)
        assertThat(model.providerFailure(403,"PRIVATE",null)!!.code).isEqualTo("AI_ACCESS_DENIED")
        assertThat(model.providerFailure(503,"PRIVATE",null)!!.code).isEqualTo("AI_UNAVAILABLE")
    }

    @Test fun `adapter makes exactly one request with a header key and returns only structured content`() {
        val client = mock(HttpClient::class.java)
        @Suppress("UNCHECKED_CAST") val response = mock(HttpResponse::class.java) as HttpResponse<String>
        `when`(response.statusCode()).thenReturn(200)
        `when`(response.headers()).thenReturn(HttpHeaders.of(emptyMap()) { _,_ -> true })
        `when`(response.body()).thenReturn("""{"candidates":[{"finishReason":"STOP","content":{"parts":[{"text":"{\"skills\":[\"Kotlin\"]}"}]}}],"usageMetadata":{"promptTokenCount":10}}""")
        `when`(client.send(any(HttpRequest::class.java), any<HttpResponse.BodyHandler<String>>())).thenReturn(response)
        val model = GeminiAiModel(mapper,"fictional-key",routing,client)
        assertThat(model.generateJson("rules","data",emptyMap())).isEqualTo("""{"skills":["Kotlin"]}""")
        val capture = ArgumentCaptor.forClass(HttpRequest::class.java)
        verify(client,times(1)).send(capture.capture(),any<HttpResponse.BodyHandler<String>>())
        assertThat(capture.value.uri().toString()).isEqualTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent")
        assertThat(capture.value.uri().rawQuery).isNull()
        assertThat(capture.value.headers().firstValue("x-goog-api-key")).isEqualTo(Optional.of("fictional-key"))
    }

    @Test fun `explicit routing never falls back to another provider after quota failure`() {
        val groq=mock(GroqAiModel::class.java); val gemini=mock(GeminiAiModel::class.java)
        `when`(gemini.generateJson("rules","data",emptyMap(),AiTask.JOB_ANALYSIS)).thenThrow(AiFailure("AI_RATE_LIMITED",429,900))
        assertThatThrownBy { RoutedAiModel(routing,groq,gemini).generateJson("rules","data",emptyMap()) }.isInstanceOf(AiFailure::class.java)
        verifyNoInteractions(groq)
    }

    @Test fun `approval fingerprints include all recipients tasks and models and reject stale Groq approval`() {
        val env = MockEnvironment(); val config = AiRouting(env)
        val old = config.preview(AiTask.DOCUMENT_EXTRACTION,AiTask.PROFILE_SUMMARY)
        assertThat(config.requireApproval(null,AiTask.DOCUMENT_EXTRACTION).selections.single().provider).isEqualTo("Groq")
        env.setProperty("AI_DOCUMENT_PROVIDER","gemini")
        assertThat(config.preview(AiTask.DOCUMENT_EXTRACTION,AiTask.PROFILE_SUMMARY).token).isNotEqualTo(old.token)
        for(token in listOf(null,old.token)) assertThatThrownBy { config.requireApproval(token,AiTask.DOCUMENT_EXTRACTION,AiTask.PROFILE_SUMMARY) }.isInstanceOfSatisfying(AiFailure::class.java) { assertThat(it.code).isEqualTo("AI_APPROVAL_CHANGED") }
        val approved = config.preview(AiTask.DOCUMENT_EXTRACTION,AiTask.PROFILE_SUMMARY)
        assertThat(approved.selections.map { it.provider }).containsExactly("Gemini","Groq")
        assertThat(config.requireApproval(approved.token,AiTask.DOCUMENT_EXTRACTION,AiTask.PROFILE_SUMMARY)).isEqualTo(approved)
        env.setProperty("GEMINI_DOCUMENT_MODEL","gemini-3.5-flash-lite")
        assertThatThrownBy { config.requireApproval(approved.token,AiTask.DOCUMENT_EXTRACTION,AiTask.PROFILE_SUMMARY) }.isInstanceOf(AiFailure::class.java)
    }
}
