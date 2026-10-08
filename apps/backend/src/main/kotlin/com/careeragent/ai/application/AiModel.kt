package com.careeragent.ai.application

enum class AiTask { JOB_ANALYSIS, DOCUMENT_EXTRACTION, PROFILE_SUMMARY, PERSONAL_MATCH }

interface AiModel {
    fun generateJson(system: String, user: String, schema: Map<String, Any>): String
    fun generateJson(system: String, user: String, schema: Map<String, Any>, task: AiTask): String = generateJson(system,user,schema)
    fun generateJson(system: String, user: String, schema: Map<String, Any>, task: AiTask, selection: AiSelection): String = generateJson(system,user,schema,task)
}

/** Request-local routing: never mutate shared defaults or share a recipient across concurrent users. */
class ApprovedAiModel(private val delegate: AiModel, private val routing: AiRouting, private val plan: AiPlan) : AiModel {
    override fun generateJson(system: String, user: String, schema: Map<String, Any>) = generateJson(system,user,schema,AiTask.JOB_ANALYSIS)
    override fun generateJson(system: String, user: String, schema: Map<String, Any>, task: AiTask): String {
        val selection = plan.tasks.getValue(task)
        return if(selection == routing.selection(task)) (if(task==AiTask.JOB_ANALYSIS)delegate.generateJson(system,user,schema) else delegate.generateJson(system,user,schema,task))
            else delegate.generateJson(system,user,schema,task,selection)
    }
}

class AiFailure(val code: String, val httpStatus: Int, val retryAfterSeconds: Int? = null, val reason: String? = null) : RuntimeException(code)
