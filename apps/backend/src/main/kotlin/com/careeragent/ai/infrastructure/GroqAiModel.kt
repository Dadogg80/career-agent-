package com.careeragent.ai.infrastructure

import com.careeragent.ai.application.AiFailure
import com.careeragent.ai.application.AiModel
import com.fasterxml.jackson.databind.ObjectMapper
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
class GroqAiModel(
    private val mapper: ObjectMapper,
    @Value("\${GROQ_API_KEY:}") private val apiKey: String,
    @Value("\${GROQ_MODEL:openai/gpt-oss-20b}") private val model: String,
) : AiModel {
    private val client: HttpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5))
        .version(HttpClient.Version.HTTP_1_1)
        .apply {
            val proxy = System.getenv("HTTPS_PROXY") ?: System.getenv("https_proxy")
            if (!proxy.isNullOrBlank()) {
                val uri = URI.create(proxy)
                proxy(ProxySelector.of(InetSocketAddress(uri.host, if (uri.port > 0) uri.port else 80)))
            }
        }
        .build()

    override fun generateJson(system: String, user: String, schema: Map<String, Any>): String {
        if (apiKey.isBlank()) throw AiFailure("AI_NOT_CONFIGURED", 503)
        val body = mapOf(
            "model" to model,
            "reasoning_effort" to "low",
            "max_completion_tokens" to 2200,
            "messages" to listOf(
                mapOf("role" to "system", "content" to system),
                mapOf("role" to "user", "content" to user),
            ),
            "response_format" to mapOf(
                "type" to "json_schema",
                "json_schema" to mapOf("name" to "job_requirements", "strict" to true, "schema" to schema),
            ),
        )
        val request = HttpRequest.newBuilder(URI.create("https://api.groq.com/openai/v1/chat/completions"))
            .timeout(Duration.ofSeconds(25))
            .header("Authorization", "Bearer $apiKey")
            .header("User-Agent", "career-agent/0.1")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
            .build()
        try {
            val response = client.send(request, HttpResponse.BodyHandlers.ofString())
            when (response.statusCode()) {
                200 -> Unit
                401, 403 -> throw AiFailure("AI_ACCESS_DENIED", 503)
                429 -> throw AiFailure("AI_RATE_LIMITED", 429)
                else -> throw AiFailure("AI_UNAVAILABLE", 503)
            }
            val json = mapper.readTree(response.body())
            val choice = json.path("choices").path(0)
            if (choice.path("finish_reason").asText() != "stop") throw AiFailure("AI_INVALID_RESULT", 502)
            val content = choice.path("message").path("content")
            if (!content.isTextual || content.asText().isBlank()) throw AiFailure("AI_INVALID_RESULT", 502)
            return content.asText()
        } catch (e: AiFailure) {
            throw e
        } catch (e: InterruptedException) {
            Thread.currentThread().interrupt()
            throw AiFailure("AI_UNAVAILABLE", 503)
        } catch (_: Exception) {
            // Never expose credentials, provider payloads, or input text through error messages.
            throw AiFailure("AI_UNAVAILABLE", 503)
        }
    }
}
