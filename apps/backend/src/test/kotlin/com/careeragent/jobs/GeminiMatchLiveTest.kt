package com.careeragent.jobs

import com.careeragent.ai.application.*
import com.careeragent.ai.infrastructure.GeminiAiModel
import com.careeragent.jobs.application.*
import com.careeragent.jobs.domain.*
import com.careeragent.profile.application.ClaimRepository
import com.careeragent.profile.application.VerifiedIdentity
import com.careeragent.profile.domain.*
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable
import org.mockito.Mockito.*
import org.springframework.mock.env.MockEnvironment
import java.time.OffsetDateTime
import java.util.UUID

/** One explicitly enabled provider call with fictional data; never sends uploaded documents. */
@EnabledIfEnvironmentVariable(named="GEMINI_MATCH_LIVE_TEST", matches="true")
class GeminiMatchLiveTest {
 @Test fun `Flash Lite assesses twenty criteria and a personally clarified contribution after position thirty`() {
  val identity=VerifiedIdentity("https://fictional.example", "synthetic-pilot")
  val now=OffsetDateTime.now(); val jobId=UUID.randomUUID(); val mapper=jacksonObjectMapper()
  val routing=AiRouting(MockEnvironment().withProperty("AI_PROVIDER","gemini").withProperty("GEMINI_MATCH_MODEL","gemini-3.5-flash-lite"))
  val jobs=mock(SavedJobRepository::class.java); val claims=mock(ClaimRepository::class.java); val results=object:PersonalMatchRepository { override fun load(identity:VerifiedIdentity,jobId:UUID):PersonalMatch?=null; override fun save(identity:VerifiedIdentity,jobId:UUID,result:PersonalMatch)=result }
  val evidence=(0 until 35).map { index -> CompetencyClaim(UUID.randomUUID(),if(index==34)"Kotlin" else "Fictional tool $index",
   if(index==34)"Built and operated backend APIs using Kotlin." else "Used fictional tools for a fictional project; no Kafka experience is stated.",
   "Example AS", "Fictional note",ClaimStatus.CONFIRMED,2,now,now) }
  val criteria=listOf("Kafka experience is preferred.") + (1..18).map { "Experience with unfamiliar platform $it is preferred." } + "Kotlin experience is required for this backend role."
  val text=criteria.joinToString("\n")
  val requirements=criteria.mapIndexed { index, quote -> ExtractedRequirement(if(index==19) "Kotlin" else if(index==0) "Kafka" else "Unfamiliar platform $index", if(index==19) RequirementKind.REQUIRED else RequirementKind.PREFERRED,quote) }
  val job=SavedJob(jobId,SavedJobContent("Fictional backend developer",null,"PASTED_TEXT",text,"en",requirements,emptyList(),0,null),now)
  val linked=evidence.dropLast(1)+evidence.last().copy(sourceNote="User clarification for job $jobId; requirement 19")
  `when`(jobs.get(identity,jobId)).thenReturn(job); `when`(claims.list(identity)).thenReturn(linked)
  val service=PersonalMatchService(jobs,claims,results,GeminiAiModel(mapper,System.getenv("GEMINI_API_KEY") ?: "",routing),mapper,1,routing)
  val result=service.analyze(identity,jobId,MatchRequest(text,evidence.map { MatchSelection(it.id,it.revision) },"en",true,routing.preview(AiTask.PERSONAL_MATCH).token))
  assertThat(result.assessments).hasSize(20); assertThat(result.assessments.all { it.evaluated }).isTrue()
  assertThat(result.claims).hasSize(35); assertThat(result.automaticEvidence).isTrue()
  assertThat(result.assessments[19].classification).isEqualTo(MatchKind.STRONG)
  assertThat(result.assessments[19].evidence.map { it.claimId }).contains(evidence.last().id)
  assertThat(result.assessments[0].classification).isEqualTo(MatchKind.CLARIFY)
  assertThat(result.provider).isEqualTo("Gemini"); assertThat(result.model).isEqualTo("gemini-3.5-flash-lite")
  println("Synthetic full-profile match: contributions=${result.claims.size} assessments=${result.assessments.size} model=${result.model}")
 }
}
