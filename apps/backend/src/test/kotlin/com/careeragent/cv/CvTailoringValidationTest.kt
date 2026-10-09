package com.careeragent.cv

import com.careeragent.ai.application.*
import com.careeragent.cv.application.*
import com.careeragent.documents.application.*
import com.careeragent.documents.domain.*
import com.careeragent.jobs.application.*
import com.careeragent.jobs.domain.*
import com.careeragent.profile.application.VerifiedIdentity
import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import java.time.OffsetDateTime
import java.util.UUID

class CvTailoringValidationTest {
 private val mapper=ObjectMapper()
 private val jobs=mock(SavedJobRepository::class.java)
 private val documents=mock(DocumentRepository::class.java)
 private val matching=mock(PersonalMatchService::class.java)
 private val ai=mock(AiModel::class.java)
 private val routing=AiRouting()
 private val service=CvTailoringService(jobs,documents,matching,routing,ai,mapper,5)
 private val identity=VerifiedIdentity("https://identity.example.test","fictional-user")
 private val jobId=UUID.randomUUID();private val documentId=UUID.randomUUID();private val matchId=UUID.randomUUID();private val claimId=UUID.randomUUID()
 private val text="Fictional engineer\n\nBuilt Kotlin APIs for a fictional employer and improved service reliability."
 private val request=TailoringRequest(documentId,text,matchId,"en",true,routing.preview(AiTask.CV_TAILORING).token)
 private fun setup():PersonalMatch {
  val now=OffsetDateTime.now()
  val job=SavedJob(jobId,SavedJobContent("Fictional role",null,"PASTED_TEXT","Kotlin service development is required in this fictional advertisement.","en",listOf(ExtractedRequirement("Kotlin",RequirementKind.REQUIRED,"Kotlin service development")),emptyList(),0,null),now)
  `when`(jobs.get(identity,jobId)).thenReturn(job)
  `when`(documents.detail(identity,documentId)).thenReturn(DocumentDetail(CareerDocument(documentId,"fictional.txt","text/plain",100,"a".repeat(64),"en",true,now),text))
  val match=PersonalMatch(matchId,"en",now,emptyList(),listOf(MatchClaim(claimId,2,"Kotlin",text.substringAfter("\n\n"),"Fictional employer")),0,100,automaticEvidence=true)
  `when`(matching.load(identity,jobId)).thenReturn(match)
  `when`(matching.compactInput(anyString(),anyList(),anyList(),anyList())).thenReturn("""{"confirmedClaims":[],"candidatePassages":[]}""")
  return match
 }
 private fun proposal(id:UUID=claimId,index:Int=1,criterion:Int=0)=mapOf("paragraphIndex" to index,"newText" to "Developed Kotlin APIs for a fictional employer.","reason" to "Makes the documented API contribution visible.","claimIds" to listOf(id.toString()),"requirementIndexes" to listOf(criterion))
 @Test fun `invalid references and duplicate edits are omitted without losing valid supported suggestions`() {
  val result=service.parse(mapper.writeValueAsString(mapOf("proposals" to listOf(proposal(),proposal(UUID.randomUUID()),proposal(index=500),proposal(criterion=12),proposal()))),service.paragraphs(text),setOf(claimId),1)
  assertThat(result.first).hasSize(1);assertThat(result.first.single().oldText).isEqualTo(text.substringAfter("\n\n"));assertThat(result.second).isEqualTo(4)
  assertThatThrownBy {service.parse("{broken",listOf(text),setOf(claimId),1)}.isInstanceOf(AiFailure::class.java)
  assertThatThrownBy {service.parse("""{"proposals":[],"ownerId":"spoof"}""",listOf(text),setOf(claimId),1)}.isInstanceOf(AiFailure::class.java)
 }
 @Test fun `long single paragraphs are segmented literally without dropping the middle or end`() {
  val source="start " + "Full literal source. ".repeat(2800) + " end"
  val parts=service.paragraphs(source)
  assertThat(parts.joinToString("")).isEqualTo(source);assertThat(parts.all {it.length<=4000}).isTrue()
  val unicode="a".repeat(3999)+"😀"+"b".repeat(100)
  assertThat(service.paragraphs(unicode).joinToString("")).isEqualTo(unicode)
  assertThat(service.paragraphs(unicode).first()).hasSize(3999)
  val lines="Line of exact source text\n".repeat(2100)
  assertThat(service.paragraphs(lines).joinToString("")).isEqualTo(lines)
 }
 @Test fun `consent wrong-task approval and changed original prevent provider calls`() {
  assertThatThrownBy {service.propose(identity,jobId,request.copy(consent=false))}.isInstanceOf(CvFailure::class.java)
  assertThatThrownBy {service.propose(identity,jobId,request.copy(aiApproval=routing.preview(AiTask.PERSONAL_MATCH).token))}.isInstanceOf(AiFailure::class.java)
  setup()
  assertThatThrownBy {service.propose(identity,jobId,request.copy(text=text+" changed"))}.isInstanceOf(CvFailure::class.java)
  verifyNoInteractions(ai)
 }
 @Test fun `legacy or stale matching cannot support new CV suggestions`() {
  val match=setup()
  `when`(matching.load(identity,jobId)).thenReturn(match.copy(automaticEvidence=false))
  assertThatThrownBy {service.propose(identity,jobId,request)}.isInstanceOf(CvFailure::class.java)
  `when`(matching.load(identity,jobId)).thenReturn(match.copy(stale=true))
  assertThatThrownBy {service.propose(identity,jobId,request)}.isInstanceOf(CvFailure::class.java)
  verifyNoInteractions(ai)
 }
 @Test fun `revision changes during generation invalidate suggestions and never modify sources`() {
  val match=setup()
  `when`(matching.load(identity,jobId)).thenReturn(match,match.copy(stale=true))
  `when`(ai.generateJson(anyString(),anyString(),anyMap(),eq(AiTask.CV_TAILORING) ?: AiTask.CV_TAILORING)).thenReturn(mapper.writeValueAsString(mapOf("proposals" to listOf(proposal()))))
  assertThatThrownBy {service.propose(identity,jobId,request)}.isInstanceOf(CvFailure::class.java)
  assertThat(mockingDetails(documents).invocations.map {it.method.name}).containsOnly("detail")
 }
 @Test fun `source rereading during generation invalidates suggestions even with unchanged match`() {
  setup()
  val original=documents.detail(identity,documentId)
  `when`(documents.detail(identity,documentId)).thenReturn(original,original.copy(text=text+" changed"))
  `when`(ai.generateJson(anyString(),anyString(),anyMap(),eq(AiTask.CV_TAILORING) ?: AiTask.CV_TAILORING)).thenReturn(mapper.writeValueAsString(mapOf("proposals" to listOf(proposal()))))
  assertThatThrownBy {service.propose(identity,jobId,request)}.isInstanceOf(CvFailure::class.java)
 }
 @Test fun `Gemini tailoring defaults to Lite independently and requires its own fingerprint`() {
  val env=org.springframework.mock.env.MockEnvironment().withProperty("AI_PROVIDER","gemini").withProperty("GEMINI_MODEL","gemini-3.5-flash")
  val configured=AiRouting(env)
  assertThat(configured.selection(AiTask.CV_TAILORING).model).isEqualTo("gemini-3.5-flash-lite")
  assertThatThrownBy {configured.resolveApproval(configured.preview(AiTask.PERSONAL_MATCH).token,AiTask.CV_TAILORING)}.isInstanceOf(AiFailure::class.java)
 }
 @Test fun `owned literal source and actual task selection produce unpersisted proposals`() {
  setup()
  `when`(ai.generateJson(anyString(),anyString(),anyMap(),eq(AiTask.CV_TAILORING) ?: AiTask.CV_TAILORING)).thenReturn(mapper.writeValueAsString(mapOf("proposals" to listOf(proposal()))))
  val result=service.propose(identity,jobId,request)
  assertThat(result.provider).isEqualTo("Groq");assertThat(result.documentId).isEqualTo(documentId);assertThat(result.proposals.single().claimIds).containsExactly(claimId)
  verify(documents,times(2)).detail(identity,documentId)
  assertThat(mockingDetails(jobs).invocations.map {it.method.name}).containsOnly("get")
 }
 @Test fun `tailoring references beyond criterion twelve retain exact source and reject nonexistent indices`() {
  val item=proposal()+("requirementIndexes" to (0 until 128).toList())
  val parsed=service.parse(mapper.writeValueAsString(mapOf("proposals" to listOf(item))),listOf("Original text","Other original"),setOf(claimId),128)
  assertThat(parsed.first.single().requirementIndexes).hasSize(128).contains(127)
  assertThat(parsed.second).isZero()
  val invalid=service.parse(mapper.writeValueAsString(mapOf("proposals" to listOf(item+("requirementIndexes" to listOf(128))))),listOf("Original text","Other original"),setOf(claimId),128)
  assertThat(invalid.first).isEmpty();assertThat(invalid.second).isEqualTo(1)
 }

