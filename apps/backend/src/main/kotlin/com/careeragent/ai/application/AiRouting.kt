package com.careeragent.ai.application

import org.springframework.core.env.Environment
import org.springframework.core.env.StandardEnvironment
import org.springframework.stereotype.Component
import java.security.MessageDigest

data class AiSelection(val provider: String, val model: String)
data class AiApprovalPreview(val token: String, val selections: List<AiSelection>)

/** Non-secret task configuration, also used to bind private-data approval to its recipients. */
@Component
class AiRouting(private val environment: Environment = StandardEnvironment()) {
    fun selection(task: AiTask): AiSelection {
        val suffix = when (task) {
            AiTask.JOB_ANALYSIS -> "JOB"
            AiTask.DOCUMENT_EXTRACTION -> "DOCUMENT"
            AiTask.PROFILE_SUMMARY -> "PROFILE"
            AiTask.PERSONAL_MATCH -> "MATCH"
        }
        fun value(name: String, fallback: String) = environment.getProperty(name)?.trim()?.takeIf { it.isNotEmpty() } ?: fallback
        val provider = value("AI_${suffix}_PROVIDER", value("AI_PROVIDER", "groq")).lowercase()
        val defaultModel = when (provider) {
            "groq" -> "openai/gpt-oss-20b"
            "gemini" -> "gemini-3.5-flash"
            else -> throw AiFailure("AI_NOT_CONFIGURED", 503)
        }
        val prefix = provider.uppercase()
        return AiSelection(if (provider == "gemini") "Gemini" else "Groq",
            value("${prefix}_${suffix}_MODEL", value("${prefix}_MODEL", defaultModel)))
    }

    fun preview(vararg tasks: AiTask): AiApprovalPreview {
        val selections = tasks.map(::selection).distinct()
        val canonical = tasks.joinToString("\n") { "$it:${selection(it).provider}:${selection(it).model}" }
        val token = MessageDigest.getInstance("SHA-256").digest(canonical.toByteArray(Charsets.UTF_8))
            .joinToString("") { "%02x".format(it) }
        return AiApprovalPreview(token, selections)
    }

    fun requireApproval(token: String?, vararg tasks: AiTask): AiApprovalPreview {
        val current = preview(*tasks)
        // Old clients approved Groq explicitly. They can never authorize a new recipient implicitly.
        if (token != current.token && !(token == null && current.selections.all { it.provider == "Groq" }))
            throw AiFailure("AI_APPROVAL_CHANGED", 409)
        return current
    }
}
