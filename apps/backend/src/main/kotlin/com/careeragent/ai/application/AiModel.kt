package com.careeragent.ai.application

enum class AiTask { JOB_ANALYSIS, JOB_SOURCE_RETRIEVAL, DOCUMENT_EXTRACTION, PROFILE_SUMMARY, PERSONAL_MATCH, CV_TAILORING }

interface AiOutcomeRecorder {
    fun documentValidationOutcome(task: AiTask, outcome: String)
}

interface AiModel {
    fun generateJson(system: String, user: String, schema: Map<String, Any>): String
    fun generateJson(system: String, user: String, schema: Map<String, Any>, task: AiTask): String = generateJson(system,user,schema)
    fun generateJson(system: String, user: String, schema: Map<String, Any>, task: AiTask, selection: AiSelection): String = generateJson(system,user,schema,task)
    /** Explicit per-request output budget; adapters must not silently ignore it. */
    fun generateJson(system: String, user: String, schema: Map<String, Any>, task: AiTask, selection: AiSelection, maxOutputTokens: Int): String =
        throw AiFailure("AI_NOT_CONFIGURED",503)
}

fun boundedOutputTokens(defaultLimit: Int, requested: Int?): Int = (requested ?: defaultLimit).also {
    if (it !in 1..defaultLimit) throw AiFailure("AI_NOT_CONFIGURED",503)
}

/** Request-local routing: never mutate shared defaults or share a recipient across concurrent users. */
class ApprovedAiModel(private val delegate: AiModel, private val routing: AiRouting, private val plan: AiPlan,
    private val maxOutputTokens: Int? = null) : AiModel {
    override fun generateJson(system: String, user: String, schema: Map<String, Any>) = generateJson(system,user,schema,AiTask.JOB_ANALYSIS)
    override fun generateJson(system: String, user: String, schema: Map<String, Any>, task: AiTask): String {
        val selection = plan.tasks.getValue(task)
        if (maxOutputTokens != null) return delegate.generateJson(system,user,schema,task,selection,maxOutputTokens)
        return if(selection == routing.selection(task)) (if(task==AiTask.JOB_ANALYSIS)delegate.generateJson(system,user,schema) else delegate.generateJson(system,user,schema,task))
            else delegate.generateJson(system,user,schema,task,selection)
    }
}

class AiFailure(val code: String, val httpStatus: Int, val retryAfterSeconds: Int? = null, val reason: String? = null) : RuntimeException(code)
