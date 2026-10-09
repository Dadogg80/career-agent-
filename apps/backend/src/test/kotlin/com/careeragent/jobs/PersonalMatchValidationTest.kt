package com.careeragent.jobs

import com.careeragent.ai.application.AiFailure
import com.careeragent.ai.application.AiModel
import com.careeragent.jobs.application.*
import com.careeragent.jobs.domain.*
import com.careeragent.profile.application.ClaimRepository
import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import java.util.UUID

class PersonalMatchValidationTest {
 private val mapper = ObjectMapper()
 private val service = PersonalMatchService(mock(SavedJobRepository::class.java),mock(ClaimRepository::class.java),mock(PersonalMatchRepository::class.java),mock(AiModel::class.java),mapper,10)
 private val claim = MatchClaim(UUID.randomUUID(),2,"Kotlin","Built APIs using Kotlin","Fictional project")
 @Test fun `unsupported strong matches and unshared requirements become unknown without inventing gaps`() {
  val items = listOf(
   mapOf("requirementIndex" to 0,"classification" to "STRONG","reason" to "Invented expertise","question" to "","evidence" to listOf(mapOf("claimId" to claim.id,"quote" to "Built APIs using Kafka"))),
   mapOf("requirementIndex" to 1,"classification" to "STRONG","reason" to "Unshared requirement","question" to "","evidence" to listOf(mapOf("claimId" to claim.id,"quote" to claim.statement))))
  val result = service.parse(mapper.writeValueAsString(mapOf("assessments" to items)),2,setOf(0),listOf(claim),"nb")
  assertThat(result.first).hasSize(2)
  assertThat(result.first.map { it.classification }).containsOnly(MatchKind.CLARIFY)
  assertThat(result.first.flatMap { it.evidence }).isEmpty()
  assertThat(result.first[0].reason).contains("Det betyr ikke at kompetansen mangler")
  assertThat(result.second).isEqualTo(2)
 }
 @Test fun `valid evidence survives another malformed assessment but malformed roots are rejected`() {
  val good = mapOf("requirementIndex" to 0,"classification" to "PARTIAL","reason" to "Related API contribution","question" to "Have you operated it in production?","evidence" to listOf(mapOf("claimId" to claim.id,"quote" to "Built APIs using Kotlin")))
  val result = service.parse(mapper.writeValueAsString(mapOf("assessments" to listOf(good,mapOf("requirementIndex" to "bad")))),2,setOf(0,1),listOf(claim),"en")
  assertThat(result.first[0].classification).isEqualTo(MatchKind.PARTIAL)
  assertThat(result.first[0].evidence.single().claimId).isEqualTo(claim.id)
  assertThat(result.first[1].reason).contains("does not establish a skill gap")
  assertThat(result.second).isEqualTo(1)
  assertThatThrownBy { service.parse("{broken",1,setOf(0),listOf(claim),"en") }.isInstanceOf(AiFailure::class.java)
  assertThatThrownBy { service.parse("{\"assessments\":[],\"ownerId\":\"spoof\"}",1,setOf(0),listOf(claim),"en") }.isInstanceOf(AiFailure::class.java)
 }
 @Test fun `packing retains all 500 skill identities and distinct literal contexts`() {
  val selected=(0 until 500).map { MatchClaim(UUID.randomUUID(),2,"Skill $it",claim.statement,if(it<250)claim.context else "Other company") }
  val packed=mapper.readTree(service.compactInput("Fictional ad",emptyList(),selected))
  assertThat(packed["confirmedClaims"].size()).isEqualTo(500)
  assertThat(packed["candidatePassages"].size()).isEqualTo(2)
  assertThat(packed["confirmedClaims"].map { it["id"].asText() }).containsExactlyElementsOf(selected.map { it.id.toString() })
  assertThat(packed["confirmedClaims"][499]["passageIndex"].asInt()).isEqualTo(1)
  assertThat(packed["candidatePassages"][1]["context"].asText()).isEqualTo("Other company")
 }

 @Test fun `all 128 requirement indices survive and incomplete output is not a candidate gap`() {
  val assessments=(0 until 128).map { i -> mapOf("requirementIndex" to i,"classification" to "PARTIAL",
   "reason" to "Related contribution; exact scope needs review", "question" to "",
   "evidence" to listOf(mapOf("claimId" to claim.id,"quote" to claim.statement))) }
  val complete=service.parse(mapper.writeValueAsString(mapOf("assessments" to assessments)),128,(0 until 128).toSet(),listOf(claim),"en")
  assertThat(complete.first).hasSize(128)
  assertThat(complete.first).allMatch { it.evaluated }
  assertThat(complete.first.last().requirementIndex).isEqualTo(127)
  val partial=service.parse(mapper.writeValueAsString(mapOf("assessments" to assessments.take(13))),128,(0 until 128).toSet(),listOf(claim),"en")
  assertThat(partial.first.count { it.evaluated }).isEqualTo(13)
  assertThat(partial.first.last().reason).contains("no valid assessment")
  assertThat(partial.first.last().question).isEmpty()
  assertThat(partial.first.last().classification).isEqualTo(MatchKind.CLARIFY)
 }
 @Test fun `older persisted assessments remain readable without the new completion flag`() {
  val stored="""{"requirementIndex":0,"classification":"CLARIFY","reason":"Unknown experience","evidence":[],"question":"Any relevant experience?"}"""
  val value=com.fasterxml.jackson.module.kotlin.jacksonObjectMapper().readValue(stored,RequirementMatch::class.java)
  assertThat(value.evaluated).isTrue()
 }

}
