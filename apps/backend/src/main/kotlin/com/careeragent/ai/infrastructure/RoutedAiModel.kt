package com.careeragent.ai.infrastructure

import com.careeragent.ai.application.*
import org.springframework.context.annotation.Primary
import org.springframework.stereotype.Component

@Component
@Primary
class RoutedAiModel(private val routing: AiRouting, private val groq: GroqAiModel, private val gemini: GeminiAiModel) : AiModel {
    override fun generateJson(system: String, user: String, schema: Map<String, Any>) = generateJson(system, user, schema, AiTask.JOB_ANALYSIS)
    override fun generateJson(system: String, user: String, schema: Map<String, Any>, task: AiTask): String =
        when (routing.selection(task).provider) {
            "Gemini" -> gemini.generateJson(system, user, schema, task)
            else -> groq.generateJson(system, user, schema, task)
        }
}
