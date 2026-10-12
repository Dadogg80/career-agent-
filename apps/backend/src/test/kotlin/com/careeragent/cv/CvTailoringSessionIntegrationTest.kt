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
    @MockitoBean lateinit var ai: AiModel
    @MockitoBean lateinit var tailoring: CvTailoringService
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
    companion object {
        @Container @JvmStatic val postgres=PostgreSQLContainer<Nothing>("postgres@sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826")
        @DynamicPropertySource @JvmStatic fun properties(registry:DynamicPropertyRegistry){registry.add("spring.datasource.url",postgres::getJdbcUrl);registry.add("spring.datasource.username",postgres::getUsername);registry.add("spring.datasource.password",postgres::getPassword)}
    }
}
