package com.careeragent.profile

import com.careeragent.ai.application.AiModel
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Test
import org.mockito.Mockito.verifyNoInteractions
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
class CareerEntryIntegrationTest {
 @Autowired lateinit var mvc:MockMvc
 @Autowired lateinit var json:ObjectMapper
 @MockitoBean lateinit var ai:AiModel
 private val path="/api/profile/me/entries"
 private fun caller(subject:String,issuer:String="https://identity.example.test")=oidcLogin().idToken{it.issuer(issuer).subject(subject).audience(listOf("career-agent")).issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(600))}
 private fun profile(subject:String=UUID.randomUUID().toString(),issuer:String="https://identity.example.test"):String {mvc.perform(put("/api/profile/me").with(caller(subject,issuer)).with(csrf()).contentType("application/json").content("""{"displayName":"Fictional Pilot","preferredLanguage":"nb","revision":0}""")).andExpect(status().isOk);return subject}
 private fun content()=mapOf("kind" to "EMPLOYMENT","title" to "Developer","organization" to "Example AS","client" to "Example Client","deliveryRole" to "API developer","startMonth" to "2020-01","endMonth" to null,"ongoing" to true,"description" to "Built APIs using Kotlin","sourceNote" to "Own statement")
 private fun create(user:String):String {val r=mvc.perform(post(path).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(mapOf("content" to content())))).andExpect(status().isOk).andExpect(jsonPath("$.status").value("UNVERIFIED")).andExpect(jsonPath("$.ownerId").doesNotExist()).andReturn();return json.readTree(r.response.contentAsString)["id"].asText()}
 @Test fun `career history distinguishes employer client actual role and dates with explicit confirmation edit reset and history`() {
  val user=profile();val id=create(user)
  mvc.perform(post("$path/$id/review").with(caller(user)).with(csrf()).contentType("application/json").content("""{"revision":1,"decision":"CONFIRM"}""")).andExpect(status().isOk).andExpect(jsonPath("$.status").value("CONFIRMED")).andExpect(jsonPath("$.revision").value(2))
  mvc.perform(put("$path/$id").with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(mapOf("content" to (content()+("deliveryRole" to "Integration developer")),"revision" to 2)))).andExpect(status().isOk).andExpect(jsonPath("$.status").value("UNVERIFIED")).andExpect(jsonPath("$.content.organization").value("Example AS")).andExpect(jsonPath("$.content.client").value("Example Client"))
  mvc.perform(get("$path/$id/history").with(caller(user))).andExpect(jsonPath("$.length()").value(3)).andExpect(jsonPath("$[1].status").value("CONFIRMED"))
  mvc.perform(post("$path/$id/review").with(caller(user)).with(csrf()).contentType("application/json").content("""{"revision":2,"decision":"CONFIRM"}""")).andExpect(status().isConflict)
  mvc.perform(delete("$path/$id").with(caller(user)).with(csrf()).contentType("application/json").content("""{"revision":3}""")).andExpect(status().isNoContent)
  mvc.perform(get("$path/$id/history").with(caller(user))).andExpect(status().isNotFound)
  verifyNoInteractions(ai)
 }
 @Test fun `history ownership CSRF status injection and issuer boundaries are enforced`() {
  val user=profile();val other=profile();profile(user,"https://other.example.test");val id=create(user)
  mvc.perform(get(path)).andExpect(status().isUnauthorized)
  mvc.perform(post(path).with(caller(user)).contentType("application/json").content(json.writeValueAsString(mapOf("content" to content())))).andExpect(status().isForbidden)
  for((subject,issuer) in listOf(other to "https://identity.example.test",user to "https://other.example.test")) {
   mvc.perform(get(path).with(caller(subject,issuer))).andExpect(jsonPath("$").isEmpty)
   mvc.perform(get("$path/$id/history").with(caller(subject,issuer))).andExpect(status().isNotFound)
   mvc.perform(post("$path/$id/review").with(caller(subject,issuer)).with(csrf()).contentType("application/json").content("""{"revision":1,"decision":"CONFIRM"}""")).andExpect(status().isNotFound)
  }
  mvc.perform(post(path).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(mapOf("content" to content(),"ownerId" to other)))).andExpect(status().isBadRequest)
  val spoofed = json.writeValueAsString(mapOf("content" to (content() + ("status" to "CONFIRMED"))))
  mvc.perform(post(path).with(caller(user)).with(csrf()).contentType("application/json").content(spoofed)).andExpect(status().isBadRequest)
  verifyNoInteractions(ai)
 }
 @Test fun `invalid periods and control content cannot become career entries while unknown dates are preserved`() {
  val user=profile()
  for(c in listOf(content()+("endMonth" to "2019-01")+("ongoing" to false),content()+("startMonth" to "2020-99"),content()+("endMonth" to "2021-01"),content()+("title" to "Bad\u0000title"))) mvc.perform(post(path).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(mapOf("content" to c)))).andExpect(status().isBadRequest)
  mvc.perform(post(path).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(mapOf("content" to (content()+("startMonth" to null)+("ongoing" to false)))))).andExpect(status().isOk).andExpect(jsonPath("$.content.startMonth").isEmpty).andExpect(jsonPath("$.content.endMonth").isEmpty)
 }
 companion object {
  @Container @JvmStatic val postgres=PostgreSQLContainer<Nothing>("postgres@sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826")
  @DynamicPropertySource @JvmStatic fun database(r:DynamicPropertyRegistry){r.add("spring.datasource.url",postgres::getJdbcUrl);r.add("spring.datasource.username",postgres::getUsername);r.add("spring.datasource.password",postgres::getPassword)}
 }
}
