package com.careeragent.ai.application

/** Adapter-supported model choices for structured JSON generation. Retrieval tools have a separate catalog. */
object AiModelCapabilities {
    val openAiStructuredModels = listOf("gpt-5.4-mini", "gpt-5.4")
    val groqStructuredModels = listOf(
        "openai/gpt-oss-20b",
        "openai/gpt-oss-120b",
    )
    val geminiStructuredModels = listOf(
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
    )

    fun structuredSelections() =
        groqStructuredModels.map { AiSelection("Groq", it) } +
            geminiStructuredModels.map { AiSelection("Gemini", it) } +
            openAiStructuredModels.map { AiSelection("OpenAI", it) }

    fun supportsStructured(selection: AiSelection) = when (selection.provider) {
        "Groq" -> selection.model in groqStructuredModels
        "Gemini" -> selection.model in geminiStructuredModels
        "OpenAI" -> selection.model in openAiStructuredModels
        else -> false
    }

    fun supports(tasks: Set<AiTask>, selections: Collection<AiSelection>): Boolean {
        if (tasks.isEmpty() || selections.isEmpty()) return false
        if (AiTask.JOB_SOURCE_RETRIEVAL in tasks) {
            return tasks == setOf(AiTask.JOB_SOURCE_RETRIEVAL) &&
                selections.all { it in jobSourceRetrievalSelections }
        }
        return selections.all(::supportsStructured)
    }

    /** Models supported by the dedicated URL/browser retrieval integrations, not JSON generation. */
    val jobSourceRetrievalSelections = listOf(
        AiSelection("Groq", "openai/gpt-oss-20b"),
        AiSelection("Groq", "openai/gpt-oss-120b"),
    ) + GeminiSourceModels.models.map { AiSelection("Gemini", it) }
}

object AiFailureReasons {
    const val OUTPUT_REFUSED = "OUTPUT_REFUSED"
    const val EMPTY_OUTPUT = "EMPTY_OUTPUT"
    const val MALFORMED_JSON = "MALFORMED_JSON"
    const val OUTPUT_INCOMPLETE = "OUTPUT_INCOMPLETE"
    const val PROVIDER_SCHEMA_MISMATCH = "PROVIDER_SCHEMA_MISMATCH"
    const val DOCUMENT_RESULT_INVALID = "DOCUMENT_RESULT_INVALID"

    private val safeValues = setOf(
        OUTPUT_REFUSED,
        EMPTY_OUTPUT,
        MALFORMED_JSON,
        OUTPUT_INCOMPLETE,
        PROVIDER_SCHEMA_MISMATCH,
        DOCUMENT_RESULT_INVALID,
    )

    fun safe(value: String?): String? = value?.takeIf(safeValues::contains)
}
