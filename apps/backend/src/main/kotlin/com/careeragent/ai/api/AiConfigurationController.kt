package com.careeragent.ai.api

import com.careeragent.ai.application.*
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/ai/config")
class AiConfigurationController(private val routing: AiRouting) {
    @GetMapping fun configuration() = ResponseEntity.ok().header("Cache-Control", "no-store").body(mapOf(
        "tasks" to AiTask.entries.associate { it.name to routing.selection(it) },
        "documents" to routing.preview(AiTask.DOCUMENT_EXTRACTION, AiTask.PROFILE_SUMMARY),
        "documentExcerpt" to routing.preview(AiTask.DOCUMENT_EXTRACTION),
        "matching" to routing.preview(AiTask.PERSONAL_MATCH)))
    @ExceptionHandler(AiFailure::class) fun failed(error: AiFailure) = ResponseEntity.status(error.httpStatus)
        .header("Cache-Control", "no-store").body(mapOf("code" to error.code))
}
