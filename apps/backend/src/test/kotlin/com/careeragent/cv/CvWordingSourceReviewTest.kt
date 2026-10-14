package com.careeragent.cv

import com.careeragent.ai.application.*
import com.careeragent.cv.application.*
import com.careeragent.jobs.domain.MatchClaim
import com.careeragent.profile.application.VerifiedIdentity
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import java.time.OffsetDateTime
import java.util.UUID

class CvWordingSourceReviewTest {
    private val mapper=jacksonObjectMapper()
    private val sessions=mock(CvTailoringSessionRepository::class.java)
    private val ai=mock(AiModel::class.java)
    private val routing=AiRouting()
    private val service=CvWordingSourceReview(sessions,routing,ai,mapper,1)
    private val identity=VerifiedIdentity("https://identity.example.test","fictional-user")
    private val jobId=UUID.randomUUID(); private val sessionId=UUID.randomUUID(); private val claimId=UUID.randomUUID()
    private val source="WORK EXPERIENCE\n2021 – 2023 Example AS – Developer\n\nWorked on API integrations."
    private val proposal=CvTextProposal(2,"Worked on API integrations.","Built API integrations.","GENERATION_REASON_IS_NOT_PROOF",listOf(claimId),listOf(0))
    private val claim=MatchClaim(claimId,2,"API integrations","Built API integrations for Example AS.","Example AS")
    private val session=CvTailoringSession(sessionId,jobId,3,TailoringSnapshot(
        CvTailoringResult(UUID.randomUUID(),UUID.randomUUID(),"Groq","fixture-model",listOf(proposal),0,sourceUnits=CvSourceUnits.create(source)),
        source,listOf(claim,MatchClaim(UUID.randomUUID(),2,"Payroll","Managed payroll.","OTHER_EMPLOYER_NOT_REFERENCED")),listOf("Autonomous agent delivery"),"nb"),
        listOf(WordingReview(2,"Developed API integrations.",WordingDecision.PENDING)),OffsetDateTime.now())
    private val request=WordingSourceRequest(sessionId,3,listOf(2),"nb",true,routing.preview(AiTask.CV_TAILORING).token)
    private fun output(status:String="SUPPORTED",quote:String=claim.statement,id:UUID=claimId)=mapper.writeValueAsString(mapOf("items" to listOf(
        mapOf("paragraphIndex" to 2,"status" to status,"reason" to "API-integrasjoner er dokumentert; selvstendige agenter er ikke etablert.","evidence" to listOf(mapOf("claimId" to id,"quote" to quote))))))

