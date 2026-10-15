package com.careeragent.ai.infrastructure

import com.careeragent.ai.application.*
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.core.env.Environment
import org.springframework.stereotype.Component
import java.math.BigDecimal
import java.net.InetSocketAddress
import java.net.ProxySelector
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

/** Stateless structured generation only. Existing application prompts and validators stay authoritative. */
@Component
class OpenAiModel(
    private val mapper: ObjectMapper,
    private val routing: AiRouting,
    private val cooldowns: AiCooldowns,
    private val environment: Environment,
    private val client: HttpClient = openAiHttpClient(),
) : AiModel {
    private val logger = LoggerFactory.getLogger(javaClass)

    internal fun requestBody(system: String, user: String, schema: Map<String, Any>, task: AiTask,
        selection: AiSelection, maxOutputTokens: Int? = null): Map<String, Any> {
        if (selection.provider != "OpenAI" || selection.model !in AiModelCapabilities.openAiStructuredModels || task == AiTask.JOB_SOURCE_RETRIEVAL)
            throw AiFailure("AI_NOT_CONFIGURED", 503)
        return mapOf(
            "model" to selection.model,
            "store" to false,
            "service_tier" to "default",
            "instructions" to system,
            "input" to listOf(mapOf("role" to "user", "content" to listOf(mapOf("type" to "input_text", "text" to user)))),
            "reasoning" to mapOf("effort" to "low"),
            "max_output_tokens" to boundedOutputTokens(when (task) {
                AiTask.PROFILE_SUMMARY -> 4096
                AiTask.CV_TAILORING -> 16384
                else -> 8192
            }, maxOutputTokens),
            "text" to mapOf("format" to mapOf("type" to "json_schema", "name" to "career_analysis", "strict" to true, "schema" to schema)),
        )
    }

    internal fun providerFailure(status: Int, body: String, retryAfter: String?, model: String): AiFailure? {
        if (status == 200) return null
        val code = try { mapper.readTree(body).path("error").path("code").asText() } catch (_: Exception) { "" }
        return when (status) {
            401, 403 -> AiFailure("AI_ACCESS_DENIED", 503)
            413 -> AiFailure("AI_REQUEST_TOO_LARGE", 413)
            429 -> if (code == "insufficient_quota") AiFailure("AI_BUDGET_REACHED", 429)
                else AiFailure("AI_RATE_LIMITED", 429, cooldowns.forModel("OpenAI", model).record(retryAfter))
            400 -> if (code == "invalid_json_schema") AiFailure("AI_INVALID_RESULT", 502, reason = "PROVIDER_SCHEMA_MISMATCH")
                else AiFailure("AI_UNAVAILABLE", 503)
            404 -> AiFailure("AI_NOT_CONFIGURED", 503)
            else -> AiFailure("AI_UNAVAILABLE", 503)
        }
    }

    internal fun content(body: String): String {
        val root = try { mapper.readTree(body) } catch (_: Exception) {
            throw AiFailure("AI_INVALID_RESULT", 502, reason = "MALFORMED_JSON")
        }
        if (root?.path("status")?.asText() != "completed") throw AiFailure("AI_INVALID_RESULT", 502, reason = "OUTPUT_INCOMPLETE")
        val output = root.path("output")
        if (!output.isArray || output.size() > 100) throw AiFailure("AI_INVALID_RESULT", 502, reason = "EMPTY_OUTPUT")
        val messages = output.filter { it.path("type").asText() == "message" }
        if (messages.any { it.path("content").any { block -> block.path("type").asText() == "refusal" } })
            throw AiFailure("AI_INVALID_RESULT", 502, reason = "OUTPUT_REFUSED")
        if (messages.any { it.path("role").asText() != "assistant" || it.path("status").asText() != "completed" })
            throw AiFailure("AI_INVALID_RESULT", 502, reason = "OUTPUT_INCOMPLETE")
        val text = messages.flatMap { it.path("content").toList() }
            .filter { it.path("type").asText() == "output_text" && it.path("text").isTextual }
            .joinToString("") { it.path("text").asText() }
        if (text.isBlank()) throw AiFailure("AI_INVALID_RESULT", 502, reason = "EMPTY_OUTPUT")
        try { if (mapper.readTree(text)?.isObject != true) throw IllegalArgumentException() }
        catch (_: Exception) { throw AiFailure("AI_INVALID_RESULT", 502, reason = "MALFORMED_JSON") }
        return text
    }

    override fun generateJson(system: String, user: String, schema: Map<String, Any>) =
        generateJson(system, user, schema, AiTask.JOB_ANALYSIS)

    override fun generateJson(system: String, user: String, schema: Map<String, Any>, task: AiTask) =
        generateJson(system, user, schema, task, routing.selection(task))

    override fun generateJson(system: String, user: String, schema: Map<String, Any>, task: AiTask, selection: AiSelection) =
        generate(system, user, schema, task, selection, null)

    override fun generateJson(system: String, user: String, schema: Map<String, Any>, task: AiTask, selection: AiSelection, maxOutputTokens: Int) =
        generate(system, user, schema, task, selection, maxOutputTokens)

    private fun generate(system: String, user: String, schema: Map<String, Any>, task: AiTask, selection: AiSelection, maxOutputTokens: Int?): String {
        val apiKey = openAiApiKey(environment)
        if (apiKey.isBlank()) throw AiFailure("AI_NOT_CONFIGURED", 503)
        val body = requestBody(system, user, schema, task, selection, maxOutputTokens)
        val wait = cooldowns.forModel("OpenAI", selection.model).remainingSeconds()
        if (wait > 0) throw AiFailure("AI_RATE_LIMITED", 429, wait)
        val request = HttpRequest.newBuilder(URI.create("https://api.openai.com/v1/responses"))
            .timeout(Duration.ofSeconds(75))
            .header("Authorization", "Bearer $apiKey")
            .header("Content-Type", "application/json")
            .header("User-Agent", "career-agent/0.1")
            .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body))).build()
        val start = System.nanoTime()
        try {
            val response = client.send(request, HttpResponse.BodyHandlers.ofString())
            providerFailure(response.statusCode(), response.body(), response.headers().firstValue("retry-after").orElse(null), selection.model)?.let {
                val providerCode = try { mapper.readTree(response.body()).path("error").path("code").asText()
                    .takeIf { code -> code.matches(Regex("[A-Za-z0-9_-]{1,80}")) } } catch (_: Exception) { null }
                logger.warn("openai_request_failed task={} model={} status={} category={} providerCode={}", task, selection.model, response.statusCode(), it.code, providerCode)
                throw it
            }
            if (response.body().length > 1_000_000) throw AiFailure("AI_INVALID_RESULT", 502, reason = "OUTPUT_INCOMPLETE")
            val root = try { mapper.readTree(response.body()) } catch (_: Exception) {
                throw AiFailure("AI_INVALID_RESULT", 502, reason = "MALFORMED_JSON")
            }
            val usage = OpenAiUsage.parse(root.path("usage"))
            val estimate = usage?.estimatedUsd(selection.model)
            val actualModel = root.path("model").asText().takeIf { it.matches(Regex("[A-Za-z0-9._-]{1,100}")) }
            // Output tokens already include reasoning. Neither credentials nor prompt/output text belongs in logs.
            logger.info("openai_usage task={} model={} actualModel={} inputTokens={} cachedTokens={} outputTokens={} reasoningTokens={} totalTokens={} estimatedUsd={} priceDate={} durationMs={}",
                task, selection.model, actualModel, usage?.inputTokens, usage?.cachedTokens, usage?.outputTokens,
                usage?.reasoningTokens, usage?.totalTokens, estimate?.toPlainString(), OpenAiUsage.PRICE_DATE,
                (System.nanoTime() - start) / 1_000_000)
            return content(response.body())
        } catch (error: AiFailure) { throw error }
        catch (_: InterruptedException) { Thread.currentThread().interrupt(); throw AiFailure("AI_UNAVAILABLE", 503) }
        catch (error: Exception) {
            logger.warn("openai_transport_failed category={}", if (error is java.net.http.HttpTimeoutException) "TIMEOUT" else "NETWORK_OR_RESPONSE")
            throw AiFailure("AI_UNAVAILABLE", 503)
        }
    }
}

