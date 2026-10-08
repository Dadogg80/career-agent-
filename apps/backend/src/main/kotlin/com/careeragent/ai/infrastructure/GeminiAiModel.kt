package com.careeragent.ai.infrastructure

import com.careeragent.ai.application.*
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.net.InetSocketAddress
import java.net.ProxySelector
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

@Component
class GeminiAiModel(private val mapper: ObjectMapper, @Value("\${GEMINI_API_KEY:}") private val apiKey: String,
    private val routing: AiRouting, private val client: HttpClient = geminiHttpClient(),
    private val cooldowns: AiCooldowns = AiCooldowns()) : AiModel {
    private val logger = LoggerFactory.getLogger(javaClass)

    internal fun requestBody(system: String, user: String, schema: Map<String, Any>, task: AiTask): Map<String, Any> = mapOf(
        "systemInstruction" to mapOf("parts" to listOf(mapOf("text" to system))),
        "contents" to listOf(mapOf("role" to "user", "parts" to listOf(mapOf("text" to user)))),
        "generationConfig" to mapOf("responseMimeType" to "application/json", "responseJsonSchema" to schema,
            "thinkingConfig" to mapOf("thinkingLevel" to "LOW"),
            "maxOutputTokens" to if (task == AiTask.PROFILE_SUMMARY) 4096 else 8192))

    internal fun providerFailure(status: Int, body: String, retryAfter: String?, model: String): AiFailure? = when (status) {
        200 -> null
        401, 403 -> AiFailure("AI_ACCESS_DENIED", 503)
        429 -> {
            val modelCooldown = cooldowns.forModel("Gemini", model)
            // RetryInfo supplies a duration rather than account/error text. Retain only the bounded wait.
            val hint = try {
                mapper.readTree(body).path("error").path("details").filter {
                    it.path("@type").asText() == "type.googleapis.com/google.rpc.RetryInfo"
                }.mapNotNull { Regex("^(\\d+(?:\\.\\d+)?)s$").matchEntire(it.path("retryDelay").asText())?.groupValues?.get(1)?.toDoubleOrNull() }
                    .filter { it.isFinite() && it > 0 }.maxOrNull()
            } catch (_: Exception) { null }
            val wait = if (hint == null) modelCooldown.record(retryAfter) else {
                if (!retryAfter.isNullOrBlank()) modelCooldown.record(retryAfter)
                modelCooldown.record(hint.toString())
            }
            AiFailure("AI_RATE_LIMITED", 429, wait)
        }
        400, 404 -> AiFailure("AI_NOT_CONFIGURED", 503)
        else -> AiFailure("AI_UNAVAILABLE", 503)
    }

    internal fun content(body: String): String {
        val root = try { mapper.readTree(body) } catch (_: Exception) { throw AiFailure("AI_INVALID_RESULT", 502, reason = "MALFORMED_JSON") }
        val candidate = root?.path("candidates")?.path(0)
        if (candidate == null || candidate.isMissingNode) throw AiFailure("AI_INVALID_RESULT", 502, reason = "EMPTY_OUTPUT")
        if (candidate.path("finishReason").asText() != "STOP") throw AiFailure("AI_INVALID_RESULT", 502, reason = "OUTPUT_INCOMPLETE")
        val parts = candidate.path("content").path("parts")
        if (!parts.isArray) throw AiFailure("AI_INVALID_RESULT", 502, reason = "EMPTY_OUTPUT")
        val output = parts.filter { !it.path("thought").asBoolean(false) && it.path("text").isTextual }.joinToString("") { it.path("text").asText() }
        if (output.isBlank()) throw AiFailure("AI_INVALID_RESULT", 502, reason = "EMPTY_OUTPUT")
        try { if (!mapper.readTree(output).isObject) throw IllegalArgumentException() }
        catch (_: Exception) { throw AiFailure("AI_INVALID_RESULT", 502, reason = "MALFORMED_JSON") }
        return output
    }

    override fun generateJson(system: String, user: String, schema: Map<String, Any>) = generateJson(system, user, schema, AiTask.JOB_ANALYSIS)
    override fun generateJson(system: String, user: String, schema: Map<String, Any>, task: AiTask): String = generateJson(system,user,schema,task,routing.selection(task))
    override fun generateJson(system: String, user: String, schema: Map<String, Any>, task: AiTask, selection: AiSelection): String {
        if (apiKey.isBlank()) throw AiFailure("AI_NOT_CONFIGURED", 503)
        val selected = selection
        if (selected.provider != "Gemini" || selected.model !in setOf("gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"))
            throw AiFailure("AI_NOT_CONFIGURED", 503)
        val remaining = cooldowns.forModel("Gemini", selected.model).remainingSeconds()
        if (remaining > 0) throw AiFailure("AI_RATE_LIMITED", 429, remaining)
        val request = HttpRequest.newBuilder(URI.create("https://generativelanguage.googleapis.com/v1beta/models/${selected.model}:generateContent"))
            .timeout(Duration.ofSeconds(25)).header("x-goog-api-key", apiKey)
            .header("Content-Type", "application/json").header("User-Agent", "career-agent/0.1")
            .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(requestBody(system, user, schema, task)))).build()
        try {
            val response = client.send(request, HttpResponse.BodyHandlers.ofString())
            providerFailure(response.statusCode(), response.body(), response.headers().firstValue("retry-after").orElse(null), selected.model)?.let {
                logger.warn("gemini_request_failed task={} model={} status={} category={}", task, selected.model, response.statusCode(), it.code)
                throw it
            }
            val usage = mapper.readTree(response.body()).path("usageMetadata")
            logger.info("gemini_usage task={} model={} inputTokens={} outputTokens={} thinkingTokens={} cachedTokens={} totalTokens={}",
                task, selected.model, usage.path("promptTokenCount").asLong(0), usage.path("candidatesTokenCount").asLong(0),
                usage.path("thoughtsTokenCount").asLong(0), usage.path("cachedContentTokenCount").asLong(0), usage.path("totalTokenCount").asLong(0))
            return content(response.body())
        } catch (error: AiFailure) { throw error }
        catch (_: InterruptedException) { Thread.currentThread().interrupt(); throw AiFailure("AI_UNAVAILABLE", 503) }
        catch (error: Exception) {
            logger.warn("gemini_transport_failed category={}", if (error is java.net.http.HttpTimeoutException) "TIMEOUT" else "NETWORK_OR_RESPONSE")
            throw AiFailure("AI_UNAVAILABLE", 503)
        }
    }
}

private fun geminiHttpClient(): HttpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5))
        .version(HttpClient.Version.HTTP_1_1).apply {
            val proxy = System.getenv("HTTPS_PROXY") ?: System.getenv("https_proxy")
            if (!proxy.isNullOrBlank()) {
                val uri = URI.create(proxy)
                proxy(ProxySelector.of(InetSocketAddress(uri.host, if (uri.port > 0) uri.port else 80)))
            }
        }.build()
