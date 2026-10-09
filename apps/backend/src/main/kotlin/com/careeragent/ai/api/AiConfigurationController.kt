package com.careeragent.ai.api

import com.careeragent.ai.application.*
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/ai/config")
class AiConfigurationController(private val routing: AiRouting) {
    @GetMapping fun configuration() = ResponseEntity.ok().header("Cache-Control", "no-store").body(mapOf(
        "tasks" to AiTask.entries.filter { it != AiTask.JOB_SOURCE_RETRIEVAL }.associate { it.name to routing.selection(it) },
        "sourceBrowser" to routing.selection(AiTask.JOB_SOURCE_RETRIEVAL),
        "sourceRetrieval" to routing.preview(AiTask.JOB_SOURCE_RETRIEVAL),
        "documents" to routing.preview(AiTask.DOCUMENT_EXTRACTION, AiTask.PROFILE_SUMMARY),
        "documentExcerpt" to routing.preview(AiTask.DOCUMENT_EXTRACTION),
        "job" to routing.preview(AiTask.JOB_ANALYSIS), "matching" to routing.preview(AiTask.PERSONAL_MATCH), "tailoring" to routing.preview(AiTask.CV_TAILORING),
        "options" to mapOf("job" to routing.options(AiTask.JOB_ANALYSIS),"sourceRetrieval" to routing.options(AiTask.JOB_SOURCE_RETRIEVAL),
            "documents" to routing.options(AiTask.DOCUMENT_EXTRACTION,AiTask.PROFILE_SUMMARY),
            "documentExcerpt" to routing.options(AiTask.DOCUMENT_EXTRACTION), "matching" to routing.options(AiTask.PERSONAL_MATCH), "tailoring" to routing.options(AiTask.CV_TAILORING))))
    @ExceptionHandler(AiFailure::class) fun failed(error: AiFailure) = ResponseEntity.status(error.httpStatus)
        .header("Cache-Control", "no-store").body(mapOf("code" to error.code))
}
