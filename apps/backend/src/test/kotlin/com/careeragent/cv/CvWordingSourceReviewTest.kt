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
    private fun output(finding:String="SUPPORTED",ids:List<Any> = listOf(0),phrase:String=if(finding in listOf("SUPPORTED","UNASSESSED"))"" else "API integrations")=mapper.writeValueAsString(mapOf("items" to listOf(
        mapOf("paragraphIndex" to 2,"finding" to finding,"phrase" to phrase,"evidenceIds" to ids))))

    @Test fun `review uses owned saved edited wording and referenced evidence without generation judgments or writes`() {
        `when`(sessions.latest(identity,jobId)).thenReturn(session)
        `when`(ai.generateJson(anyString(),anyString(),anyMap(),eq(AiTask.CV_TAILORING) ?: AiTask.CV_TAILORING,any(AiSelection::class.java) ?: AiSelection("Groq","openai/gpt-oss-20b"),anyInt())).thenAnswer { call ->
            val prompt=call.getArgument<String>(0);val input=call.getArgument<String>(1)
            assertThat(prompt).contains("cv-wording-sources-v3","Review EVERY factual assertion","No advertisement requirements","never final CV approval")
            assertThat(input).doesNotContain("GENERATION_REASON_IS_NOT_PROOF","OTHER_EMPLOYER_NOT_REFERENCED","classification","Autonomous agent delivery","jobCriteria","original","Worked on API integrations.")
            val draft=mapper.readTree(input).path("drafts")[0]
            assertThat(draft.path("draft").asText()).isEqualTo("Developed API integrations.")
            assertThat(draft.path("entryContext").asText()).contains("Example AS", "2021")
            assertThat(draft.path("confirmedEvidence").size()).isEqualTo(2)
            assertThat(draft.path("confirmedEvidence")[0].path("text").asText()).isEqualTo(claim.statement)
            assertThat(draft.path("confirmedEvidence")[0].path("claimId").asText()).isEqualTo(claimId.toString())
            assertThat(call.getArgument<Int>(5)).isEqualTo(2048)
            output("SCOPE_EXPANSION")
        }
        val result=service.review(identity,jobId,request)
        assertThat(result.items.single().status).isEqualTo(WordingSourceStatus.NEEDS_REVIEW)
        assertThat(result.items.single().reason).contains("«API integrations»","går lenger")
        assertThat(result.items.single().evidence.single().quote).isEqualTo(claim.statement)
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
        for(invalid in listOf(output(ids=listOf(999)),output(ids=listOf(-1)),output(ids=listOf(0.5)),output(ids=listOf("0")),output(ids=emptyList()),output(ids=listOf(0,0)),output("NO_SUPPORT",phrase="Invented draft phrase"),"""{"items":[]}""",
            output("INVALID"),"""{"items":[{"paragraphIndex":2,"finding":"SUPPORTED","phrase":"","evidenceIds":[0],"reason":"Untrusted free prose"}]}""","""{"items":[${mapper.readTree(output())["items"][0]},${mapper.readTree(output())["items"][0]}]}""")) {
            val item=service.parse(invalid,session,listOf(proposal),texts,"nb").single()
            assertThat(item.status).isEqualTo(WordingSourceStatus.UNASSESSED);assertThat(item.evidence).isEmpty()
        }
        val second=proposal.copy(paragraphIndex=3)
        val root=mapper.readTree(output())
        (root["items"] as com.fasterxml.jackson.databind.node.ArrayNode).addObject().put("paragraphIndex",3).put("finding","SUPPORTED")
        val mixed=service.parse(root.toString(),session,listOf(proposal,second),mapOf(2 to proposal.newText,3 to second.newText),"en")
        assertThat(mixed.map {it.status}).containsExactly(WordingSourceStatus.SUPPORTED,WordingSourceStatus.UNASSESSED)
        assertThat(mixed[1].reason).contains("No valid source assessment")
    }
    @Test fun `a supported opinion needs statements for cited claims while an edited draft may use fewer linked claims`() {
        val texts=mapOf(2 to proposal.newText)
        assertThat(service.parse(output(ids=listOf(1)),session,listOf(proposal),texts,"en").single().status)
            .isEqualTo(WordingSourceStatus.UNASSESSED)
        val second=claim.copy(id=UUID.randomUUID(),statement="Assisted colleagues under supervision.")
        val linked=proposal.copy(claimIds=listOf(claim.id,second.id))
        val saved=session.copy(snapshot=session.snapshot.copy(claims=listOf(claim,second)))
        assertThat(service.parse(output(ids=listOf(0,3)),saved,listOf(linked),texts,"en").single().status)
            .isEqualTo(WordingSourceStatus.UNASSESSED)
        assertThat(service.parse(output(ids=listOf(0)),saved,listOf(linked),texts,"en").single().status)
            .isEqualTo(WordingSourceStatus.SUPPORTED)
        val complete=service.parse(output(ids=listOf(0,1,2)),saved,listOf(linked),texts,"en").single()
        assertThat(complete.status).isEqualTo(WordingSourceStatus.SUPPORTED)
        assertThat(complete.evidence.map {it.quote}).containsExactly(claim.statement,claim.context,second.statement)
        // Context remains useful for an adverse employer/role finding, without claiming factual support.
        assertThat(service.parse(output("CONTEXT_UNCLEAR",listOf(1)),session,listOf(proposal),texts,"en").single().status)
            .isEqualTo(WordingSourceStatus.NEEDS_REVIEW)
    }
    @Test fun `numbered sources retain long qualifiers unicode claim identity and exact quotations without sampling`() {
        val statement="x".repeat(999)+"😀"+"y".repeat(1100)+" Work may be planned; personal delivery remains unclear."
        val other=claim.copy(id=UUID.randomUUID(),revision=7,statement=statement)
        val saved=session.copy(snapshot=session.snapshot.copy(claims=listOf(claim.copy(statement=statement),other),result=session.snapshot.result.copy(proposals=listOf(proposal.copy(claimIds=listOf(claim.id,other.id))))))
        `when`(sessions.latest(identity,jobId)).thenReturn(saved)
        `when`(ai.generateJson(anyString(),anyString(),anyMap(),eq(AiTask.CV_TAILORING) ?: AiTask.CV_TAILORING,any(AiSelection::class.java) ?: AiSelection("Groq","openai/gpt-oss-20b"),anyInt())).thenAnswer {call->
            val proof=mapper.readTree(call.getArgument<String>(1)).path("drafts")[0].path("confirmedEvidence").toList()
            for(id in listOf(claim.id,other.id)) {
                val parts=proof.filter {it.path("claimId").asText()==id.toString() && it.path("field").asText()=="statement"}
                assertThat(parts.joinToString(""){it.path("text").asText()}).isEqualTo(statement)
                assertThat(parts).allSatisfy {part->val text=part.path("text").asText();assertThat(text.length).isLessThanOrEqualTo(1000);assertThat(text.first().isLowSurrogate()).isFalse();assertThat(text.last().isHighSurrogate()).isFalse()}
            }
            assertThat(proof.map {it.path("revision").asLong()}.distinct()).containsExactly(2L,7L)
            output(ids=proof.map {it.path("evidenceId").asInt()})
        }
        val result=service.review(identity,jobId,request)
        assertThat(result.items.single().status).isEqualTo(WordingSourceStatus.SUPPORTED)
        assertThat(result.items.single().evidence.map {it.claimId}.distinct()).containsExactly(claim.id,other.id)
        assertThat(result.items.single().evidence.filter {it.claimId==claim.id}.joinToString(""){it.quote}).contains(statement)
    }
    @Test fun `findings localize explanations and reject evidence borrowed from another draft`() {
        val secondId=UUID.randomUUID()
        val other=claim.copy(id=secondId,statement="Other source only.")
        val second=proposal.copy(paragraphIndex=3,claimIds=listOf(secondId))
        val saved=session.copy(snapshot=session.snapshot.copy(claims=listOf(claim,other),result=session.snapshot.result.copy(proposals=listOf(proposal,second))))
        val texts=mapOf(2 to proposal.newText,3 to second.newText)
        val raw="""{"items":[{"paragraphIndex":2,"finding":"SUPPORTED","phrase":"","evidenceIds":[2]},{"paragraphIndex":3,"finding":"NO_SUPPORT","phrase":"API integrations","evidenceIds":[2]}]}"""
        val parsed=service.parse(raw,saved,listOf(proposal,second),texts,"nb")
        assertThat(parsed.map {it.status}).containsExactly(WordingSourceStatus.UNASSESSED,WordingSourceStatus.UNSUPPORTED)
        assertThat(parsed[1].evidence.single().quote).isEqualTo("Other source only.")
        assertThat(parsed[1].reason).contains("«API integrations»","mangler kildegrunnlag")
        for(code in listOf("SUPPORTED","SCOPE_EXPANSION","CONTEXT_UNCLEAR","SOURCE_UNCERTAIN","NO_SUPPORT","CONFLICT","UNASSESSED")) {
            val raw=output(code,ids=if(code=="UNASSESSED")emptyList() else listOf(0))
            val nb=service.parse(raw,session,listOf(proposal),mapOf(2 to proposal.newText),"nb").single()
            val en=service.parse(raw,session,listOf(proposal),mapOf(2 to proposal.newText),"en").single()
            assertThat(nb.reason).isNotEqualTo(en.reason);assertThat(nb.reason.length).isLessThanOrEqualTo(600)
        }
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
