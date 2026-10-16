package com.careeragent.ai.infrastructure

import com.careeragent.ai.application.*
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.ArgumentCaptor
import org.mockito.Mockito.*
import org.springframework.mock.env.MockEnvironment
import java.net.http.HttpClient
import java.net.http.HttpHeaders
import java.net.http.HttpRequest
import java.net.http.HttpResponse

class OpenAiModelTest {
    private val mapper = jacksonObjectMapper()
    private val environment = MockEnvironment().withProperty("CAREER_OPENAI_API_KEY", "fictional-key")
    private val selection = AiSelection("OpenAI", "gpt-5.4-mini")
    private fun adapter(env: MockEnvironment = environment, cooldowns: AiCooldowns = AiCooldowns()) =
        OpenAiModel(mapper, AiRouting(env), cooldowns, env)
    private fun response(text: String = "{}", status: String = "completed") = mapper.writeValueAsString(mapOf(
        "status" to status, "model" to "gpt-5.4-mini", "usage" to mapOf("input_tokens" to 1000, "output_tokens" to 200,
            "total_tokens" to 1200, "input_tokens_details" to mapOf("cached_tokens" to 200), "output_tokens_details" to mapOf("reasoning_tokens" to 80)),
        "output" to listOf(mapOf("type" to "reasoning", "summary" to emptyList<String>()),
            mapOf("type" to "message", "role" to "assistant", "status" to "completed", "content" to listOf(mapOf("type" to "output_text", "text" to text)))),
    ))

    @Test fun `Responses requests preserve instructions source and schema without tools storage or prompt changes`() {
        val schema = mapOf<String, Any>("type" to "object", "properties" to emptyMap<String, Any>(), "required" to emptyList<String>(), "additionalProperties" to false)
        for (task in AiTask.entries.filter { it != AiTask.JOB_SOURCE_RETRIEVAL }) {
            val body = mapper.valueToTree<JsonNode>(adapter().requestBody("EXACT RULES", "EXACT SOURCE", schema, task, selection))
            assertThat(body.path("instructions").asText()).isEqualTo("EXACT RULES")
            assertThat(body.at("/input/0/content/0/text").asText()).isEqualTo("EXACT SOURCE")
            assertThat(body.at("/text/format/schema")).isEqualTo(mapper.valueToTree<JsonNode>(schema))
            assertThat(body.at("/text/format/strict").asBoolean()).isTrue()
            assertThat(body.path("store").asBoolean()).isFalse()
            assertThat(body.path("service_tier").asText()).isEqualTo("default")
            assertThat(body.at("/reasoning/effort").asText()).isEqualTo("medium")
            assertThat(body.has("tools") || body.has("previous_response_id") || body.has("temperature")).isFalse()
        }
        assertThatThrownBy { adapter().requestBody("", "", schema, AiTask.JOB_SOURCE_RETRIEVAL, selection) }.isInstanceOf(AiFailure::class.java)
    }

    @Test fun `OpenAI respects output ceilings and rejects unsupported recipients`() {
        assertThat(adapter().requestBody("", "", emptyMap(), AiTask.CV_TAILORING, selection, 2048)["max_output_tokens"]).isEqualTo(2048)
        for (limit in listOf(0, -1, 32769)) assertThatThrownBy {
            adapter().requestBody("", "", emptyMap(), AiTask.JOB_ANALYSIS, selection, limit)
        }.isInstanceOf(AiFailure::class.java)
        for (invalid in listOf(AiSelection("Gemini", selection.model), AiSelection("OpenAI", "unlisted"))) assertThatThrownBy {
            adapter().requestBody("", "", emptyMap(), AiTask.JOB_ANALYSIS, invalid)
        }.isInstanceOf(AiFailure::class.java)
    }