 @Test fun `visibility preserves literal CV sources and separates presentation gaps from uncertain competence`() {
  val match=setup().copy(assessments=(0..4).map {index->RequirementMatch(index,if(index==3)MatchKind.CLARIFY else MatchKind.STRONG,"Source-based relevance",listOf(MatchEvidence(claimId,text.substringAfter("\n\n"))),"")})
  fun item(index:Int,status:String,passages:List<Map<String,Any>> = emptyList())=mapOf("requirementIndex" to index,"status" to status,"reason" to "Specific evidence visibility", "claimIds" to listOf(claimId.toString()),"passages" to passages)
  val source=mapOf("paragraphIndex" to 1,"quote" to "Built Kotlin APIs")
  val root=mapper.readTree(mapper.writeValueAsString(mapOf("visibility" to listOf(item(0,"VISIBLE",listOf(source)),item(1,"WEAKLY_VISIBLE",listOf(source)),item(2,"NOT_VISIBLE"),item(3,"NOT_VISIBLE"),item(4,"VISIBLE",listOf(source+("quote" to "Invented authorization")))))))
  val result=validatedVisibility(root,service.paragraphs(text),match,5,"en")
  assertThat(result.map {it.status}).containsExactly(CvVisibility.VISIBLE,CvVisibility.WEAKLY_VISIBLE,CvVisibility.NOT_VISIBLE,CvVisibility.NEEDS_CLARIFICATION,CvVisibility.UNASSESSED)
  assertThat(result[0].passages.single().quote).isEqualTo("Built Kotlin APIs")
  assertThat(result[3].reason).contains("does not establish");assertThat(result[4].claimIds).isEmpty()
 }
 @Test fun `healthcare sales and project evidence cannot replace uncertain formal qualifications or acquire foreign context`() {
  val source=listOf("Assisted patients with appointments.","Managed customer renewals.","Delivered project schedules.")
  val claims=source.mapIndexed {index,statement->MatchClaim(UUID.randomUUID(),2,listOf("Patient support","Sales","Project delivery")[index],statement,"Fictional organization $index")}
  val match=setup().copy(claims=claims,assessments=listOf(
   RequirementMatch(0,MatchKind.CLARIFY,"Authorization not established",emptyList(),"Do you hold the required authorization?",requirementNature=RequirementNature.FORMAL),
   RequirementMatch(1,MatchKind.STRONG,"Confirmed renewals",listOf(MatchEvidence(claims[1].id,source[1])),""),
   RequirementMatch(2,MatchKind.PARTIAL,"Delivery documented, leadership not established",listOf(MatchEvidence(claims[2].id,source[2])),"")))
  val items=claims.mapIndexed {index,claim->mapOf("requirementIndex" to index,"status" to "VISIBLE","reason" to "Scope must remain tied to the source", "claimIds" to listOf(claim.id.toString()),"passages" to listOf(mapOf("paragraphIndex" to index,"quote" to source[index])))}
  fun assess(output:List<Map<String,Any>>)=validatedVisibility(mapper.readTree(mapper.writeValueAsString(mapOf("visibility" to output))),source,match,3,"en")
  assertThat(assess(items).map {it.status}).containsExactly(CvVisibility.NEEDS_CLARIFICATION,CvVisibility.VISIBLE,CvVisibility.VISIBLE)
  val foreign=items.toMutableList();foreign[1]=items[1]+("claimIds" to listOf(claims[2].id.toString()))
  assertThat(assess(foreign)[1].status).isEqualTo(CvVisibility.UNASSESSED)
 }
 @Test fun `visibility rejects foreign claims duplicate references false absence and malformed lists while keeping proposals`() {
  val match=setup().copy(assessments=(0..2).map {RequirementMatch(it,MatchKind.STRONG,"Relevant",listOf(MatchEvidence(claimId,"Built Kotlin APIs")),"")})
  val item=mapOf("requirementIndex" to 0,"status" to "NOT_VISIBLE","reason" to "Known experience omitted", "claimIds" to listOf(claimId.toString()),"passages" to emptyList<Any>())
  fun parse(items:Any)=validatedVisibility(mapper.readTree(mapper.writeValueAsString(mapOf("visibility" to items))),service.paragraphs(text),match,3,"nb")
  val invalid=listOf(item+("claimIds" to listOf(UUID.randomUUID().toString())),item+mapOf("requirementIndex" to 1,"passages" to listOf(mapOf("paragraphIndex" to 1,"quote" to "Built Kotlin APIs"))),item+mapOf("requirementIndex" to 2,"status" to "VISIBLE","passages" to listOf(mapOf("paragraphIndex" to 0,"quote" to "Built Kotlin APIs"))))
  assertThat(parse(invalid)).allMatch {it.status==CvVisibility.UNASSESSED}
  assertThat(parse(listOf(item,item))[0].status).isEqualTo(CvVisibility.NOT_VISIBLE)
  assertThat(parse(mapOf("bad" to true))).allMatch {it.status==CvVisibility.UNASSESSED}
  assertThat(parse((0..256).map {item})).allMatch {it.status==CvVisibility.UNASSESSED}
  val output=mapper.writeValueAsString(mapOf("proposals" to listOf(proposal()),"visibility" to mapOf("bad" to true)))
  assertThat(service.parse(output,service.paragraphs(text),setOf(claimId),3).first).hasSize(1)
  assertThat(validatedVisibility(mapper.readTree("{}"),service.paragraphs(text),match,128,"en")).hasSize(128).allMatch {it.status==CvVisibility.UNASSESSED}
 }

}
