package com.careeragent.cv

import com.careeragent.ai.application.*
import com.careeragent.cv.application.*
import com.careeragent.profile.application.VerifiedIdentity
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.springframework.mock.env.MockEnvironment

class CvScopeControlsTest {
    @Test fun `independent scope expectations stay outside provider input and context-only support cannot mask valid adverse findings`() {
        val controls=CvScopeControls.controls();val saved=CvScopeControls.session(controls)
        val mapper=jacksonObjectMapper();val ai=mock(AiModel::class.java)
        val sessions=mock(CvTailoringSessionRepository::class.java)
        val identity=VerifiedIdentity("https://identity.example.test","fictional-scope-user")
        val routing=AiRouting(MockEnvironment())
        `when`(sessions.latest(identity,saved.jobId)).thenReturn(saved)
        `when`(ai.generateJson(anyString(),anyString(),anyMap(),eq(AiTask.CV_TAILORING) ?: AiTask.CV_TAILORING,
            any(AiSelection::class.java) ?: AiSelection("Groq","openai/gpt-oss-20b"),anyInt())).thenAnswer {call ->
            val input=mapper.readTree(call.getArgument<String>(1))
            assertThat(input.fieldNames().asSequence().toSet()).containsExactlyInAnyOrder("contract","drafts")
            assertThat(input.path("drafts")).hasSize(controls.size)
            val items=input.path("drafts").mapIndexed {i,draft ->
                assertThat(draft.fieldNames().asSequence().toSet()).containsExactlyInAnyOrder("paragraphIndex","draft","entryContext","confirmedEvidence")
                val proof=draft.path("confirmedEvidence")
                controls[i].claims.forEach {claim ->
                    val parts=proof.filter {it.path("claimId").asText()==claim.id.toString()}
                    assertThat(parts.filter {it.path("field").asText()=="statement"}.joinToString(""){it.path("text").asText()})
                        .isEqualTo(claim.statement)
                    assertThat(parts.filter {it.path("field").asText()=="context"}.joinToString(""){it.path("text").asText()})
                        .isEqualTo(claim.context)
                }
                val positive=controls[i].supported
                mapOf("paragraphIndex" to i,"finding" to if(positive)"SUPPORTED" else "SCOPE_EXPANSION",
                    "phrase" to if(positive)"" else controls[i].draft,
                    "evidenceIds" to listOf(proof.first {it.path("field").asText()==if(positive)"context" else "statement"}.path("evidenceId").asInt()))
            }
            mapper.writeValueAsString(mapOf("items" to items))
        }
        val result=CvWordingSourceReview(sessions,routing,ai,mapper,1).review(identity,saved.jobId,
            WordingSourceRequest(saved.id,saved.revision,controls.indices.toList(),"nb",true,routing.preview(AiTask.CV_TAILORING).token))
        assertThat(result.items).hasSize(21)
        result.items.forEachIndexed {i,item ->
            assertThat(item.status).describedAs(controls[i].id)
                .isEqualTo(if(controls[i].supported)WordingSourceStatus.UNASSESSED else WordingSourceStatus.NEEDS_REVIEW)
        }
        verify(ai,times(1)).generateJson(anyString(),anyString(),anyMap(),eq(AiTask.CV_TAILORING) ?: AiTask.CV_TAILORING,
            any(AiSelection::class.java) ?: AiSelection("Groq","openai/gpt-oss-20b"),anyInt())
        assertThat(mockingDetails(sessions).invocations.map {it.method.name}).containsOnly("latest")
    }
}
