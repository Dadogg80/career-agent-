package com.careeragent.ai.infrastructure

import com.careeragent.ai.application.*
import org.springframework.context.annotation.Primary
import org.springframework.stereotype.Component

@Component
@Primary
class RoutedAiModel(
        private val routing: AiRouting,
        private val groq: GroqAiModel,
        private val gemini: GeminiAiModel,
        private val diagnostics: AiCallDiagnostics = AiCallDiagnostics(false),
        private val openai: OpenAiModel? = null,
) : AiModel {
        override fun generateJson(system: String, user: String, schema: Map<String, Any>) =
            generateJson(system, user, schema, AiTask.JOB_ANALYSIS)

        override fun generateJson(system: String, user: String, schema: Map<String, Any>, task: AiTask): String {
            val selection = routing.selection(task)
            return generate(system, user, schema, task, selection, false)
        }

        override fun generateJson(system: String, user: String, schema: Map<String, Any>, task: AiTask, selection: AiSelection): String =
            generate(system, user, schema, task, selection, true)
        override fun generateJson(system: String, user: String, schema: Map<String, Any>, task: AiTask, selection: AiSelection, maxOutputTokens: Int): String =
            generate(system,user,schema,task,selection,true,maxOutputTokens)

        private fun generate(system: String, user: String, schema: Map<String, Any>, task: AiTask, selection: AiSelection, explicitSelection: Boolean, maxOutputTokens:Int? = null): String {
            val endpoint = when (selection.provider) {
                "Gemini" -> if (selection.model == "gemini-3.8-flash") "generativelanguage.googleapis.com/v1beta/interactions"
                    else "generativelanguage.googleapis.com/v1beta/models/${selection.model}:generateContent"
                "Groq" -> "api.groq.com/openai/v1/chat/completions"
                "OpenAI" -> "api.openai.com/v1/responses"
                else -> throw AiFailure("AI_NOT_CONFIGURED", 503)
            }
            return diagnostics.trace(task, selection.provider, selection.model, endpoint, system, user, schema.toString()) { trace ->
                val response = when (selection.provider) {
                    "Gemini" -> if(maxOutputTokens!=null)gemini.generateJson(system,user,schema,task,selection,maxOutputTokens) else if (explicitSelection) gemini.generateJson(system, user, schema, task, selection) else gemini.generateJson(system, user, schema, task)
                    "Groq" -> if(maxOutputTokens!=null)groq.generateJson(system,user,schema,task,selection,maxOutputTokens) else if (explicitSelection) groq.generateJson(system, user, schema, task, selection) else groq.generateJson(system, user, schema, task)
                    "OpenAI" -> {
                        val adapter = openai ?: throw AiFailure("AI_NOT_CONFIGURED", 503)
                        if (maxOutputTokens != null) adapter.generateJson(system,user,schema,task,selection,maxOutputTokens)
                        else adapter.generateJson(system,user,schema,task,selection)
                    }
                    else -> throw AiFailure("AI_NOT_CONFIGURED", 503)
                }
                trace.response(response)
                response
            }
        }
}