    @Test fun `task budgets are configurable and smaller explicit bounds remain authoritative`() {
        for (task in AiTask.entries.filter { it != AiTask.JOB_SOURCE_RETRIEVAL }) {
            assertThat(adapter().requestBody("", "", emptyMap(), task, selection)["max_output_tokens"])
                .isEqualTo(if (task == AiTask.PROFILE_SUMMARY) 16384 else 32768)
        }
        val env = MockEnvironment().withProperty("OPENAI_MAX_OUTPUT_TOKENS", "40000")
            .withProperty("OPENAI_DOCUMENT_MAX_OUTPUT_TOKENS", "50000").withProperty("OPENAI_REASONING_EFFORT", "high")
            .withProperty("OPENAI_REQUEST_TIMEOUT_SECONDS", "240")
        val configured = adapter(env)
        assertThat(configured.requestBody("", "", emptyMap(), AiTask.DOCUMENT_EXTRACTION, selection)["max_output_tokens"]).isEqualTo(50000)
        assertThat(configured.requestBody("", "", emptyMap(), AiTask.PERSONAL_MATCH, selection)["max_output_tokens"]).isEqualTo(40000)
        assertThat(configured.requestBody("", "", emptyMap(), AiTask.DOCUMENT_EXTRACTION, selection, 2048)["max_output_tokens"]).isEqualTo(2048)
        assertThat(configured.requestBody("", "", emptyMap(), AiTask.JOB_ANALYSIS, selection)["reasoning"]).isEqualTo(mapOf("effort" to "high"))
        assertThat(configured.requestTimeout().seconds).isEqualTo(240)
    }

    @Test fun `invalid budgets reasoning and timeouts fail before a provider request`() {
        for ((name, value) in listOf("OPENAI_MAX_OUTPUT_TOKENS" to "65537", "OPENAI_MATCH_MAX_OUTPUT_TOKENS" to "0",
            "OPENAI_MAX_OUTPUT_TOKENS" to "invalid", "OPENAI_REASONING_EFFORT" to "low")) {
            assertThatThrownBy { adapter(MockEnvironment().withProperty(name, value))
                .requestBody("", "", emptyMap(), AiTask.PERSONAL_MATCH, selection) }.isInstanceOf(AiFailure::class.java)
        }
        for (value in listOf("29", "301", "invalid")) {
            assertThatThrownBy { adapter(MockEnvironment().withProperty("OPENAI_REQUEST_TIMEOUT_SECONDS", value)).requestTimeout() }
                .isInstanceOf(AiFailure::class.java)
        }
    }

    @Test fun `Sol and Luna are explicit supported recipients across structured tasks without changing defaults`() {
        val routing = AiRouting(environment)
        for (name in listOf("gpt-6.1-sol", "gpt-6-luna")) {
            val recipient = AiSelection("OpenAI", name)
            for (task in AiTask.entries.filter { it != AiTask.JOB_SOURCE_RETRIEVAL }) {
                val option = routing.options(task).single { it.approval.selections == listOf(recipient) }
                assertThat(option.available).isTrue()
                assertThat(routing.resolveApproval(option.approval.token, task).tasks.values).containsOnly(recipient)
                val body = adapter().requestBody("rules", "source", emptyMap(), task, recipient)
                assertThat(body["model"]).isEqualTo(name)
                assertThat(body["reasoning"]).isEqualTo(mapOf("effort" to "medium"))
                assertThat(body["store"]).isEqualTo(false)
                assertThatThrownBy { adapter().requestBody("", "", emptyMap(), AiTask.JOB_SOURCE_RETRIEVAL, recipient) }
                    .isInstanceOf(AiFailure::class.java)
            }
            val combined = routing.options(AiTask.DOCUMENT_EXTRACTION, AiTask.PROFILE_SUMMARY)
                .single { it.approval.selections == listOf(recipient) }
            assertThat(routing.resolveApproval(combined.approval.token, AiTask.DOCUMENT_EXTRACTION, AiTask.PROFILE_SUMMARY)
                .tasks.values).containsOnly(recipient)
            assertThat(combined.approval.token).isNotEqualTo(routing.preview(AiTask.DOCUMENT_EXTRACTION, AiTask.PROFILE_SUMMARY).token)
            assertThat(AiRouting(MockEnvironment()).options(AiTask.JOB_ANALYSIS)
                .single { it.approval.selections == listOf(recipient) }.available).isFalse()
        }
        val recipients = routing.options(AiTask.PERSONAL_MATCH).filter { it.approval.selections.single().provider == "OpenAI" }
        assertThat(recipients.map { it.approval.token }).doesNotHaveDuplicates().hasSize(4)
        assertThat(routing.selection(AiTask.JOB_ANALYSIS)).isEqualTo(AiSelection("Groq", "openai/gpt-oss-20b"))
        assertThat(AiRouting(MockEnvironment().withProperty("AI_PROVIDER", "openai")).selection(AiTask.JOB_ANALYSIS)).isEqualTo(selection)
    }

