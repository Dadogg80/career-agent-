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

    @Test fun `Gemini 3 point 8 uses the Interactions API structured-output contract`() {
        val schema = mapOf<String,Any>("type" to "object", "additionalProperties" to false)
        val model = adapter()
        val body = model.interactionsRequestBody("system rules", "untrusted input", schema, AiTask.JOB_ANALYSIS)
        assertThat(body["model"]).isEqualTo("gemini-3.8-flash")
        assertThat(body["system_instruction"]).isEqualTo("system rules")
        assertThat(body["input"]).isEqualTo("untrusted input")
        assertThat(body["response_format"]).isEqualTo(mapOf("type" to "text", "mime_type" to "application/json", "schema" to schema))
        assertThat(model.interactionsContent("""{"status":"completed","output_text":"{}"}""")).isEqualTo("{}")
        for (invalid in listOf("""{"status":"in_progress","output_text":"{}"}""", """{"status":"completed","output_text":"not json"}""")) {
            assertThatThrownBy { model.interactionsContent(invalid) }.isInstanceOf(AiFailure::class.java)
        }
    }

    @Test fun `Gemini 3 point 8 analysis uses Interactions endpoint and keeps actual selected model`() {
        val client = mock(HttpClient::class.java)
        @Suppress("UNCHECKED_CAST") val response = mock(HttpResponse::class.java) as HttpResponse<String>
        `when`(response.statusCode()).thenReturn(200)
        `when`(response.headers()).thenReturn(HttpHeaders.of(emptyMap()) { _,_ -> true })
        `when`(response.body()).thenReturn("""{"status":"completed","output_text":"{}","usage":{"input_tokens":10}}""")
        `when`(client.send(any(HttpRequest::class.java), any<HttpResponse.BodyHandler<String>>())).thenReturn(response)
        val model = GeminiAiModel(mapper, "fictional-key", routing, client, AiCooldowns())
        assertThat(model.generateJson("rules", "source", emptyMap(), AiTask.JOB_ANALYSIS, AiSelection("Gemini", "gemini-3.8-flash"))).isEqualTo("{}")
        val capture = ArgumentCaptor.forClass(HttpRequest::class.java)
        verify(client, times(1)).send(capture.capture(), any<HttpResponse.BodyHandler<String>>())
        assertThat(capture.value.uri().toString()).isEqualTo("https://generativelanguage.googleapis.com/v1beta/interactions")
        assertThat(capture.value.headers().firstValue("x-goog-api-key")).isEqualTo(Optional.of("fictional-key"))
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
        val failure = model.providerFailure(429, body, "300", "gemini-3.5-flash")!!
        assertThat(failure.retryAfterSeconds).isBetween(967, 968)
        assertThat(failure.message).isEqualTo("AI_RATE_LIMITED")
        assertThatThrownBy { model.generateJson("rules","data", emptyMap()) }.isInstanceOfSatisfying(AiFailure::class.java) { assertThat(it.retryAfterSeconds).isBetween(967,968) }
        assertThat(GroqCooldown().remainingSeconds()).isZero()
        assertThat(adapter().providerFailure(429,"""{"error":{"details":[{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"15.4s"}]}}""",null,"gemini-3.5-flash")!!.retryAfterSeconds).isBetween(15,16)
        assertThat(model.providerFailure(403,"PRIVATE",null,"gemini-3.5-flash")!!.code).isEqualTo("AI_ACCESS_DENIED")
        assertThat(model.providerFailure(503,"PRIVATE",null,"gemini-3.5-flash")!!.code).isEqualTo("AI_UNAVAILABLE")
    }

    @Test fun `Flash cooldown does not block Flash Lite requests`() {
        val client = mock(HttpClient::class.java)
        @Suppress("UNCHECKED_CAST") val limited = mock(HttpResponse::class.java) as HttpResponse<String>
        `when`(limited.statusCode()).thenReturn(429)
        `when`(limited.headers()).thenReturn(HttpHeaders.of(emptyMap()) { _,_ -> true })
        `when`(limited.body()).thenReturn("""{"error":{"details":[{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"900s"}]}}""")
        @Suppress("UNCHECKED_CAST") val success = mock(HttpResponse::class.java) as HttpResponse<String>
        `when`(success.statusCode()).thenReturn(200)
        `when`(success.headers()).thenReturn(HttpHeaders.of(emptyMap()) { _,_ -> true })
        `when`(success.body()).thenReturn("""{"candidates":[{"finishReason":"STOP","content":{"parts":[{"text":"{}"}]}}]}""")
        `when`(client.send(any(HttpRequest::class.java), any<HttpResponse.BodyHandler<String>>()))
            .thenReturn(limited, success)
        val model = GeminiAiModel(mapper, "fictional-key", routing, client, AiCooldowns())
        val flash = AiSelection("Gemini", "gemini-3.5-flash")
        val lite = AiSelection("Gemini", "gemini-3.5-flash-lite")

        assertThatThrownBy { model.generateJson("rules", "data", emptyMap(), AiTask.JOB_ANALYSIS, flash) }
            .isInstanceOfSatisfying(AiFailure::class.java) {
                assertThat(it.code).isEqualTo("AI_RATE_LIMITED")
                assertThat(it.retryAfterSeconds).isEqualTo(900)
            }
        assertThat(model.generateJson("rules", "data", emptyMap(), AiTask.DOCUMENT_EXTRACTION, lite)).isEqualTo("{}")
        assertThatThrownBy { model.generateJson("rules", "data", emptyMap(), AiTask.JOB_ANALYSIS, flash) }
            .isInstanceOfSatisfying(AiFailure::class.java) { assertThat(it.code).isEqualTo("AI_RATE_LIMITED") }
        verify(client, times(2)).send(any(HttpRequest::class.java), any<HttpResponse.BodyHandler<String>>())
    }

    @Test fun `adapter makes exactly one request with a header key and returns only structured content`() {
        val client = mock(HttpClient::class.java)
        @Suppress("UNCHECKED_CAST") val response = mock(HttpResponse::class.java) as HttpResponse<String>
        `when`(response.statusCode()).thenReturn(200)
        `when`(response.headers()).thenReturn(HttpHeaders.of(emptyMap()) { _,_ -> true })
        `when`(response.body()).thenReturn("""{"candidates":[{"finishReason":"STOP","content":{"parts":[{"text":"{\"skills\":[\"Kotlin\"]}"}]}}],"usageMetadata":{"promptTokenCount":10}}""")
        `when`(client.send(any(HttpRequest::class.java), any<HttpResponse.BodyHandler<String>>())).thenReturn(response)
        val model = GeminiAiModel(mapper,"fictional-key",routing,client,AiCooldowns())
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
        env.setProperty("GEMINI_DOCUMENT_MODEL","gemini-3.5-flash")
        assertThatThrownBy { config.requireApproval(approved.token,AiTask.DOCUMENT_EXTRACTION,AiTask.PROFILE_SUMMARY) }.isInstanceOf(AiFailure::class.java)
    }
    @Test fun `configured alternatives have scoped approvals and request local selection does not mutate defaults`() {
        val env=MockEnvironment().withProperty("GEMINI_API_KEY","fictional-key")
        val routing=AiRouting(env)
        val options=routing.options(AiTask.DOCUMENT_EXTRACTION,AiTask.PROFILE_SUMMARY)
        val gemini=options.first { it.approval.selections.single().provider=="Gemini" }
        assertThat(gemini.available).isTrue()
        val plan=routing.resolveApproval(gemini.approval.token,AiTask.DOCUMENT_EXTRACTION,AiTask.PROFILE_SUMMARY)
        assertThat(plan.tasks.values.map { it.provider }).containsOnly("Gemini")
        assertThat(plan.tasks.values.map { it.model }).containsOnly("gemini-3.5-flash-lite")
        val flash=options.first { it.approval.selections.singleOrNull() == AiSelection("Gemini","gemini-3.5-flash") }
        assertThat(flash.available).isTrue()
        assertThat(routing.resolveApproval(flash.approval.token,AiTask.DOCUMENT_EXTRACTION,AiTask.PROFILE_SUMMARY)
            .tasks.values.map { it.model }).containsOnly("gemini-3.5-flash")
        assertThat(routing.selection(AiTask.DOCUMENT_EXTRACTION).provider).isEqualTo("Groq")
        assertThatThrownBy { routing.resolveApproval(gemini.approval.token,AiTask.PERSONAL_MATCH) }.isInstanceOf(AiFailure::class.java)
        env.setProperty("GEMINI_API_KEY","")
        assertThatThrownBy { routing.resolveApproval(gemini.approval.token,AiTask.DOCUMENT_EXTRACTION,AiTask.PROFILE_SUMMARY) }.isInstanceOf(AiFailure::class.java)
    }
    @Test fun `Flash Lite is an available selectable option for every AI task`() {
        val routing=AiRouting(MockEnvironment()
            .withProperty("GEMINI_API_KEY","fictional-key")
            .withProperty("GROQ_API_KEY","fictional-key"))
        for (task in AiTask.entries.filter { it != AiTask.JOB_SOURCE_RETRIEVAL }) {
            val lite=routing.options(task).single {
                it.available && it.approval.selections.singleOrNull()==AiSelection("Gemini","gemini-3.5-flash-lite")
            }
            assertThat(routing.resolveApproval(lite.approval.token,task).tasks.getValue(task))
                .isEqualTo(AiSelection("Gemini","gemini-3.5-flash-lite"))
        }
    }
    @Test fun `3 point 8 Flash is selectable for job analysis while source retrieval offers only compatible models`() {
        val routing = AiRouting(MockEnvironment().withProperty("GROQ_API_KEY","fictional-key").withProperty("GEMINI_API_KEY","fictional-key"))
        val jobModel = routing.options(AiTask.JOB_ANALYSIS).single {
            it.available && it.approval.selections.singleOrNull() == AiSelection("Gemini", "gemini-3.8-flash")
        }
        assertThat(routing.resolveApproval(jobModel.approval.token, AiTask.JOB_ANALYSIS).tasks.getValue(AiTask.JOB_ANALYSIS))
            .isEqualTo(AiSelection("Gemini", "gemini-3.8-flash"))
        val sourceOptions = routing.options(AiTask.JOB_SOURCE_RETRIEVAL)
        assertThat(sourceOptions.map { it.approval.selections.single() })
            .containsExactly(AiSelection("Groq", "openai/gpt-oss-20b"), AiSelection("Gemini", "gemini-3.8-flash"))
        assertThat(sourceOptions).allMatch { it.available }
    }
    @Test fun `Lite defaults apply to document and profile tasks while analytical and Groq overrides remain intact`() {
        val env = MockEnvironment().withProperty("AI_PROVIDER", "gemini")
            .withProperty("GEMINI_MODEL", "gemini-3.5-flash")
        val config = AiRouting(env)
        for (task in listOf(AiTask.DOCUMENT_EXTRACTION, AiTask.PROFILE_SUMMARY)) {
            assertThat(config.selection(task)).isEqualTo(AiSelection("Gemini", "gemini-3.5-flash-lite"))
        }
        for (task in listOf(AiTask.JOB_ANALYSIS, AiTask.PERSONAL_MATCH)) {
            assertThat(config.selection(task)).isEqualTo(AiSelection("Gemini", "gemini-3.5-flash"))
        }
        env.setProperty("GEMINI_DOCUMENT_MODEL", "gemini-3.5-flash")
        env.setProperty("GEMINI_PROFILE_MODEL", "gemini-3.5-flash")
        assertThat(config.selection(AiTask.DOCUMENT_EXTRACTION).model).isEqualTo("gemini-3.5-flash")
        assertThat(config.selection(AiTask.PROFILE_SUMMARY).model).isEqualTo("gemini-3.5-flash")
        env.setProperty("GEMINI_MATCH_MODEL", "gemini-3.5-flash-lite")
        assertThat(config.selection(AiTask.PERSONAL_MATCH).model).isEqualTo("gemini-3.5-flash-lite")
        assertThat(AiRouting(MockEnvironment()).selection(AiTask.DOCUMENT_EXTRACTION)).isEqualTo(AiSelection("Groq", "openai/gpt-oss-20b"))
        env.setProperty("GROQ_MODEL", "openai/gpt-oss-120b")
        assertThat(config.selection(AiTask.DOCUMENT_EXTRACTION, "groq").model).isEqualTo("openai/gpt-oss-120b")
    }

    @Test fun `moving a private Flash plan to Lite requires renewed approval`() {
        val env = MockEnvironment().withProperty("AI_PROVIDER", "gemini")
            .withProperty("GEMINI_DOCUMENT_MODEL", "gemini-3.5-flash")
            .withProperty("GEMINI_PROFILE_MODEL", "gemini-3.5-flash")
        val config = AiRouting(env)
        val previous = config.preview(AiTask.DOCUMENT_EXTRACTION, AiTask.PROFILE_SUMMARY)
        env.setProperty("GEMINI_DOCUMENT_MODEL", "")
        env.setProperty("GEMINI_PROFILE_MODEL", "")
        assertThatThrownBy { config.resolveApproval(previous.token, AiTask.DOCUMENT_EXTRACTION, AiTask.PROFILE_SUMMARY) }
            .isInstanceOfSatisfying(AiFailure::class.java) { assertThat(it.code).isEqualTo("AI_APPROVAL_CHANGED") }
        val renewed = config.preview(AiTask.DOCUMENT_EXTRACTION, AiTask.PROFILE_SUMMARY)
        assertThat(renewed.selections).containsExactly(AiSelection("Gemini", "gemini-3.5-flash-lite"))
        assertThat(config.resolveApproval(renewed.token, AiTask.DOCUMENT_EXTRACTION, AiTask.PROFILE_SUMMARY).approval).isEqualTo(renewed)
    }
    @Test fun `explicit selected Gemini adapter runs even while default routing is Groq`() {
        val client=mock(HttpClient::class.java)
        @Suppress("UNCHECKED_CAST") val response=mock(HttpResponse::class.java) as HttpResponse<String>
        `when`(response.statusCode()).thenReturn(200)
        `when`(response.headers()).thenReturn(HttpHeaders.of(emptyMap()){ _,_ -> true })
        `when`(response.body()).thenReturn("""{"candidates":[{"finishReason":"STOP","content":{"parts":[{"text":"{}"}]}}]}""")
        `when`(client.send(any(HttpRequest::class.java),any<HttpResponse.BodyHandler<String>>())).thenReturn(response)
        val model=GeminiAiModel(mapper,"fictional-key",AiRouting(MockEnvironment()),client,AiCooldowns())
        assertThat(model.generateJson("rules","data",emptyMap(),AiTask.PERSONAL_MATCH,AiSelection("Gemini","gemini-3.5-flash"))).isEqualTo("{}")
        verify(client,times(1)).send(any(HttpRequest::class.java),any<HttpResponse.BodyHandler<String>>())
    }

}
