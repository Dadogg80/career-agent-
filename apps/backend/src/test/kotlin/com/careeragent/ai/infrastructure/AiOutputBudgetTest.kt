package com.careeragent.ai.infrastructure

import com.careeragent.ai.application.*
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*

class AiOutputBudgetTest {
    @Test fun `explicit review budgets reach all structured provider protocols without changing defaults`() {
        val mapper=jacksonObjectMapper();val routing=AiRouting()
        val groq=GroqAiModel(mapper,"","openai/gpt-oss-20b",AiCooldowns())
        val gemini=GeminiAiModel(mapper,"",routing)
        assertThat(groq.requestBody("rules","data",emptyMap(),AiTask.CV_TAILORING)["max_completion_tokens"]).isEqualTo(16384)
        assertThat(groq.requestBody("rules","data",emptyMap(),AiTask.CV_TAILORING,maxOutputTokens=2048)["max_completion_tokens"]).isEqualTo(2048)
        assertThat(mapper.valueToTree<com.fasterxml.jackson.databind.JsonNode>(gemini.requestBody("rules","data",emptyMap(),AiTask.CV_TAILORING)).at("/generationConfig/maxOutputTokens").asInt()).isEqualTo(16384)
        assertThat(mapper.valueToTree<com.fasterxml.jackson.databind.JsonNode>(gemini.requestBody("rules","data",emptyMap(),AiTask.CV_TAILORING,3072)).at("/generationConfig/maxOutputTokens").asInt()).isEqualTo(3072)
        assertThat(mapper.valueToTree<com.fasterxml.jackson.databind.JsonNode>(gemini.interactionsRequestBody("rules","data",emptyMap(),AiTask.CV_TAILORING,3072)).at("/generation_config/max_output_tokens").asInt()).isEqualTo(3072)
        for(invalid in listOf(0,-1,16385))assertThatThrownBy {boundedOutputTokens(16384,invalid)}.isInstanceOf(AiFailure::class.java)
    }
    @Test fun `approved request budgets preserve the chosen recipient through routing without retries or shared mutation`() {
        val routing=AiRouting();val groq=mock(GroqAiModel::class.java);val gemini=mock(GeminiAiModel::class.java)
        val routed=RoutedAiModel(routing,groq,gemini)
        for(selection in listOf(AiSelection("Groq","openai/gpt-oss-20b"),AiSelection("Gemini","gemini-3.5-flash-lite"))) {
            val adapter:AiModel=if(selection.provider=="Groq")groq else gemini
            `when`(adapter.generateJson("rules","data",emptyMap(),AiTask.CV_TAILORING,selection,2048)).thenReturn("{}")
            val plan=AiPlan(AiApprovalPreview("fixture",listOf(selection)),mapOf(AiTask.CV_TAILORING to selection))
            assertThat(ApprovedAiModel(routed,routing,plan,2048).generateJson("rules","data",emptyMap(),AiTask.CV_TAILORING)).isEqualTo("{}")
            verify(adapter,times(1)).generateJson("rules","data",emptyMap(),AiTask.CV_TAILORING,selection,2048)
        }
        verifyNoMoreInteractions(groq,gemini)
        assertThat(routing.selection(AiTask.CV_TAILORING)).isEqualTo(AiSelection("Groq","openai/gpt-oss-20b"))
    }
}
