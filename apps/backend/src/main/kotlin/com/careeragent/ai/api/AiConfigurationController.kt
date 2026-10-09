package com.careeragent.ai.api

import com.careeragent.ai.application.*
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.beans.factory.annotation.Value

@RestController
@RequestMapping("/api/ai/config")
class AiConfigurationController(private val routing: AiRouting,
    @Value("\${GROQ_MODEL:openai/gpt-oss-20b}") private val browserModel: String) {
    @GetMapping fun configuration() = ResponseEntity.ok().header("Cache-Control", "no-store").body(mapOf(
        "tasks" to AiTask.entries.associate { it.name to routing.selection(it) },
        "sourceBrowser" to AiSelection("Groq",browserModel),
        "documents" to routing.preview(AiTask.DOCUMENT_EXTRACTION, AiTask.PROFILE_SUMMARY),
        "documentExcerpt" to routing.preview(AiTask.DOCUMENT_EXTRACTION),
        "job" to routing.preview(AiTask.JOB_ANALYSIS), "matching" to routing.preview(AiTask.PERSONAL_MATCH), "tailoring" to routing.preview(AiTask.CV_TAILORING),
        "options" to mapOf("job" to routing.options(AiTask.JOB_ANALYSIS),"documents" to routing.options(AiTask.DOCUMENT_EXTRACTION,AiTask.PROFILE_SUMMARY),
            "documentExcerpt" to routing.options(AiTask.DOCUMENT_EXTRACTION), "matching" to routing.options(AiTask.PERSONAL_MATCH), "tailoring" to routing.options(AiTask.CV_TAILORING))))
    @ExceptionHandler(AiFailure::class) fun failed(error: AiFailure) = ResponseEntity.status(error.httpStatus)
        .header("Cache-Control", "no-store").body(mapOf("code" to error.code))
}
