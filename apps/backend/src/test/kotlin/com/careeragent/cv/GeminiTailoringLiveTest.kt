package com.careeragent.cv

import com.careeragent.ai.application.*
import com.careeragent.ai.infrastructure.GeminiAiModel
import com.careeragent.cv.application.*
import com.careeragent.documents.application.DocumentRepository
import com.careeragent.documents.domain.*
import com.careeragent.jobs.application.*
import com.careeragent.jobs.domain.*
import com.careeragent.profile.application.VerifiedIdentity
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable
import org.mockito.Mockito.*
import org.springframework.mock.env.MockEnvironment
import java.time.OffsetDateTime
import java.util.UUID

/** One explicitly enabled fictional provider request; uploaded documents are never used. */
@EnabledIfEnvironmentVariable(named="GEMINI_TAILORING_LIVE_TEST",matches="true")
class GeminiTailoringLiveTest {
 @Test fun `Flash Lite proposes supported role-specific wording with exact source references`() {
  val mapper=jacksonObjectMapper();val now=OffsetDateTime.now();val identity=VerifiedIdentity("https://fictional.example","synthetic-candidate")
  val jobId=UUID.randomUUID();val documentId=UUID.randomUUID();val matchId=UUID.randomUUID();val claimId=UUID.randomUUID()
  val text="Fictional software engineer\n\nI work on software.\n\nExample AS: Built and operated backend APIs using Kotlin and improved automated testing."
  val claim=MatchClaim(claimId,2,"Kotlin","Built and operated backend APIs using Kotlin and improved automated testing.","Example AS")
  val ad="We seek a developer experienced in Kotlin APIs and automated testing."
  val job=SavedJob(jobId,SavedJobContent("Fictional Kotlin developer",null,"PASTED_TEXT",ad,"en",listOf(ExtractedRequirement("Kotlin APIs",RequirementKind.REQUIRED,"experienced in Kotlin APIs and automated testing")),emptyList(),0,null),now)
  val jobs=mock(SavedJobRepository::class.java);val documents=mock(DocumentRepository::class.java);val matching=mock(PersonalMatchService::class.java)
  val match=PersonalMatch(matchId,"en",now,listOf(RequirementMatch(0,MatchKind.STRONG,"Documented API work",listOf(MatchEvidence(claimId,claim.statement)),"")),listOf(claim),0,300,provider="Gemini",model="gemini-3.5-flash-lite",automaticEvidence=true)
  `when`(jobs.get(identity,jobId)).thenReturn(job)
  `when`(documents.detail(identity,documentId)).thenReturn(DocumentDetail(CareerDocument(documentId,"fictional.txt","text/plain",text.length.toLong(),"a".repeat(64),"en",false,now),text))
  `when`(matching.load(identity,jobId)).thenReturn(match)
  `when`(matching.compactInput(anyString(),anyList(),anyList())).thenReturn(mapper.writeValueAsString(mapOf("advertisement" to ad,"requirements" to listOf(mapOf("index" to 0,"label" to "Kotlin APIs","quote" to ad)),"confirmedClaims" to listOf(mapOf("id" to claimId,"revision" to 2,"skill" to "Kotlin","passageIndex" to 0)),"candidatePassages" to listOf(mapOf("statement" to claim.statement,"context" to claim.context)))))
  val routing=AiRouting(MockEnvironment().withProperty("AI_PROVIDER","gemini"))
  val service=CvTailoringService(jobs,documents,matching,routing,GeminiAiModel(mapper,System.getenv("GEMINI_API_KEY") ?: "",routing),mapper,1)
  val result=service.propose(identity,jobId,TailoringRequest(documentId,text,matchId,"en",true,routing.preview(AiTask.CV_TAILORING).token))
  assertThat(result.provider).isEqualTo("Gemini");assertThat(result.model).isEqualTo("gemini-3.5-flash-lite")
  assertThat(result.proposals).isNotEmpty();assertThat(result.proposals.all {it.claimIds==listOf(claimId) && it.requirementIndexes==listOf(0)}).isTrue()
  assertThat(result.proposals.any {it.newText.contains("Kotlin")}).isTrue()
  assertThat(result.proposals.joinToString(" ") {it.newText}).doesNotContain("Kafka","React Native","bachelor","certified")
  println("Fictional CV proposals: count=${result.proposals.size} omitted=${result.omittedItems} model=${result.model}")
 }
}
