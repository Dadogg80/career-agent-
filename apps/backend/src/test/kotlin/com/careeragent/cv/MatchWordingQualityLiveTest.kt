package com.careeragent.cv

import com.careeragent.ai.application.*
import com.careeragent.ai.infrastructure.*
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable
import org.springframework.mock.env.MockEnvironment
import java.nio.file.Files
import java.nio.file.Path

/** Up to six explicitly enabled requests with fictional evidence. Prose still needs independent human review. */
@EnabledIfEnvironmentVariable(named="MATCH_WORDING_LIVE_TEST",matches="true")
class MatchWordingQualityLiveTest {
    @Test fun `three held-out professions retain scope through real matching and initial wording services`() {
        val model=System.getenv("MATCH_WORDING_MODEL") ?: error("Set MATCH_WORDING_MODEL explicitly")
        require(model in AiModelCapabilities.openAiStructuredModels)
        val effort=System.getenv("MATCH_WORDING_REASONING") ?: "medium"
        require(effort in setOf("medium","high"))
        val env=MockEnvironment().withProperty("AI_PROVIDER","openai").withProperty("OPENAI_MODEL",model)
            .withProperty("OPENAI_REASONING_EFFORT",effort).withProperty("OPENAI_REQUEST_TIMEOUT_SECONDS","300")
        val key=System.getenv("CAREER_OPENAI_API_KEY")?.takeIf {it.isNotBlank()} ?: System.getenv("OPENAI_API_KEY")
        require(!key.isNullOrBlank()) {"An explicitly configured API key is required"}
        env.setProperty("OPENAI_API_KEY",key)
        val mapper=jacksonObjectMapper().findAndRegisterModules();val routing=AiRouting(env)
        val delegate=OpenAiModel(mapper,routing,AiCooldowns(),env)
        val directory=Files.createTempDirectory("career-match-wording-$model-")
        val replay=System.getenv("MATCH_WORDING_REPLAY_MATCHES")?.let {Path.of(it)}
        val disagreements=mutableListOf<String>();var totalCalls=0;var providerCalls=0
        for(case in MatchWordingQualityFixtures.cases()) {
            val tasks=mutableListOf<AiTask>()
            val previousCalls=providerCalls
            val capture=object:AiModel {
                override fun generateJson(system:String,user:String,schema:Map<String,Any>) = error("Explicit task required")
                override fun generateJson(system:String,user:String,schema:Map<String,Any>,task:AiTask):String {
                    check(++totalCalls<=6)
                    tasks.add(task)
                    val prefix="${case.id}-${task.name}"
                    val input=mapper.readTree(user)
                    mapper.writerWithDefaultPrettyPrinter().writeValue(directory.resolve("$prefix-request.json").toFile(),
                        mapOf("prompt" to system,"input" to input,"schema" to schema,"model" to model,"reasoning" to effort))
                    val evidence=if(task==AiTask.PERSONAL_MATCH)input.path("candidatePassages") else input.path("confirmedEvidence")
                    check(case.claims.all {claim -> evidence.any {it.path("statement").asText()==claim.statement && it.path("context").asText()==claim.context}})
                    check((if(task==AiTask.PERSONAL_MATCH)input.path("confirmedClaims") else evidence).map {it.path("id").asText()}.toSet()==case.claims.map {it.id.toString()}.toSet())
                    val output=if(task==AiTask.PERSONAL_MATCH && replay!=null) {
                        val original=mapper.readTree(replay.resolve("$prefix-request.json").toFile())
                        check(original.path("model").asText()==model && original.path("reasoning").asText()==effort &&
                            original.path("prompt").asText()==system && original.path("input")==input &&
                            original.path("schema")==mapper.valueToTree<com.fasterxml.jackson.databind.JsonNode>(schema))
                        Files.readString(replay.resolve("$prefix-output.json"))
                    } else {
                        providerCalls++
                        delegate.generateJson(system,user,schema,task)
                    }
                    Files.writeString(directory.resolve("$prefix-output.json"),output)
                    return output
                }
            }
            val start=System.nanoTime()
            try {
                val result=MatchWordingQualityJourney.run(case,routing,capture,mapper)
                val skillsHeading=result.wording.sourceUnits!!.single {case.cv.substring(it.start,it.end)=="FERDIGHETER"}
                check(!skillsHeading.editable && skillsHeading.kind==com.careeragent.cv.application.CvSourceUnitKind.SECTION_HEADING)
                check(result.wording.proposals.none {it.paragraphIndex==skillsHeading.paragraphIndex})
                val checks=case.criteria.mapIndexed {i,criterion ->
                    val actual=result.match.assessments[i]
                    val agrees=actual.evaluated && actual.classification in criterion.expected
                    if(!agrees)disagreements.add("${case.id}: criterion $i")
                    mapOf("index" to i,"criterion" to criterion.text,"expected" to criterion.expected,"rubric" to criterion.rubric,
                        "actual" to actual,"agrees" to agrees)
                }
                mapper.writerWithDefaultPrettyPrinter().writeValue(directory.resolve("${case.id}-report.json").toFile(),
                    mapOf("model" to model,"seconds" to (System.nanoTime()-start)/1e9,"criteria" to checks,
                        "providerCalls" to providerCalls-previousCalls,"matchReplayed" to (replay!=null),
                        "wordingRubric" to case.wordingRubric,"result" to result,
                        "semanticWordingReview" to "REQUIRES_INDEPENDENT_HUMAN_REVIEW"))
                check(tasks==listOf(AiTask.PERSONAL_MATCH,AiTask.CV_TAILORING))
                println("Fictional journey: model=$model case=${case.id} match=${checks.count {it["agrees"]==true}}/${checks.size} proposals=${result.wording.proposals.size} omitted=${result.wording.omittedItems} report=$directory")
            } catch(failure:AiFailure) {
                mapper.writeValue(directory.resolve("${case.id}-failure.json").toFile(),mapOf("code" to failure.code,"reason" to failure.reason))
                println("Fictional journey failed: case=${case.id} code=${failure.code} report=$directory")
                throw failure
            }
        }
        assertThat(totalCalls).isEqualTo(6)
        assertThat(providerCalls).isEqualTo(if(replay==null)6 else 3)
        assertThat(disagreements).describedAs("Inspect matching disagreements and independently review wording in $directory").isEmpty()
    }
}