/** Standard text pricing estimate only, not an invoice or an account spending limit. */
internal data class OpenAiUsage(val inputTokens: Long, val cachedTokens: Long, val outputTokens: Long,
    val reasoningTokens: Long, val totalTokens: Long) {
    fun estimatedUsd(model: String): BigDecimal? {
        val rates = when (model) {
            "gpt-5.4-mini" -> listOf("0.75", "0.075", "4.50")
            "gpt-5.4" -> listOf("2.50", "0.25", "15.00")
            else -> return null
        }.map(::BigDecimal)
        return (BigDecimal.valueOf(inputTokens - cachedTokens) * rates[0] +
            BigDecimal.valueOf(cachedTokens) * rates[1] + BigDecimal.valueOf(outputTokens) * rates[2])
            .divide(BigDecimal("1000000"))
    }

    companion object {
        const val PRICE_DATE = "2026-10-15"
        fun parse(node: JsonNode): OpenAiUsage? {
            fun count(n: JsonNode): Long? = if (n.isIntegralNumber && n.canConvertToLong() && n.asLong() >= 0) n.asLong() else null
            val input = count(node.path("input_tokens")) ?: return null
            val output = count(node.path("output_tokens")) ?: return null
            val cachedNode = node.path("input_tokens_details").path("cached_tokens")
            val reasoningNode = node.path("output_tokens_details").path("reasoning_tokens")
            val cached = if (cachedNode.isMissingNode) 0L else count(cachedNode) ?: return null
            val reasoning = if (reasoningNode.isMissingNode) 0L else count(reasoningNode) ?: return null
            val total = count(node.path("total_tokens")) ?: return null
            if (cached > input || reasoning > output || input > Long.MAX_VALUE - output || total != input + output) return null
            return OpenAiUsage(input, cached, output, reasoning, total)
        }
    }
}

private fun openAiHttpClient(): HttpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5))
    .version(HttpClient.Version.HTTP_1_1).apply {
        val proxy = System.getenv("HTTPS_PROXY") ?: System.getenv("https_proxy")
        if (!proxy.isNullOrBlank()) {
            val uri = URI.create(proxy)
            proxy(ProxySelector.of(InetSocketAddress(uri.host, if (uri.port > 0) uri.port else 80)))
        }
    }.build()