    @Test fun `GPT6 estimates count cache writes and long-context rates without double charging reasoning`() {
        val standard = OpenAiUsage(1000, 200, 200, 80, 1200, 100)
        assertThat(standard.estimatedUsd("gpt-6.1-sol")).isEqualByComparingTo("0.00367")
        assertThat(standard.estimatedUsd("gpt-6-luna")).isEqualByComparingTo("0.0001845")
        assertThat(standard.estimatedUsd("gpt-5.4-mini")).isNull()
        assertThat(OpenAiUsage(272000, 0, 100, 0, 272100).estimatedUsd("gpt-6.1-sol")).isEqualByComparingTo("0.545")
        assertThat(OpenAiUsage(272001, 0, 100, 0, 272101).estimatedUsd("gpt-6.1-sol")).isEqualByComparingTo("1.089504")
        val body = mapper.readTree("""{"input_tokens":1000,"output_tokens":200,"total_tokens":1200,"input_tokens_details":{"cached_tokens":200,"cache_write_tokens":100}}""")
        assertThat(OpenAiUsage.parse(body)!!.cacheWriteTokens).isEqualTo(100)
        (body.path("input_tokens_details") as com.fasterxml.jackson.databind.node.ObjectNode).put("cache_write_tokens", 801)
        assertThat(OpenAiUsage.parse(body)).isNull()
    }

    @Test fun `response parser accepts assistant JSON and ignores reasoning output`() {
        assertThat(adapter().content(response("{\"facts\":[]}"))).isEqualTo("{\"facts\":[]}")
    }

    @Test fun `response parser rejects incomplete refused empty and malformed content`() {
        val refused = """{"status":"completed","output":[{"type":"message","role":"assistant","status":"completed","content":[{"type":"refusal","refusal":"not available"}]}]}"""
        for ((body, reason) in listOf(response(status = "incomplete") to "OUTPUT_INCOMPLETE", refused to "OUTPUT_REFUSED",
            response("") to "EMPTY_OUTPUT", response("[]") to "MALFORMED_JSON", "invalid" to "MALFORMED_JSON")) {
            assertThatThrownBy { adapter().content(body) }.isInstanceOfSatisfying(AiFailure::class.java) { assertThat(it.reason).isEqualTo(reason) }
        }
    }

    @Test fun `usage accounts cached input and reasoning exactly once`() {
        val usage = OpenAiUsage.parse(mapper.readTree(response()).path("usage"))!!
        assertThat(usage.estimatedUsd("gpt-5.4-mini")).isEqualByComparingTo("0.001515")
        assertThat(usage.estimatedUsd("gpt-5.4")).isEqualByComparingTo("0.00505")
        assertThat(usage.reasoningTokens).isEqualTo(80)
        assertThat(usage.estimatedUsd("unlisted")).isNull()
    }

    @Test fun `missing or inconsistent usage is unknown rather than a fabricated zero cost`() {
        for (body in listOf("{}", """{"input_tokens":10,"output_tokens":20,"total_tokens":29}""",
            """{"input_tokens":10,"output_tokens":20,"total_tokens":30,"input_tokens_details":{"cached_tokens":11}}""",
            """{"input_tokens":10,"output_tokens":20,"total_tokens":30,"output_tokens_details":{"reasoning_tokens":21}}""")) {
            assertThat(OpenAiUsage.parse(mapper.readTree(body))).isNull()
        }
    }

