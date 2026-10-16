package com.careeragent.cv

import com.careeragent.ai.application.*
import com.careeragent.cv.application.*
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.mock.env.MockEnvironment

/** A transport/provenance control with mocked judgments, not a semantic classification benchmark. */
class MatchWordingQualityTest {
    @Test fun `distinct same-claim quotes survive matching while initial wording receives all claims and distinct associations`() {
        val mapper=jacksonObjectMapper().findAndRegisterModules()
        val routing=AiRouting(MockEnvironment())
        for(case in MatchWordingQualityFixtures.cases()) {
            val calls=mutableListOf<AiTask>()
            val first=case.claims.first()
            val ai=object:AiModel {
                override fun generateJson(system:String,user:String,schema:Map<String,Any>)=error("Explicit task required")
                override fun generateJson(system:String,user:String,schema:Map<String,Any>,task:AiTask):String {
                    calls.add(task)
                    val input=mapper.readTree(user)
                    if(task==AiTask.PERSONAL_MATCH) {
                        assertThat(input.path("confirmedClaims").map {it.path("id").asText()}).containsExactlyElementsOf(case.claims.map {it.id.toString()})
                        return mapper.writeValueAsString(mapOf("assessments" to case.criteria.mapIndexed {i,c ->
                            mapOf("requirementIndex" to i,"classification" to c.expected.first().name,"reason" to "Fiktiv, kontrollert vurdering av kildens omfang.",
                                "question" to "","evidenceRelation" to "DIRECT","requirementNature" to "PRACTICAL",
                                "evidence" to listOf(mapOf("claimId" to first.id,"quote" to first.context),mapOf("claimId" to first.id,"quote" to first.statement)))
                        }))
                    }
                    assertThat(task).isEqualTo(AiTask.CV_TAILORING)
                    assertThat(input.path("confirmedEvidence").map {it.path("id").asText()}).containsExactlyElementsOf(case.claims.map {it.id.toString()})
                    case.claims.forEach {claim ->
                        val source=input.path("confirmedEvidence").single {it.path("id").asText()==claim.id.toString()}
                        assertThat(source.path("statement").asText()).isEqualTo(claim.statement)
                        assertThat(source.path("context").asText()).isEqualTo(claim.context)
                    }
                    input.path("criterionEvidence").forEach {criterion ->
                        assertThat(criterion.path("claimIds").map {it.asText()}).containsExactly(first.id.toString())
                        assertThat(criterion.has("classification")).isFalse()
                        assertThat(criterion.has("reason")).isFalse()
                    }
                    val index=input.path("baseParagraphs").first {it.path("editable").asBoolean() && it.path("text").asText().contains("erfaring",ignoreCase=true)}.path("index").asInt()
                    return mapper.writeValueAsString(mapOf("proposals" to listOf(mapOf("paragraphIndex" to index,"newText" to first.statement,
                        "reason" to "Fremhev det dokumenterte bidraget.","claimIds" to listOf(first.id),"requirementIndexes" to listOf(0),
                        "sourceEvidence" to listOf(mapOf("claimId" to first.id,"quote" to first.statement))))))
                }
            }
            val result=MatchWordingQualityJourney.run(case,routing,ai,mapper)
            assertThat(calls).containsExactly(AiTask.PERSONAL_MATCH,AiTask.CV_TAILORING)
            assertThat(result.match.claims).containsExactlyElementsOf(case.claims)
            assertThat(result.match.assessments).allSatisfy {assessment ->
                assertThat(assessment.evidence.map {it.quote}).containsExactly(first.context,first.statement)
            }
            assertThat(result.wording.matchId).isEqualTo(result.match.id)
            assertThat(result.wording.proposals.single().newText).isEqualTo(first.statement)
            assertThat(result.wording.omittedItems).isZero()
        }
    }
}
