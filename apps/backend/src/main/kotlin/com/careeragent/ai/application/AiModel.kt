package com.careeragent.ai.application

interface AiModel {
    fun generateJson(system: String, user: String, schema: Map<String, Any>): String
}

class AiFailure(val code: String, val httpStatus: Int, val retryAfterSeconds: Int? = null, val reason: String? = null) : RuntimeException(code)