    @Test fun `failure classification isolates quota cooldown access and schema errors`() {
        val cooldowns = AiCooldowns(); val model = adapter(cooldowns = cooldowns)
        assertThat(model.providerFailure(429, """{"error":{"code":"insufficient_quota"}}""", null, selection.model)!!.code).isEqualTo("AI_BUDGET_REACHED")
        assertThat(cooldowns.forModel("OpenAI", selection.model).remainingSeconds()).isZero()
        assertThat(model.providerFailure(429, "{}", "90", selection.model)!!.retryAfterSeconds).isBetween(89, 90)
        assertThat(cooldowns.forModel("Gemini", "gemini-3.5-flash-lite").remainingSeconds()).isZero()
        assertThat(model.providerFailure(401, "{}", null, selection.model)!!.code).isEqualTo("AI_ACCESS_DENIED")
        assertThat(model.providerFailure(400, """{"error":{"code":"invalid_json_schema"}}""", null, selection.model)!!.reason).isEqualTo("PROVIDER_SCHEMA_MISMATCH")
    }

    @Test fun `routing preserves defaults keys approvals and source retrieval separation`() {
        val routing = AiRouting(environment)
        assertThat(routing.selection(AiTask.JOB_ANALYSIS)).isEqualTo(AiSelection("Groq", "openai/gpt-oss-20b"))
        val option = routing.options(AiTask.JOB_ANALYSIS).first { it.approval.selections == listOf(selection) }
        assertThat(option.available).isTrue()
        assertThat(routing.resolveApproval(option.approval.token, AiTask.JOB_ANALYSIS).tasks.values).containsExactly(selection)
        assertThat(routing.options(AiTask.JOB_SOURCE_RETRIEVAL)).noneMatch { it.approval.selections.any { s -> s.provider == "OpenAI" } }
        val configured = AiRouting(MockEnvironment().withProperty("AI_PROVIDER", "openai"))
        assertThat(configured.selection(AiTask.JOB_ANALYSIS)).isEqualTo(selection)
        assertThat(configured.selection(AiTask.JOB_SOURCE_RETRIEVAL).provider).isEqualTo("Groq")
        assertThatThrownBy { configured.resolveApproval(null, AiTask.JOB_ANALYSIS) }.isInstanceOf(AiFailure::class.java)
        assertThat(AiRouting(MockEnvironment()).options(AiTask.JOB_ANALYSIS).filter { it.approval.selections.single().provider == "OpenAI" }).allMatch { !it.available }
        assertThat(openAiApiKey(environment.withProperty("OPENAI_API_KEY", "local-key"))).isEqualTo("local-key")
    }

    @Test fun `real adapter transport contract uses Responses once and never retries through another provider`() {
        val client = mock(HttpClient::class.java)
        @Suppress("UNCHECKED_CAST") val http = mock(HttpResponse::class.java) as HttpResponse<String>
        `when`(http.statusCode()).thenReturn(200)
        `when`(http.headers()).thenReturn(HttpHeaders.of(emptyMap()) { _, _ -> true })
        `when`(http.body()).thenReturn(response())
        `when`(client.send(any(HttpRequest::class.java), any<HttpResponse.BodyHandler<String>>())).thenReturn(http)
        val routing = AiRouting(environment)
        val openai = OpenAiModel(mapper, routing, AiCooldowns(), environment, client)
        val groq = mock(GroqAiModel::class.java); val gemini = mock(GeminiAiModel::class.java)
        val routed = RoutedAiModel(routing, groq, gemini, openai = openai)
        assertThat(routed.generateJson("rules", "data", emptyMap(), AiTask.JOB_ANALYSIS, selection)).isEqualTo("{}")
        val request = ArgumentCaptor.forClass(HttpRequest::class.java)
        verify(client, times(1)).send(request.capture(), any<HttpResponse.BodyHandler<String>>())
        assertThat(request.value.timeout().orElseThrow().seconds).isEqualTo(300)
        assertThat(request.value.uri().toString()).isEqualTo("https://api.openai.com/v1/responses")
        assertThat(request.value.headers().firstValue("Authorization").orElse("")).isEqualTo("Bearer fictional-key")
        verifyNoInteractions(groq, gemini)
        `when`(http.statusCode()).thenReturn(503)
        assertThatThrownBy { routed.generateJson("rules", "data", emptyMap(), AiTask.JOB_ANALYSIS, selection) }.isInstanceOf(AiFailure::class.java)
        verify(client, times(2)).send(any(HttpRequest::class.java), any<HttpResponse.BodyHandler<String>>())
        verifyNoInteractions(groq, gemini)
    }
}
