package com.careeragent.ai.application

import org.springframework.core.env.Environment
import org.springframework.core.env.StandardEnvironment
import org.springframework.stereotype.Component
import java.security.MessageDigest

data class AiSelection(val provider: String, val model: String)
data class AiApprovalPreview(val token: String, val selections: List<AiSelection>)
data class AiPlan(val approval: AiApprovalPreview, val tasks: Map<AiTask, AiSelection>)
data class AiOption(val approval: AiApprovalPreview, val available: Boolean)

/** Non-secret task configuration, also used to bind private-data approval to its recipients. */
@Component
class AiRouting(private val environment: Environment = StandardEnvironment()) {
    fun selection(task: AiTask, explicitProvider: String? = null, explicitModel: String? = null): AiSelection {
        val suffix = when (task) {
            AiTask.JOB_ANALYSIS -> "JOB"
            AiTask.DOCUMENT_EXTRACTION -> "DOCUMENT"
            AiTask.PROFILE_SUMMARY -> "PROFILE"
            AiTask.PERSONAL_MATCH -> "MATCH"
        }
        fun value(name: String, fallback: String) = environment.getProperty(name)?.trim()?.takeIf { it.isNotEmpty() } ?: fallback
        val provider = explicitProvider?.lowercase() ?: value("AI_${suffix}_PROVIDER", value("AI_PROVIDER", "groq")).lowercase()
        val defaultModel = when (provider) {
            "groq" -> "openai/gpt-oss-20b"
            "gemini" -> when (task) {
                AiTask.DOCUMENT_EXTRACTION, AiTask.PROFILE_SUMMARY -> "gemini-3.5-flash-lite"
                else -> value("GEMINI_MODEL", "gemini-3.5-flash")
            }
            else -> throw AiFailure("AI_NOT_CONFIGURED", 503)
        }
        val prefix = provider.uppercase()
        // Document/profile tasks have independent defaults; explicit task overrides still win.
        val modelFallback = if (provider == "groq") value("GROQ_MODEL", defaultModel) else defaultModel
        return AiSelection(if (provider == "gemini") "Gemini" else "Groq",
            explicitModel ?: value("${prefix}_${suffix}_MODEL", modelFallback))
    }

    private fun plan(tasks: Array<out AiTask>, provider: String? = null, model: String? = null): AiPlan {
        val selected = tasks.associateWith { selection(it, provider, model) }
        val canonical = tasks.joinToString("\n") { "$it:${selected.getValue(it).provider}:${selected.getValue(it).model}" }
        val token = MessageDigest.getInstance("SHA-256").digest(canonical.toByteArray(Charsets.UTF_8))
            .joinToString("") { "%02x".format(it) }
        return AiPlan(AiApprovalPreview(token, selected.values.distinct()), selected)
    }
    private fun candidatePlans(tasks: Array<out AiTask>) = listOf(
        plan(tasks), plan(tasks, "Groq"), plan(tasks, "Gemini"),
        plan(tasks, "Gemini", "gemini-3.5-flash"),
        plan(tasks, "Gemini", "gemini-3.5-flash-lite"),
    ).distinctBy { it.approval.token }

    fun preview(vararg tasks: AiTask) = plan(tasks).approval
    private fun available(plan: AiPlan) = plan.tasks.values.all {
        environment.getProperty("${it.provider.uppercase()}_API_KEY")?.isNotBlank() == true
    }
    fun options(vararg tasks: AiTask): List<AiOption> =
        candidatePlans(tasks).map { AiOption(it.approval, available(it)) }

    fun resolveApproval(token: String?, vararg tasks: AiTask): AiPlan {
        val current = plan(tasks)
        // Legacy approvals apply only to the current Groq plan. Alternatives require an explicit fingerprint.
        if (token == current.approval.token || token == null && current.tasks.values.all { it.provider == "Groq" }) return current
        candidatePlans(tasks).firstOrNull { available(it) && token == it.approval.token }?.let { return it }
        throw AiFailure("AI_APPROVAL_CHANGED", 409)
    }
    fun requireApproval(token: String?, vararg tasks: AiTask) = resolveApproval(token, *tasks).approval
}
