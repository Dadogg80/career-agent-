package com.careeragent.jobs.api

import com.careeragent.ai.application.AiFailure
import com.careeragent.jobs.application.RequirementExtractor
import org.springframework.beans.factory.annotation.Value
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.concurrent.Semaphore
import java.util.concurrent.atomic.AtomicInteger

data class ExtractionRequest(val text: String = "", val locale: String = "nb")

@RestController
@RequestMapping("/api/jobs")
class RequirementsController(
    private val extractor: RequirementExtractor,
    @Value("\${AI_MAX_REQUESTS:20}") private val maxRequests: Int,
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val permits = Semaphore(1)
    private val used = AtomicInteger()

    @PostMapping("/requirements", consumes = ["application/json"])
    fun extract(@RequestBody request: ExtractionRequest): Any {
        if (request.text.trim().length < 40 || request.text.length > 15000 || request.locale !in setOf("nb", "en")) {
            throw AiFailure("INVALID_INPUT", 400)
        }
        if (!permits.tryAcquire()) throw AiFailure("AI_BUSY", 429)
        try {
            if (used.get() >= maxRequests) throw AiFailure("AI_BUDGET_REACHED", 429)
            used.incrementAndGet()
            return extractor.extract(request.text, request.locale)
        } finally {
            permits.release()
        }
    }

    @ExceptionHandler(AiFailure::class)
    fun failure(error: AiFailure): ResponseEntity<Map<String, String>> {
        logger.warn("Job analysis rejected: code={}, status={}", error.code, error.httpStatus)
        val response = ResponseEntity.status(error.httpStatus)
        error.retryAfterSeconds?.let { response.header("Retry-After", it.toString()) }
        return response.body(mapOf("code" to error.code))
    }

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun malformed(): ResponseEntity<Map<String, String>> =
        ResponseEntity.badRequest().body(mapOf("code" to "INVALID_INPUT"))
}
