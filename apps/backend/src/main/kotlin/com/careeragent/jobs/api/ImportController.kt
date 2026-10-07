package com.careeragent.jobs.api

import com.careeragent.jobs.application.*
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.annotation.*
import java.util.concurrent.Semaphore

data class ImportRequest(val url: String = "")

@RestController
@RequestMapping("/api/jobs")
class ImportController(private val importer: JobImporter) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val permits = Semaphore(1)
    @PostMapping("/import", consumes = ["application/json"])
    fun import(@RequestBody request: ImportRequest): ResponseEntity<ImportedJob> {
        if (!permits.tryAcquire()) throw ImportFailure("SOURCE_BUSY", 429)
        try { return ResponseEntity.ok().header("Cache-Control", "no-store").body(importer.import(request.url)) } finally { permits.release() }
    }
    @ExceptionHandler(ImportFailure::class)
    fun failure(error: ImportFailure): ResponseEntity<Map<String, String>> {
        logger.warn("Job import rejected: code={}, status={}", error.code, error.httpStatus)
        val response = ResponseEntity.status(error.httpStatus)
        error.retryAfterSeconds?.let { response.header("Retry-After", it.toString()) }
        return response.header("Cache-Control", "no-store").body(mapOf("code" to error.code))
    }
    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun malformed() = ResponseEntity.badRequest().body(mapOf("code" to "INVALID_URL"))
}
