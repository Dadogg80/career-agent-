package com.careeragent.cv

import com.careeragent.ai.application.AiModel
import com.careeragent.cv.application.*
import com.careeragent.jobs.domain.*
import com.careeragent.profile.application.VerifiedIdentity
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.time.Instant
import java.time.OffsetDateTime
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("persistence")
@Testcontainers
class CvTailoringSessionIntegrationTest {
    @Autowired lateinit var mvc: MockMvc
    @Autowired lateinit var jdbc: JdbcTemplate
    @Autowired lateinit var json: ObjectMapper
    @Autowired lateinit var repository: CvTailoringSessionRepository
    @Autowired lateinit var versions: CvRepository
    @org.springframework.test.context.bean.override.mockito.MockitoSpyBean lateinit var renderer: com.careeragent.cv.infrastructure.StandardCvRenderer
    @MockitoBean lateinit var ai: AiModel
    @MockitoBean lateinit var tailoring: CvTailoringService
    @Autowired lateinit var routing: com.careeragent.ai.application.AiRouting
    private val issuer = "https://identity.example.test"
    private fun caller(user: String) = oidcLogin().idToken { it.issuer(issuer).subject(user).audience(listOf("career-agent")).issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(600)) }
    data class Fixture(val user: String, val owner: UUID, val job: UUID, val doc: UUID, val claim: UUID, val snapshot: TailoringSnapshot) {
        val path get() = "/api/profile/me/jobs/$job/tailoring"
    }
    private fun fixture(): Fixture {
        val user = UUID.randomUUID().toString()
        mvc.perform(put("/api/profile/me").with(caller(user)).with(csrf()).contentType("application/json").content("""{"displayName":"Fictional Pilot","preferredLanguage":"nb","revision":0}""")).andExpect(status().isOk)
        val owner = jdbc.queryForObject("SELECT id FROM app_user WHERE oidc_issuer=? AND oidc_subject=?",UUID::class.java,issuer,user)!!
        val result = mvc.perform(post("/api/profile/me/claims").with(caller(user)).with(csrf()).contentType("application/json").content("""{"skill":"Kotlin","statement":"Built Kotlin APIs","context":"Example AS","sourceNote":"Own statement"}""")).andExpect(status().isOk).andReturn()
        val claim = UUID.fromString(json.readTree(result.response.contentAsString).path("id").asText())
        mvc.perform(post("/api/profile/me/claims/$claim/review").with(caller(user)).with(csrf()).contentType("application/json").content("""{"decision":"CONFIRM","revision":1}""")).andExpect(status().isOk)
        val doc = UUID.randomUUID(); val job = UUID.randomUUID(); val matchId = UUID.randomUUID()
        val text = "Fictional developer\n\nBuilt Kotlin APIs"
        jdbc.update("INSERT INTO career_document(id,owner_id,original_name,media_type,byte_size,sha256,extracted_text,language) VALUES(?,?,'fictional.txt','text/plain',100,?,?,'nb')",doc,owner,"a".repeat(64),text)
        val content = mapOf("title" to "Fictional developer", "sourceUrl" to null,"sourceType" to "PASTED_TEXT","text" to "Kotlin API experience is required for this fictional job.","locale" to "nb","requirements" to listOf(mapOf("label" to "Kotlin APIs","kind" to "REQUIRED","quote" to "Kotlin API experience is required")),"facts" to emptyList<Any>(),"omittedItems" to 0,"retrievedAt" to null)
        jdbc.update("INSERT INTO saved_job(id,owner_id,fingerprint,snapshot) VALUES(?,?,?,?::jsonb)",job,owner,"b".repeat(64),json.writeValueAsString(content))
        val claims = listOf(MatchClaim(claim,2,"Kotlin","Built Kotlin APIs","Example AS"))
        val match = PersonalMatch(matchId,"nb",OffsetDateTime.now(),emptyList(),claims,0,100,automaticEvidence=true)
        jdbc.update("INSERT INTO job_match_analysis(job_id,owner_id,result) VALUES(?,?,?::jsonb)",job,owner,json.writeValueAsString(match))
        val proposal = CvTextProposal(1,"Built Kotlin APIs","Developed APIs using Kotlin","Clarifies relevant work",listOf(claim),listOf(0))
        return Fixture(user,owner,job,doc,claim,TailoringSnapshot(CvTailoringResult(doc,matchId,"Gemini","gemini-3.5-flash-lite",listOf(proposal),0),text,claims,listOf("Kotlin API experience is required"),"nb"))
    }
    private fun save(f: Fixture) = repository.create(VerifiedIdentity(issuer,f.user),f.job,f.snapshot)
    private fun review(f: Fixture, session: CvTailoringSession, text: String = "Developed APIs using Kotlin", decision: String = "ACCEPTED", revision: Long = session.revision) =
        put("${f.path}/session").with(caller(f.user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(mapOf("sessionId" to session.id,"revision" to revision,"reviews" to listOf(mapOf("paragraphIndex" to 1,"text" to text,"decision" to decision)))))

    @Test fun `source review requires login csrf ownership consent and current saved revision without changing wording`() {
        val f=fixture();val other=fixture();val identity=VerifiedIdentity(issuer,f.user)
        val session=repository.create(identity,f.job,f.snapshot)
        val body=mapOf("sessionId" to session.id,"revision" to session.revision,"paragraphIndexes" to listOf(1),"locale" to "nb","consent" to true,
            "aiApproval" to routing.preview(com.careeragent.ai.application.AiTask.CV_TAILORING).token)
        fun request(user:String=f.user,value:Map<String,Any> = body)=post("${f.path}/source-review").with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(value))
        mvc.perform(post("${f.path}/source-review").with(csrf()).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isUnauthorized)
        mvc.perform(post("${f.path}/source-review").with(caller(f.user)).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isForbidden)
        mvc.perform(request(other.user)).andExpect(status().isNotFound)
        mvc.perform(request(value=body+("consent" to false))).andExpect(status().isBadRequest)
        mvc.perform(request(value=body+("revision" to 99))).andExpect(status().isConflict)
        verifyNoInteractions(ai)
        `when`(ai.generateJson(anyString(),anyString(),anyMap(),eq(com.careeragent.ai.application.AiTask.CV_TAILORING) ?: com.careeragent.ai.application.AiTask.CV_TAILORING,any(com.careeragent.ai.application.AiSelection::class.java) ?: com.careeragent.ai.application.AiSelection("Groq","openai/gpt-oss-20b"),anyInt())).thenReturn(
            json.writeValueAsString(mapOf("items" to listOf(mapOf("paragraphIndex" to 1,"finding" to "SCOPE_EXPANSION","phrase" to "APIs","evidenceIds" to listOf(0))))))
        mvc.perform(request()).andExpect(status().isOk).andExpect(header().string("Cache-Control","no-store"))
            .andExpect(jsonPath("$.items[0].status").value("NEEDS_REVIEW")).andExpect(jsonPath("$.revision").value(session.revision))
        assertEquals(session,repository.latest(identity,f.job))
        jdbc.update("UPDATE competency_claim SET revision=revision+1 WHERE id=?",f.claim)
        mvc.perform(request()).andExpect(status().isConflict).andExpect(jsonPath("$.code").value("CV_SOURCE_CONFLICT"))
        verify(ai,times(1)).generateJson(anyString(),anyString(),anyMap(),eq(com.careeragent.ai.application.AiTask.CV_TAILORING) ?: com.careeragent.ai.application.AiTask.CV_TAILORING,any(com.careeragent.ai.application.AiSelection::class.java) ?: com.careeragent.ai.application.AiSelection("Groq","openai/gpt-oss-20b"),anyInt())
    }

    @Test fun `new logical source units survive storage reopening and exact reviewed draft assembly`() {
        val f=fixture();val identity=VerifiedIdentity(issuer,f.user)
        val text="Fictional developer\nPROFILE\nBuilt Kotlin APIs.\n\nImproved API documentation.\n"+
            "WORK EXPERIENCE\n2021 – 2023 Example AS – Developer\nBuilt Kotlin APIs\n- Supported API users."
        jdbc.update("UPDATE career_document SET extracted_text=? WHERE id=?",text,f.doc)
        val units=CvSourceUnits.create(text)
        val unit=units.last {it.kind==CvSourceUnitKind.TEXT}
        val proposal=CvTextProposal(unit.paragraphIndex,text.substring(unit.start,unit.end),"Developed APIs using Kotlin","Clarifies sourced API work",listOf(f.claim),listOf(0))
        val snapshot=f.snapshot.copy(text=text,promptVersion="cv-section-wording-v6",
            result=f.snapshot.result.copy(proposals=listOf(proposal),sourceUnits=units))
        val stored=repository.create(identity,f.job,snapshot)
        val reopened=repository.latest(identity,f.job)!!
        assertEquals(units,reopened.snapshot.result.sourceUnits)
        assertEquals("cv-section-wording-v6",reopened.snapshot.promptVersion)
        mvc.perform(get("${f.path}/session").with(caller(f.user))).andExpect(status().isOk)
            .andExpect(jsonPath("$.snapshot.result.sourceUnits.length()").value(units.size))
        val reviewed=repository.review(identity,f.job,TailoringReviewRequest(stored.id,stored.revision,
            listOf(WordingReview(unit.paragraphIndex,proposal.newText,WordingDecision.ACCEPTED))))
        val draft=repository.draft(identity,f.job,reviewed.id,reviewed.revision)
        assertEquals(text.substring(0,unit.start)+proposal.newText+text.substring(unit.end),draft.content.reviewedSource!!.text)
        assertEquals(text,jdbc.queryForObject("SELECT extracted_text FROM career_document WHERE id=?",String::class.java,f.doc))
        assertEquals(2L,jdbc.queryForObject("SELECT revision FROM competency_claim WHERE id=?",Long::class.java,f.claim))
        verifyNoInteractions(ai)
    }

    @Test fun `generation persists an owned snapshot and review survives reopening without factual promotion or AI calls`() {
        val f = fixture()
        mvc.perform(get("${f.path}/session").with(caller(f.user))).andExpect(status().isOk).andExpect(content().string("null"))
        `when`(tailoring.propose(VerifiedIdentity(issuer,f.user),f.job,TailoringRequest(f.doc,f.snapshot.text,f.snapshot.result.matchId,"nb",true,"a".repeat(64)))).thenReturn(f.snapshot.result)
        mvc.perform(post(f.path).with(caller(f.user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(mapOf("documentId" to f.doc,"text" to f.snapshot.text,"matchId" to f.snapshot.result.matchId,"locale" to "nb","consent" to true,"aiApproval" to "a".repeat(64))))).andExpect(status().isOk).andExpect(jsonPath("$.sessionId").exists())
        val session = repository.latest(VerifiedIdentity(issuer,f.user),f.job)!!
        mvc.perform(review(f,session)).andExpect(status().isOk).andExpect(jsonPath("$.revision").value(2))
        mvc.perform(get("${f.path}/session").with(caller(f.user))).andExpect(status().isOk).andExpect(header().string("Cache-Control","no-store")).andExpect(jsonPath("$.reviews[0].decision").value("ACCEPTED")).andExpect(jsonPath("$.snapshot.result.model").value("gemini-3.5-flash-lite"))
        mvc.perform(review(f,session,"Revised Kotlin API wording","PENDING",2)).andExpect(status().isOk).andExpect(jsonPath("$.reviews[0].decision").value("PENDING"))
        mvc.perform(review(f,session,revision=2)).andExpect(status().isConflict).andExpect(jsonPath("$.code").value("CV_CONFLICT"))
        assertEquals(2L,jdbc.queryForObject("SELECT revision FROM competency_claim WHERE id=?",Long::class.java,f.claim))
        assertEquals(f.snapshot.text,jdbc.queryForObject("SELECT extracted_text FROM career_document WHERE id=?",String::class.java,f.doc))
        assertEquals(0L,jdbc.queryForObject("SELECT COUNT(*) FROM cv_version WHERE owner_id=?",Long::class.java,f.owner))
        verifyNoInteractions(ai)
    }
    @Test fun `owner CSRF stale sources and invalid reviews cannot overwrite saved decisions`() {
        val f = fixture(); val other = fixture(); val session = save(f)
        mvc.perform(get("${f.path}/session")).andExpect(status().isUnauthorized)
        mvc.perform(get("${f.path}/session").with(caller(other.user))).andExpect(status().isNotFound)
        mvc.perform(put("${f.path}/session").with(caller(f.user)).contentType("application/json").content("{}" )).andExpect(status().isForbidden)
        mvc.perform(review(f,session).with(caller(other.user))).andExpect(status().isNotFound)
        mvc.perform(review(f,session,text=" ")).andExpect(status().isBadRequest)
        mvc.perform(review(f,session,text="Led 100 staff.")).andExpect(status().isBadRequest).andExpect(jsonPath("$.code").value("CV_WORDING_UNSUPPORTED"))
        mvc.perform(get("${f.path}/session").with(caller(f.user))).andExpect(jsonPath("$.revision").value(1)).andExpect(jsonPath("$.reviews.length()").value(0))
        val invalid = TailoringReviewRequest(session.id,1,listOf(WordingReview(3,"Unsupported section",WordingDecision.ACCEPTED)))
        mvc.perform(put("${f.path}/session").with(caller(f.user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(invalid))).andExpect(status().isBadRequest)
        jdbc.update("UPDATE career_document SET extracted_text='Changed CV source' WHERE id=?",f.doc)
        mvc.perform(get("${f.path}/session").with(caller(f.user))).andExpect(jsonPath("$.stale").value(true)).andExpect(jsonPath("$.snapshot.text").value(f.snapshot.text))
        mvc.perform(review(f,session)).andExpect(status().isConflict).andExpect(jsonPath("$.code").value("CV_SOURCE_CONFLICT"))
        assertEquals(emptyList<WordingReview>(),repository.latest(VerifiedIdentity(issuer,f.user),f.job)!!.reviews)
        verifyNoInteractions(ai)
    }
    @Test fun `changed confirmed evidence invalidates review and new sessions retain earlier snapshots`() {
        val f = fixture(); val first = save(f); val second = save(f)
        assertNotEquals(first.id,second.id)
        assertEquals(2L,jdbc.queryForObject("SELECT COUNT(*) FROM cv_tailoring_session WHERE owner_id=?",Long::class.java,f.owner))
        jdbc.update("UPDATE competency_claim SET revision=revision+1 WHERE id=?",f.claim)
        mvc.perform(get("${f.path}/session").with(caller(f.user))).andExpect(jsonPath("$.stale").value(true))
        mvc.perform(review(f,second)).andExpect(status().isConflict)
        assertThrows(CvFailure::class.java) { save(f) }
        verifyNoInteractions(ai)
    }
    @Test fun `reviewed wording creates immutable owned file drafts without final approval or factual changes`() {
        val f=fixture();val session=save(f)
        fun draft(user:String=f.user, revision:Long=2)=post("${f.path}/draft").with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(mapOf("sessionId" to session.id,"revision" to revision)))
        mvc.perform(draft(revision=1)).andExpect(status().isConflict).andExpect(jsonPath("$.code").value("CV_WORDING_REVIEW_REQUIRED"))
        mvc.perform(review(f,session)).andExpect(status().isOk)
        mvc.perform(draft(revision=1)).andExpect(status().isConflict).andExpect(jsonPath("$.code").value("CV_CONFLICT"))
        mvc.perform(draft(user=fixture().user)).andExpect(status().isNotFound)
        val result=json.readTree(mvc.perform(draft()).andExpect(status().isOk).andExpect(header().string("Cache-Control","no-store")).andExpect(jsonPath("$.status").value("DRAFT")).andReturn().response.contentAsString)
        val id=result["id"].asText()
        assertEquals("Fictional developer\n\nDeveloped APIs using Kotlin",result["content"]["reviewedSource"]["text"].asText())
        assertEquals(session.id.toString(),result["content"]["reviewedSource"]["sessionId"].asText())
        mvc.perform(draft()).andExpect(jsonPath("$.id").value(id))
        assertEquals(1L,jdbc.queryForObject("SELECT COUNT(*) FROM cv_version WHERE owner_id=?",Long::class.java,f.owner))
        mvc.perform(post("/api/profile/me/cvs/$id/approve").with(caller(f.user)).with(csrf()).contentType("application/json").content("""{"approved":true,"revision":1}""")).andExpect(status().isConflict).andExpect(jsonPath("$.code").value("CV_FINAL_REVIEW_REQUIRED"))
        mvc.perform(get("/api/profile/me/cvs/$id").with(caller(f.user))).andExpect(status().isOk).andExpect(jsonPath("$.stale").value(false)).andExpect(jsonPath("$.artifacts.length()").value(0))
        fun files(revision:Long=1,user:String=f.user)=post("/api/profile/me/cvs/$id/files").with(caller(user)).with(csrf()).contentType("application/json").content("""{"revision":$revision}""")
        mvc.perform(files(user=fixture().user)).andExpect(status().isNotFound)
        mvc.perform(post("/api/profile/me/cvs/$id/files").with(caller(f.user)).contentType("application/json").content("""{"revision":1}""")).andExpect(status().isForbidden)
        mvc.perform(files(revision=99)).andExpect(status().isConflict)
        val cvContent=versions.get(VerifiedIdentity(issuer,f.user),UUID.fromString(id)).content
        val wrongFiles=renderer.generate(cvContent.copy(reviewedSource=cvContent.reviewedSource!!.copy(text="Wrong text")))
        doReturn(wrongFiles).`when`(renderer).generate(cvContent)
        mvc.perform(files()).andExpect(status().isServiceUnavailable).andExpect(jsonPath("$.code").value("CV_FILE_CONTENT_MISMATCH"))
        mvc.perform(get("/api/profile/me/cvs/$id").with(caller(f.user))).andExpect(jsonPath("$.artifacts.length()").value(0)).andExpect(jsonPath("$.revision").value(1))
        doAnswer { invocation ->
            val files=invocation.callRealMethod()
            jdbc.update("UPDATE competency_claim SET revision=revision+1 WHERE id=?",f.claim)
            files
        }.`when`(renderer).generate(cvContent)
        mvc.perform(files()).andExpect(status().isConflict).andExpect(jsonPath("$.code").value("CV_SOURCE_CONFLICT"))
        mvc.perform(get("/api/profile/me/cvs/$id").with(caller(f.user))).andExpect(jsonPath("$.artifacts.length()").value(0))
        jdbc.update("UPDATE competency_claim SET revision=2 WHERE id=?",f.claim)
        doCallRealMethod().`when`(renderer).generate(cvContent)
        mvc.perform(files()).andExpect(status().isOk).andExpect(jsonPath("$.status").value("DRAFT")).andExpect(jsonPath("$.revision").value(2)).andExpect(jsonPath("$.approvedAt").doesNotExist()).andExpect(jsonPath("$.artifacts.length()").value(2))
        val extractor=com.careeragent.documents.infrastructure.DocumentTextExtractor()
        for(format in listOf("docx","pdf")) {
            val bytes=mvc.perform(get("/api/profile/me/cvs/$id/download/$format").with(caller(f.user))).andExpect(status().isOk).andExpect(header().string("Cache-Control","no-store")).andReturn().response.contentAsByteArray
            assertEquals("FictionaldeveloperDevelopedAPIsusingKotlin",extractor.extract(bytes,format).filterNot { it.isWhitespace() })
            mvc.perform(get("/api/profile/me/cvs/$id/download/$format").with(caller(fixture().user))).andExpect(status().isNotFound)
        }
        val persisted=jdbc.queryForObject("SELECT artifacts::text FROM cv_version WHERE id=?",String::class.java,java.util.UUID.fromString(id))
        mvc.perform(files(revision=2)).andExpect(status().isOk).andExpect(jsonPath("$.revision").value(2))
        assertEquals(persisted,jdbc.queryForObject("SELECT artifacts::text FROM cv_version WHERE id=?",String::class.java,java.util.UUID.fromString(id)))
        mvc.perform(post("/api/profile/me/cvs/$id/approve").with(caller(f.user)).with(csrf()).contentType("application/json").content("""{"approved":true,"revision":2}""")).andExpect(status().isConflict).andExpect(jsonPath("$.code").value("CV_FINAL_REVIEW_REQUIRED"))
        assertEquals(f.snapshot.text,jdbc.queryForObject("SELECT extracted_text FROM career_document WHERE id=?",String::class.java,f.doc))
        assertEquals(2L,jdbc.queryForObject("SELECT revision FROM competency_claim WHERE id=?",Long::class.java,f.claim))
        jdbc.update("UPDATE career_document SET extracted_text=? WHERE id=?",f.snapshot.text+" changed",f.doc)
        mvc.perform(files(revision=2)).andExpect(status().isConflict).andExpect(jsonPath("$.code").value("CV_SOURCE_CONFLICT"))
        mvc.perform(draft()).andExpect(status().isConflict).andExpect(jsonPath("$.code").value("CV_SOURCE_CONFLICT"))
        mvc.perform(get("/api/profile/me/cvs/$id").with(caller(f.user))).andExpect(status().isOk).andExpect(jsonPath("$.stale").value(true)).andExpect(jsonPath("$.content.reviewedSource.text").value("Fictional developer\n\nDeveloped APIs using Kotlin"))
        verifyNoInteractions(ai)
    }
    @Test fun `individual passage reasons persist with source indexes and do not confirm facts`() {
        val f=fixture();val sections=CvSections.identify(f.snapshot.text,CvReviewedText.paragraphs(f.snapshot.text))
        val plans=listOf(CvPassagePlan(0,CvSectionAction.KEEP_UNCHANGED,"Identity retained",emptyList(),emptyList()),CvPassagePlan(1,CvSectionAction.PROPOSE_CHANGES,"Clarifies APIs",listOf(f.claim),listOf(0)))
        val snapshot=f.snapshot.copy(result=f.snapshot.result.copy(sections=sections,sectionPlans=listOf(CvSectionPlan(sections[0].id,CvSectionAction.PROPOSE_CHANGES,CvSectionPriority.HIGH,"Relevant APIs",listOf(f.claim),listOf(0),true,listOf(0,1))),passagePlans=plans))
        val session=repository.create(VerifiedIdentity(issuer,f.user),f.job,snapshot)
        mvc.perform(get("${f.path}/session").with(caller(f.user))).andExpect(status().isOk).andExpect(jsonPath("$.snapshot.result.passagePlans.length()").value(2)).andExpect(jsonPath("$.snapshot.result.passagePlans[1].reason").value("Clarifies APIs"))
        assertEquals(plans,repository.latest(VerifiedIdentity(issuer,f.user),f.job)!!.snapshot.result.passagePlans)
        mvc.perform(review(f,session)).andExpect(status().isOk)
        assertEquals(2L,jdbc.queryForObject("SELECT revision FROM competency_claim WHERE id=?",Long::class.java,f.claim))
        verifyNoInteractions(ai)
    }
    companion object {
        @Container @JvmStatic val postgres=PostgreSQLContainer<Nothing>("postgres@sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826")
        @DynamicPropertySource @JvmStatic fun properties(registry:DynamicPropertyRegistry){registry.add("spring.datasource.url",postgres::getJdbcUrl);registry.add("spring.datasource.username",postgres::getUsername);registry.add("spring.datasource.password",postgres::getPassword)}
    }
}
