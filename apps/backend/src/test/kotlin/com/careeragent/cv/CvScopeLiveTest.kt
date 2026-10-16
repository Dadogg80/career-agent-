package com.careeragent.cv

import com.careeragent.ai.application.*
import com.careeragent.ai.infrastructure.OpenAiModel
import com.careeragent.ai.infrastructure.AiCooldowns
import com.careeragent.cv.application.*
import com.careeragent.profile.application.VerifiedIdentity
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable
import org.mockito.Mockito.*
import org.springframework.mock.env.MockEnvironment
import java.nio.file.Files

/** One explicitly enabled request with fictional sources only. Never run by ordinary CI. */
@EnabledIfEnvironmentVariable(named="CV_SCOPE_LIVE_TEST",matches="true")
class CvScopeLiveTest {
    @Test fun `source opinions distinguish supported wording from independently specified scope expansions`() {
        val model=System.getenv("CV_SCOPE_MODEL") ?: error("Set CV_SCOPE_MODEL explicitly")
        require(model in AiModelCapabilities.openAiStructuredModels)
        val effort=System.getenv("CV_SCOPE_REASONING") ?: "medium"
        require(effort in setOf("medium","high"))
        val env=MockEnvironment().withProperty("AI_PROVIDER","openai").withProperty("OPENAI_MODEL",model)
            .withProperty("OPENAI_REASONING_EFFORT",effort).withProperty("OPENAI_REQUEST_TIMEOUT_SECONDS","300")
        val key=System.getenv("CAREER_OPENAI_API_KEY")?.takeIf {it.isNotBlank()} ?: System.getenv("OPENAI_API_KEY")
        require(!key.isNullOrBlank()) { "An explicitly configured API key is required" }
        env.setProperty("OPENAI_API_KEY",key)
        val routing=AiRouting(env);val mapper=jacksonObjectMapper()
        val controls=CvScopeControls.controls();val saved=CvScopeControls.session(controls)
        val sessions=mock(CvTailoringSessionRepository::class.java)
        val identity=VerifiedIdentity("https://identity.example.test","fictional-scope-control")
        `when`(sessions.latest(identity,saved.jobId)).thenReturn(saved)
        val reportDirectory=Files.createTempDirectory("career-cv-scope-$model-")
        val delegate=OpenAiModel(mapper,routing,AiCooldowns(),env)
        var calls=0
        var rawOutput=""
        val capture=object: AiModel {
            override fun generateJson(system: String,user: String,schema: Map<String,Any>): String = error("Explicit selected-model route required")
            override fun generateJson(system: String,user: String,schema: Map<String,Any>,task: AiTask,
                selection: AiSelection,maxOutputTokens: Int): String {
                check(++calls==1)
                mapper.writerWithDefaultPrettyPrinter().writeValue(reportDirectory.resolve("request.json").toFile(),
                    mapOf("prompt" to system,"input" to mapper.readTree(user),"schema" to schema,"model" to selection.model,
                        "reasoning" to effort,"maxOutputTokens" to maxOutputTokens))
                return delegate.generateJson(system,user,schema,task,selection,maxOutputTokens).also {
                    rawOutput=it
                    Files.writeString(reportDirectory.resolve("output.json"),it)
                }
            }
        }
        val started=System.nanoTime()
        val result=try {
            CvWordingSourceReview(sessions,routing,capture,mapper,1).review(identity,saved.jobId,
                WordingSourceRequest(saved.id,saved.revision,controls.indices.toList(),"nb",true,routing.preview(AiTask.CV_TAILORING).token))
        } catch (failure: AiFailure) {
            mapper.writeValue(reportDirectory.resolve("failure.json").toFile(),mapOf("model" to model,"code" to failure.code,"reason" to failure.reason))
            println("Fictional scope evaluation failed: code=${failure.code} report=$reportDirectory")
            throw failure
        }
        val rawItems=mapper.readTree(rawOutput).path("items").toList()
        val rows=result.items.mapIndexed { i,item ->
            val c=controls[i]
            val raw=rawItems.filter {it.path("paragraphIndex").isInt && it.path("paragraphIndex").asInt()==i}
            val finding=raw.singleOrNull()?.path("finding")?.asText()
            val rawAgrees=if(c.supported)finding=="SUPPORTED" else finding in setOf("SCOPE_EXPANSION","CONTEXT_UNCLEAR","SOURCE_UNCERTAIN","NO_SUPPORT","CONFLICT")
            val agrees=if(c.supported)item.status==WordingSourceStatus.SUPPORTED
                else item.status in setOf(WordingSourceStatus.NEEDS_REVIEW,WordingSourceStatus.UNSUPPORTED)
            mapOf("id" to c.id,"draft" to c.draft,"expectedSupported" to c.supported,"rubric" to c.rubric,
                "rawFinding" to finding,"rawAgrees" to rawAgrees,"status" to item.status,"reason" to item.reason,
                "evidence" to item.evidence,"agrees" to agrees)
        }
        mapper.writerWithDefaultPrettyPrinter().writeValue(reportDirectory.resolve("report.json").toFile(),
            mapOf("model" to model,"reasoning" to effort,"seconds" to (System.nanoTime()-started)/1e9,"calls" to calls,"controls" to rows))
        println("Fictional scope evaluation: model=$model agreed=${rows.count {it["agrees"]==true}}/${rows.size} report=$reportDirectory")
        assertThat(calls).isEqualTo(1)
        assertThat(rows.filter {it["agrees"]!=true}.map {it["id"]})
            .describedAs("Controlled scope disagreements; inspect $reportDirectory before claiming semantic support").isEmpty()
    }
}