    @Test fun `review uses owned saved edited wording and referenced evidence without generation judgments or writes`() {
        `when`(sessions.latest(identity,jobId)).thenReturn(session)
        `when`(ai.generateJson(anyString(),anyString(),anyMap(),eq(AiTask.CV_TAILORING) ?: AiTask.CV_TAILORING,any(AiSelection::class.java) ?: AiSelection("Groq","openai/gpt-oss-20b"),anyInt())).thenAnswer { call ->
            val prompt=call.getArgument<String>(0);val input=call.getArgument<String>(1)
            assertThat(prompt).contains("Norwegian Bokmål","Review EVERY factual assertion","jobCriteria are employer requirements","never final CV approval")
            assertThat(input).doesNotContain("GENERATION_REASON_IS_NOT_PROOF","OTHER_EMPLOYER_NOT_REFERENCED","classification")
            val draft=mapper.readTree(input).path("drafts")[0]
            assertThat(draft.path("draft").asText()).isEqualTo("Developed API integrations.")
            assertThat(draft.path("entryContext").asText()).contains("Example AS", "2021")
            assertThat(draft.path("confirmedEvidence").size()).isEqualTo(1)
            assertThat(call.getArgument<Int>(5)).isEqualTo(2048)
            output("NEEDS_REVIEW")
        }
        val result=service.review(identity,jobId,request)
        assertThat(result.items.single().status).isEqualTo(WordingSourceStatus.NEEDS_REVIEW)
        assertThat(result.items.single().text).isEqualTo(session.reviews.single().text)
        assertThat(result.sessionId).isEqualTo(sessionId);assertThat(result.revision).isEqualTo(3)
        assertThat(mockingDetails(sessions).invocations.map {it.method.name}).containsOnly("latest")
        verify(ai,times(1)).generateJson(anyString(),anyString(),anyMap(),eq(AiTask.CV_TAILORING) ?: AiTask.CV_TAILORING,any(AiSelection::class.java) ?: AiSelection("Groq","openai/gpt-oss-20b"),anyInt())
        assertThatThrownBy {service.review(identity,jobId,request)}.hasMessage("AI_BUDGET_REACHED")
        verifyNoMoreInteractions(ai)
        assertThat(service.outputBudget(6)).isEqualTo(3328);assertThat(service.outputBudget(8)).isEqualTo(4096);assertThat(service.outputBudget(40)).isEqualTo(16384)
    }
    @Test fun `literal evidence validation rejects invented foreign missing and duplicate support without discarding valid items`() {
        val texts=mapOf(2 to proposal.newText)
        for(invalid in listOf(output(quote="Led autonomous agents."),output(id=UUID.randomUUID()),"""{"items":[]}""",
            output().replace("\"SUPPORTED\"","\"INVALID\""),"""{"items":[${mapper.readTree(output())["items"][0]},${mapper.readTree(output())["items"][0]}]}""")) {
            val item=service.parse(invalid,session,listOf(proposal),texts,"nb").single()
            assertThat(item.status).isEqualTo(WordingSourceStatus.UNASSESSED);assertThat(item.evidence).isEmpty()
        }
        val second=proposal.copy(paragraphIndex=3)
        val root=mapper.readTree(output())
        (root["items"] as com.fasterxml.jackson.databind.node.ArrayNode).addObject().put("paragraphIndex",3).put("status","SUPPORTED")
        val mixed=service.parse(root.toString(),session,listOf(proposal,second),mapOf(2 to proposal.newText,3 to second.newText),"en")
        assertThat(mixed.map {it.status}).containsExactly(WordingSourceStatus.SUPPORTED,WordingSourceStatus.UNASSESSED)
        assertThat(mixed[1].reason).contains("No valid source assessment")
    }
    @Test fun `consent ownership revision stale and selection checks precede provider calls`() {
        assertThatThrownBy {service.review(identity,jobId,request.copy(consent=false))}.hasMessage("CV_APPROVAL_REQUIRED")
        assertThatThrownBy {service.review(identity,jobId,request.copy(paragraphIndexes=listOf(2,2)))}.hasMessage("CV_INVALID")
        `when`(sessions.latest(identity,jobId)).thenReturn(null)
        assertThatThrownBy {service.review(identity,jobId,request)}.hasMessage("CV_NOT_FOUND")
        `when`(sessions.latest(identity,jobId)).thenReturn(session.copy(revision=4))
        assertThatThrownBy {service.review(identity,jobId,request)}.hasMessage("CV_CONFLICT")
        `when`(sessions.latest(identity,jobId)).thenReturn(session.copy(stale=true))
        assertThatThrownBy {service.review(identity,jobId,request)}.hasMessage("CV_SOURCE_CONFLICT")
        `when`(sessions.latest(identity,jobId)).thenReturn(session)
        assertThatThrownBy {service.review(identity,jobId,request.copy(paragraphIndexes=listOf(499)))}.hasMessage("CV_INVALID")
        `when`(sessions.latest(identity,jobId)).thenReturn(session.copy(reviews=listOf(session.reviews[0].copy(decision=WordingDecision.REJECTED))))
        assertThatThrownBy {service.review(identity,jobId,request)}.hasMessage("CV_INVALID")
        verifyNoInteractions(ai)
    }
    @Test fun `changed revision during review rejects the response and provider failures are never retried`() {
        `when`(sessions.latest(identity,jobId)).thenReturn(session,session.copy(revision=4))
        `when`(ai.generateJson(anyString(),anyString(),anyMap(),eq(AiTask.CV_TAILORING) ?: AiTask.CV_TAILORING,any(AiSelection::class.java) ?: AiSelection("Groq","openai/gpt-oss-20b"),anyInt())).thenReturn(output())
        assertThatThrownBy {service.review(identity,jobId,request)}.hasMessage("CV_CONFLICT")
        assertThat(mockingDetails(sessions).invocations.map {it.method.name}).containsOnly("latest")
        reset(ai)
        val next=CvWordingSourceReview(sessions,routing,ai,mapper,1)
        `when`(sessions.latest(identity,jobId)).thenReturn(session)
        `when`(ai.generateJson(anyString(),anyString(),anyMap(),eq(AiTask.CV_TAILORING) ?: AiTask.CV_TAILORING,any(AiSelection::class.java) ?: AiSelection("Groq","openai/gpt-oss-20b"),anyInt())).thenThrow(AiFailure("AI_RATE_LIMITED",429,120))
        assertThatThrownBy {next.review(identity,jobId,request)}.isInstanceOfSatisfying(AiFailure::class.java) {assertThat(it.retryAfterSeconds).isEqualTo(120)}
        verify(ai,times(1)).generateJson(anyString(),anyString(),anyMap(),eq(AiTask.CV_TAILORING) ?: AiTask.CV_TAILORING,any(AiSelection::class.java) ?: AiSelection("Groq","openai/gpt-oss-20b"),anyInt())
    }
}
