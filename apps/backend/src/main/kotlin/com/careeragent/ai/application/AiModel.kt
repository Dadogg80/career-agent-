package com.careeragent.ai.application

enum class AiTask { JOB_ANALYSIS, DOCUMENT_EXTRACTION, PROFILE_SUMMARY, PERSONAL_MATCH }

interface AiModel {
    fun generateJson(system: String, user: String, schema: Map<String, Any>): String
    fun generateJson(system: String, user: String, schema: Map<String, Any>, task: AiTask): String = generateJson(system,user,schema)
}

class AiFailure(val code: String, val httpStatus: Int, val retryAfterSeconds: Int? = null, val reason: String? = null) : RuntimeException(code)
