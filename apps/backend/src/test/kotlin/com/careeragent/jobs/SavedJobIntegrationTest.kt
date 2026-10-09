package com.careeragent.jobs

import com.careeragent.ai.application.AiModel
import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin
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
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("persistence")
@Testcontainers
class SavedJobIntegrationTest {
 @Autowired lateinit var mvc: MockMvc
 @Autowired lateinit var json: ObjectMapper
 @Autowired lateinit var jdbc: JdbcTemplate
 @MockitoBean lateinit var ai: AiModel
 private val path = "/api/profile/me/jobs"
 private fun caller(subject: String, issuer: String = "https://identity.example.test") = oidcLogin().idToken { it.issuer(issuer).subject(subject).audience(listOf("career-agent")).issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(600)) }
 private fun profile(subject: String = UUID.randomUUID().toString(), issuer: String = "https://identity.example.test"): String { mvc.perform(put("/api/profile/me").with(caller(subject, issuer)).with(csrf()).contentType("application/json").content("""{"displayName":"Fictional Pilot","preferredLanguage":"nb","revision":0}""")).andExpect(status().isOk); return subject }
 private fun content() = mapOf("title" to "Synthetic Kotlin developer", "sourceUrl" to "https://jobs.example.test/role", "sourceType" to "GROQ_BROWSER_EXCERPT", "text" to "Build REST APIs. Kotlin experience is required for this fictional role.", "locale" to "nb", "requirements" to listOf(mapOf("label" to "Kotlin", "kind" to "REQUIRED", "quote" to "Kotlin experience is required")), "facts" to emptyList<Any>(), "omittedItems" to 0, "retrievedAt" to "2026-10-07T12:00:00Z")
 private fun save(user: String, body: Map<String, Any?> = content()): String { val r = mvc.perform(post(path).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isOk).andExpect(header().string("Cache-Control", "no-store")).andExpect(jsonPath("$.ownerId").doesNotExist()).andReturn(); return json.readTree(r.response.contentAsString)["id"].asText() }
 @Test fun `saved snapshots reopen without AI duplicate content reuses a snapshot and changed analysis preserves both versions`() {
  val user = profile(); val body = content(); val id = save(user, body)
  assertThat(save(user, body + ("retrievedAt" to "2026-10-07T13:00:00Z"))).isEqualTo(id)
  mvc.perform(get("$path/$id").with(caller(user))).andExpect(status().isOk).andExpect(jsonPath("$.content.text").value(body["text"])).andExpect(jsonPath("$.content.requirements[0].label").value("Kotlin"))
  val changed = save(user, body + ("requirements" to emptyList<Any>()))
  assertThat(changed).isNotEqualTo(id)
  mvc.perform(get(path).with(caller(user))).andExpect(jsonPath("$.length()").value(2))
  mvc.perform(delete("$path/$changed").with(caller(user)).with(csrf())).andExpect(status().isNoContent)
  mvc.perform(get("$path/$changed").with(caller(user))).andExpect(status().isNotFound)
  mvc.perform(get("$path/$id").with(caller(user))).andExpect(status().isOk)
  verifyNoInteractions(ai)
 }
 @Test fun `partial results with many omitted items can still be saved and reopened`() {
  val user = profile(); val id = save(user, content() + ("omittedItems" to 188))
  mvc.perform(get("$path/$id").with(caller(user))).andExpect(status().isOk)
   .andExpect(jsonPath("$.content.omittedItems").value(188)).andExpect(jsonPath("$.content.requirements[0].label").value("Kotlin"))
  verifyNoInteractions(ai)
 }
 @Test fun `subjects issuers anonymous requests CSRF and ownership injection cannot access other saved jobs`() {
  val user = profile(); val other = profile(); profile(user, "https://other.example.test"); val id = save(user)
  mvc.perform(get(path)).andExpect(status().isUnauthorized)
  mvc.perform(post(path).with(caller(user)).contentType("application/json").content(json.writeValueAsString(content()))).andExpect(status().isForbidden)
  for ((subject, issuer) in listOf(other to "https://identity.example.test", user to "https://other.example.test")) {
   mvc.perform(get(path).with(caller(subject, issuer))).andExpect(jsonPath("$").isEmpty)
   mvc.perform(get("$path/$id").with(caller(subject, issuer))).andExpect(status().isNotFound)
   mvc.perform(delete("$path/$id").with(caller(subject, issuer)).with(csrf())).andExpect(status().isNotFound)
  }
  mvc.perform(post(path).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(content() + ("ownerId" to other)))).andExpect(status().isBadRequest)
  verifyNoInteractions(ai)
 }
 @Test fun `unsupported evidence dangerous source URLs invalid limits and missing profiles are rejected`() {
  val user = profile()
  for (invalid in listOf(content() + ("sourceUrl" to "javascript:alert(1)"), content() + ("text" to "x".repeat(15001)), content() + ("requirements" to listOf(mapOf("label" to "Kafka", "kind" to "REQUIRED", "quote" to "Invented Kafka experience"))), content() + ("sourceType" to "VERIFIED_ORIGINAL"))) {
   mvc.perform(post(path).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(invalid))).andExpect(status().isBadRequest).andExpect(jsonPath("$.code").value("SAVED_JOB_INVALID"))
  }
  mvc.perform(post(path).with(caller(UUID.randomUUID().toString())).with(csrf()).contentType("application/json").content(json.writeValueAsString(content()))).andExpect(status().isNotFound).andExpect(jsonPath("$.code").value("PROFILE_NOT_CREATED"))
  verifyNoInteractions(ai)
 }

 @Test fun `saved personal answer retries reuse identity and rematching includes the answer association`() {
  val user=profile(); val job=save(user)
  val body=mapOf("skill" to "Kotlin", "statement" to "Built APIs using Kotlin", "context" to "Fictional project", "sourceNote" to "User clarification for job $job; requirement 0")
  fun create()=mvc.perform(post("/api/profile/me/claims").with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isOk).andReturn().response.contentAsString
  val first=json.readTree(create()); val id=first["id"].asText()
  assertThat(json.readTree(create())["id"].asText()).isEqualTo(id)
  mvc.perform(post("/api/profile/me/claims/$id/review").with(caller(user)).with(csrf()).contentType("application/json").content("""{"revision":1,"decision":"CONFIRM"}""")).andExpect(status().isOk)
  val retried=json.readTree(create()); assertThat(retried["revision"].asInt()).isEqualTo(2); assertThat(retried["status"].asText()).isEqualTo("CONFIRMED")
  `when`(ai.generateJson(anyString(),anyString(),anyMap(),(any(com.careeragent.ai.application.AiTask::class.java) ?: com.careeragent.ai.application.AiTask.PERSONAL_MATCH))).thenAnswer { invocation ->
   val input=json.readTree(invocation.getArgument<String>(1))
   assertThat(input["userClarifications"][0]["requirementIndex"].asInt()).isZero()
   assertThat(input["userClarifications"][0]["claimIds"][0].asText()).isEqualTo(id)
   assertThat(input["candidatePassages"][0]["statement"].asText()).isEqualTo(body["statement"])
   output(id)
  }
  repeat(2) { mvc.perform(post("$path/$job/match").with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(matchInput(id)))).andExpect(status().isOk).andExpect(jsonPath("$.assessments[0].classification").value("STRONG")) }
  mvc.perform(get("/api/profile/me/claims").with(caller(user))).andExpect(jsonPath("$.length()").value(1))
  mvc.perform(post("/api/profile/me/claims/$id/review").with(caller(user)).with(csrf()).contentType("application/json").content("""{"revision":2,"decision":"REJECT"}""")).andExpect(status().isOk)
  mvc.perform(post("/api/profile/me/claims").with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isConflict)
  verify(ai,times(2)).generateJson(anyString(),anyString(),anyMap(),(any(com.careeragent.ai.application.AiTask::class.java) ?: com.careeragent.ai.application.AiTask.PERSONAL_MATCH))
 }
 @Test fun `twenty criteria survive storage full matching and incomplete provider responses without fake questions`() {
  val user=profile(); val claimant=claim(user)
  val quotes=(0 until 20).map { "Criterion $it requires API experience." }
  val requirements=quotes.mapIndexed { index,quote -> mapOf("label" to "API criterion $index","kind" to "REQUIRED","quote" to quote) }
  val source=quotes.joinToString("\n")
  val job=save(user,content() + mapOf("text" to source,"requirements" to requirements))
  mvc.perform(get("$path/$job").with(caller(user))).andExpect(jsonPath("$.content.requirements.length()").value(20)).andExpect(jsonPath("$.content.requirements[19].label").value("API criterion 19"))
  `when`(ai.generateJson(anyString(),anyString(),anyMap(),(any(com.careeragent.ai.application.AiTask::class.java) ?: com.careeragent.ai.application.AiTask.PERSONAL_MATCH))).thenAnswer { invocation ->
   val input=json.readTree(invocation.getArgument<String>(1)); assertThat(input["requirements"].size()).isEqualTo(20); assertThat(input["requirements"][19]["quote"].asText()).isEqualTo(quotes.last())
   json.writeValueAsString(mapOf("assessments" to listOf(mapOf("requirementIndex" to 19,"classification" to "STRONG","reason" to "Literal API contribution","evidenceRelation" to "DIRECT","requirementNature" to "PRACTICAL","evidence" to listOf(mapOf("claimId" to claimant,"quote" to "Built APIs using Kotlin")),"question" to ""))))
  }
  mvc.perform(post("$path/$job/match").with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(matchInput(claimant)+("text" to source)))).andExpect(status().isOk).andExpect(jsonPath("$.assessments.length()").value(20)).andExpect(jsonPath("$.assessments[19].evaluated").value(true)).andExpect(jsonPath("$.assessments[0].evaluated").value(false)).andExpect(jsonPath("$.assessments[0].question").value(""))
  mvc.perform(get("$path/$job/match").with(caller(user))).andExpect(jsonPath("$.analysis.assessments[19].classification").value("STRONG")).andExpect(jsonPath("$.analysis.assessments[19].evidenceRelation").value("DIRECT")).andExpect(jsonPath("$.analysis.assessments[19].requirementNature").value("PRACTICAL")).andExpect(jsonPath("$.analysis.assessments[0].evaluated").value(false))
 }

 private fun claim(user: String, confirmed: Boolean = true, suffix: String = "", skill: String = "Kotlin"): String {
  val statement=(if(confirmed) "Built APIs using Kotlin" else "Proposed APIs using Kotlin") + suffix
  val r = mvc.perform(post("/api/profile/me/claims").with(caller(user)).with(csrf()).contentType("application/json").content("""{"skill":"$skill","statement":"$statement","context":"Fictional project","sourceNote":"User statement"}""")).andExpect(status().isOk).andReturn()
  val id = json.readTree(r.response.contentAsString)["id"].asText()
  if (confirmed) mvc.perform(post("/api/profile/me/claims/$id/review").with(caller(user)).with(csrf()).contentType("application/json").content("""{"revision":1,"decision":"CONFIRM"}""")).andExpect(status().isOk)
  return id
 }
 private fun matchInput(claim: String, consent: Boolean = true, revision: Int = 2) = mapOf("text" to content()["text"], "claims" to listOf(mapOf("id" to claim,"revision" to revision)), "locale" to "nb", "consent" to consent)
 private fun output(claim: String) = json.writeValueAsString(mapOf("assessments" to listOf(mapOf("requirementIndex" to 0,"classification" to "STRONG","reason" to "Bekreftet Kotlin-bidrag er relevant.","evidence" to listOf(mapOf("claimId" to claim,"quote" to "Built APIs using Kotlin")),"question" to ""))))
 @Test fun `personal matching requires separate approval and only selected confirmed owned revisions reach the model`() {
  val user = profile(); val id = save(user); val claim = claim(user); val pending = claim(user, false); val other = profile(); val foreign = claim(other)
  val match = "$path/$id/match"
  mvc.perform(get(match).with(caller(user))).andExpect(jsonPath("$.analysis").isEmpty)
  mvc.perform(post(match).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(matchInput(claim, false)))).andExpect(status().isBadRequest)
  mvc.perform(post(match).with(caller(user)).contentType("application/json").content(json.writeValueAsString(matchInput(claim)))).andExpect(status().isForbidden)
  mvc.perform(post(match).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(matchInput(pending, revision=1)))).andExpect(status().isConflict)
  mvc.perform(post(match).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(matchInput(foreign)))).andExpect(status().isBadRequest)
  mvc.perform(get(match).with(caller(other))).andExpect(status().isNotFound)
  verifyNoInteractions(ai)
  `when`(ai.generateJson(anyString(), anyString(), anyMap(), (any(com.careeragent.ai.application.AiTask::class.java) ?: com.careeragent.ai.application.AiTask.PERSONAL_MATCH))).thenAnswer { invocation ->
   val sent = json.readTree(invocation.getArgument<String>(1))
   assertThat(sent["confirmedClaims"].size()).isEqualTo(1)
   assertThat(sent["confirmedClaims"][0]["id"].asText()).isEqualTo(claim)
   assertThat(sent["confirmedClaims"][0].has("sourceNote")).isFalse()
   assertThat(sent.has("displayName")).isFalse()
   output(claim)
  }
  mvc.perform(post(match).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(matchInput(claim)))).andExpect(status().isOk).andExpect(jsonPath("$.assessments[0].classification").value("STRONG")).andExpect(jsonPath("$.stale").value(false))
  mvc.perform(get(match).with(caller(user))).andExpect(jsonPath("$.analysis.claims[0].revision").value(2)).andExpect(jsonPath("$.analysis.assessments[0].evidence[0].claimId").value(claim))
  verify(ai, times(1)).generateJson(anyString(),anyString(),anyMap(),(any(com.careeragent.ai.application.AiTask::class.java) ?: com.careeragent.ai.application.AiTask.PERSONAL_MATCH))
  mvc.perform(get("/api/profile/me/claims").with(caller(user))).andExpect(jsonPath("$.length()").value(2))
 }
 @Test fun `evidence changes during matching cannot publish stale results and reopening marks prior result stale`() {
  val user = profile(); val id = save(user); val claim = claim(user); val path = "$path/$id/match"; val input = json.writeValueAsString(matchInput(claim))
  `when`(ai.generateJson(anyString(),anyString(),anyMap(),(any(com.careeragent.ai.application.AiTask::class.java) ?: com.careeragent.ai.application.AiTask.PERSONAL_MATCH))).thenReturn(output(claim))
  val first = mvc.perform(post(path).with(caller(user)).with(csrf()).contentType("application/json").content(input)).andExpect(status().isOk).andReturn()
  val firstId = json.readTree(first.response.contentAsString)["id"].asText()
  `when`(ai.generateJson(anyString(),anyString(),anyMap(),(any(com.careeragent.ai.application.AiTask::class.java) ?: com.careeragent.ai.application.AiTask.PERSONAL_MATCH))).thenAnswer {
   jdbc.update("UPDATE competency_claim SET revision = revision + 1, status = 'UNVERIFIED', confirmation_basis = 'NONE' WHERE id = ?::uuid",claim)
   output(claim)
  }
  mvc.perform(post(path).with(caller(user)).with(csrf()).contentType("application/json").content(input)).andExpect(status().isConflict).andExpect(jsonPath("$.code").value("MATCH_CONFLICT"))
  mvc.perform(get(path).with(caller(user))).andExpect(jsonPath("$.analysis.id").value(firstId)).andExpect(jsonPath("$.analysis.stale").value(true))
 }
 @Test fun `all 35 confirmed contributions are included and a newly confirmed claim invalidates the snapshot`() {
  val user = profile(); val job = save(user)
  val ids = (1..35).map { claim(user, suffix=". " + "Fictional delivery. ".repeat(25), skill="Skill $it") }
  val input = matchInput(ids.first()) + ("claims" to ids.map { mapOf("id" to it, "revision" to 2) })
  val endpoint = "$path/$job/match"
  mvc.perform(post(endpoint).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(matchInput(ids.first())))).andExpect(status().isConflict)
  verifyNoInteractions(ai)
  `when`(ai.generateJson(anyString(),anyString(),anyMap(),(any(com.careeragent.ai.application.AiTask::class.java) ?: com.careeragent.ai.application.AiTask.PERSONAL_MATCH))).thenAnswer { invocation ->
   val packed = json.readTree(invocation.getArgument<String>(1))
   assertThat(packed["confirmedClaims"].size()).isEqualTo(35)
   assertThat(packed["candidatePassages"].size()).isEqualTo(1)
   assertThat(packed["confirmedClaims"].map { it["id"].asText() }).containsExactlyInAnyOrderElementsOf(ids)
   output(ids.last())
  }
  mvc.perform(post(endpoint).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(input)))
   .andExpect(status().isOk).andExpect(jsonPath("$.claims.length()").value(35))
   .andExpect(jsonPath("$.automaticEvidence").value(true))
   .andExpect(jsonPath("$.assessments[0].evidence[0].claimId").value(ids.last()))
  val stored = mvc.perform(get(endpoint).with(caller(user))).andExpect(status().isOk).andExpect(jsonPath("$.analysis.stale").value(false)).andReturn()
  assertThat(json.readTree(stored.response.contentAsString)["analysis"]["inputCharacters"].asInt()).isGreaterThan(12000)
  claim(user)
  mvc.perform(get(endpoint).with(caller(user))).andExpect(jsonPath("$.analysis.stale").value(true))
  mvc.perform(post(endpoint).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(input))).andExpect(status().isConflict)
  verify(ai,times(1)).generateJson(anyString(),anyString(),anyMap(),(any(com.careeragent.ai.application.AiTask::class.java) ?: com.careeragent.ai.application.AiTask.PERSONAL_MATCH))
 }
 @Test fun `joined source match and tailoring preserves originals and enforces owner consent CSRF and revisions`() {
  val user=profile();val other=profile();val job=save(user);val claim=claim(user)
  val cvText="Fictional engineer\n\nBuilt APIs using Kotlin for a fictional project and operated reliable services."
  val upload=org.springframework.mock.web.MockMultipartFile("file","fictional-cv.txt","text/plain",cvText.toByteArray())
  val source=mvc.perform(multipart("/api/profile/me/documents").file(upload).param("language","nb").with(caller(user)).with(csrf())).andExpect(status().isOk).andReturn()
  val documentId=json.readTree(source.response.contentAsString)["id"].asText()
  val task=com.careeragent.ai.application.AiTask.PERSONAL_MATCH
  `when`(ai.generateJson(anyString(),anyString(),anyMap(),eq(task) ?: task)).thenReturn(output(claim))
  val assessment=mvc.perform(post("$path/$job/match").with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(matchInput(claim)))).andExpect(status().isOk).andReturn()
  val matchId=json.readTree(assessment.response.contentAsString)["id"].asText()
  clearInvocations(ai)
  val tailoring=com.careeragent.ai.application.AiTask.CV_TAILORING
  val approval=com.careeragent.ai.application.AiRouting().preview(tailoring).token
  val input=mapOf("documentId" to documentId,"text" to cvText,"matchId" to matchId,"locale" to "nb","consent" to true,"aiApproval" to approval)
  val endpoint="$path/$job/tailoring"
  fun send(subject:String,body:Map<String,Any> = input)=mvc.perform(post(endpoint).with(caller(subject)).with(csrf()).contentType("application/json").content(json.writeValueAsString(body)))
  send(other).andExpect(status().isNotFound)
  send(user,input+("consent" to false)).andExpect(status().isBadRequest)
  send(user,input+("ownerId" to other)).andExpect(status().isBadRequest)
  mvc.perform(post(endpoint).with(caller(user)).contentType("application/json").content(json.writeValueAsString(input))).andExpect(status().isForbidden)
  mvc.perform(post(endpoint).with(csrf()).contentType("application/json").content(json.writeValueAsString(input))).andExpect(status().isUnauthorized)
  verifyNoInteractions(ai)
  val generated=json.writeValueAsString(mapOf(
   "proposals" to listOf(mapOf("paragraphIndex" to 1,"newText" to "Utviklet Kotlin-API-er for et fiktivt prosjekt.","reason" to "Synliggjør dokumentert API-erfaring.","claimIds" to listOf(claim),"requirementIndexes" to listOf(0))),
   "visibility" to listOf(mapOf("requirementIndex" to 0,"status" to "VISIBLE","reason" to "Dokumentert API-bidrag er synlig.","claimIds" to listOf(claim),"passages" to listOf(mapOf("paragraphIndex" to 1,"quote" to "Built APIs using Kotlin"))))
  ))
  `when`(ai.generateJson(anyString(),anyString(),anyMap(),eq(tailoring) ?: tailoring)).thenAnswer { invocation ->
   val sent=json.readTree(invocation.getArgument<String>(1))
   assertThat(sent["baseParagraphs"].map {it["text"].asText()}).containsExactly("Fictional engineer",cvText.substringAfter("\n\n"))
   assertThat(sent["jobAndEvidence"]["confirmedClaims"].size()).isEqualTo(1)
   generated
  }
  send(user).andExpect(status().isOk).andExpect(header().string("Cache-Control","no-store"))
   .andExpect(jsonPath("$.proposals[0].oldText").value(cvText.substringAfter("\n\n"))).andExpect(jsonPath("$.provider").value("Groq"))
   .andExpect(jsonPath("$.visibility[0].status").value("VISIBLE")).andExpect(jsonPath("$.visibility[0].passages[0].quote").value("Built APIs using Kotlin"))
  mvc.perform(get("/api/profile/me/documents/$documentId").with(caller(user))).andExpect(jsonPath("$.text").value(cvText))
  mvc.perform(get("/api/profile/me/cvs").with(caller(user))).andExpect(jsonPath("$.length()").value(0))
  mvc.perform(post("/api/profile/me/claims/$claim/review").with(caller(user)).with(csrf()).contentType("application/json").content("""{"decision":"REJECT","revision":2}""")).andExpect(status().isOk)
  send(user).andExpect(status().isConflict).andExpect(jsonPath("$.code").value("CV_SOURCE_CONFLICT"))
  verify(ai,times(1)).generateJson(anyString(),anyString(),anyMap(),eq(tailoring) ?: tailoring)
 }
 companion object {
  @Container @JvmStatic val postgres = PostgreSQLContainer<Nothing>("postgres@sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826")
  @DynamicPropertySource @JvmStatic fun database(registry: DynamicPropertyRegistry) { registry.add("spring.datasource.url", postgres::getJdbcUrl); registry.add("spring.datasource.username", postgres::getUsername); registry.add("spring.datasource.password", postgres::getPassword) }
 }
}
