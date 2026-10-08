package com.careeragent.applications

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
import java.nio.file.Files
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("persistence")
@Testcontainers
class ApplicationIntegrationTest {
 @Autowired lateinit var mvc:MockMvc
 @Autowired lateinit var json:ObjectMapper
 @MockitoBean lateinit var ai:AiModel
 private val path="/api/profile/me/applications"
 private fun caller(user:String)=oidcLogin().idToken {it.issuer("https://identity.example.test").subject(user).audience(listOf("career-agent")).issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(600))}
 private fun profile():String{val user=UUID.randomUUID().toString();write(user,"/api/profile/me","""{"displayName":"Fictional Pilot","preferredLanguage":"nb","revision":0}""","PUT");return user}
 private fun write(user:String,url:String,body:String,method:String="POST"):String {val request=if(method=="PUT")put(url) else post(url);return mvc.perform(request.with(caller(user)).with(csrf()).contentType("application/json").content(body)).andExpect(status().isOk).andReturn().response.contentAsString}
 private fun job(user:String):String{val title="Fictional developer "+UUID.randomUUID();val v=write(user,"/api/profile/me/jobs","""{"title":"$title","sourceUrl":null,"sourceType":"PASTED_TEXT","text":"We need a developer to build APIs using Kotlin and PostgreSQL.","locale":"en","requirements":[],"facts":[],"omittedItems":0,"retrievedAt":null}""");return json.readTree(v)["id"].asText()}
 private fun cv(user:String,job:String):String{
  val c=json.readTree(write(user,"/api/profile/me/claims","""{"skill":"Kotlin","statement":"Built Kotlin APIs","context":"Example employer","sourceNote":"Own statement"}"""))["id"].asText();write(user,"/api/profile/me/claims/$c/review","""{"decision":"CONFIRM","revision":1}""")
  val v=json.readTree(write(user,"/api/profile/me/cvs",json.writeValueAsString(mapOf("title" to "Fictional CV","locale" to "en","identity" to mapOf("name" to "Fictional Pilot","headline" to "","email" to "","phone" to "","location" to "","summary" to ""),"claims" to listOf(mapOf("id" to c,"revision" to 2)),"entries" to emptyList<Any>(),"jobId" to job))))["id"].asText();write(user,"/api/profile/me/cvs/$v/approve","""{"revision":1,"approved":true}""");return v
 }
 private fun create(user:String,job:String)=json.readTree(write(user,path,"""{"jobId":"$job"}"""))
 @Test fun `recorded submissions preserve exact approved materials and status history with owner isolation`() {
  val user=profile();val other=profile();val job=job(user);val cv=cv(user,job);val initial=create(user,job);val id=initial["id"].asText()
  org.junit.jupiter.api.Assertions.assertEquals(id,create(user,job)["id"].asText())
  mvc.perform(post(path).with(caller(other)).with(csrf()).contentType("application/json").content("""{"jobId":"$job"}""")).andExpect(status().isConflict)
  val sent=mapOf("status" to "APPLIED","cvVersionId" to cv,"appliedOn" to LocalDate.now().toString(),"nextFollowUpOn" to null,"contactName" to "Kari Test","contactEmail" to "kari@example.test","contactPhone" to "","notes" to "Follow up next week","applicationText" to "My submitted text")
  val body=json.writeValueAsString(mapOf("content" to sent,"revision" to 1))
  mvc.perform(put("$path/$id").with(caller(user)).contentType("application/json").content(body)).andExpect(status().isForbidden)
  mvc.perform(put("$path/$id").with(caller(other)).with(csrf()).contentType("application/json").content(body)).andExpect(status().isNotFound)
  write(user,"$path/$id",body,"PUT")
  mvc.perform(get(path).with(caller(user))).andExpect(jsonPath("$[0].content.cvVersionId").value(cv)).andExpect(jsonPath("$[0].history.length()").value(2)).andExpect(jsonPath("$[0].history[1].status").value("APPLIED"))
  mvc.perform(get(path).with(caller(other))).andExpect(jsonPath("$.length()").value(0))
  mvc.perform(put("$path/$id").with(caller(user)).with(csrf()).contentType("application/json").content(body)).andExpect(status().isConflict)
  mvc.perform(put("$path/$id").with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(mapOf("content" to sent+("applicationText" to "Changed submission"),"revision" to 2)))).andExpect(status().isConflict).andExpect(jsonPath("$.code").value("APPLICATION_MATERIALS_LOCKED"))
  write(user,"$path/$id",json.writeValueAsString(mapOf("content" to sent+mapOf("status" to "INTERVIEW_1","notes" to "Interview arranged"),"revision" to 2)),"PUT")
  mvc.perform(delete("/api/profile/me/cvs/$cv").with(caller(user)).with(csrf()).contentType("application/json").content("""{"revision":2}""")).andExpect(status().isConflict).andExpect(jsonPath("$.code").value("CV_IN_USE"))
  mvc.perform(delete("/api/profile/me/jobs/$job").with(caller(user)).with(csrf())).andExpect(status().isConflict)
  mvc.perform(delete("$path/$id").with(caller(user)).with(csrf()).contentType("application/json").content("""{"revision":3}""")).andExpect(status().isNoContent)
  mvc.perform(get("/api/profile/me/cvs/$cv").with(caller(user))).andExpect(status().isOk);verifyNoInteractions(ai)
 }
 @Test fun `unapproved missing or unrelated materials cannot record application as sent`() {
  val user=profile();val job=job(user);val initial=create(user,job);val id=initial["id"].asText();val content=json.convertValue(initial["content"],Map::class.java)
  mvc.perform(put("$path/$id").with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(mapOf("content" to content+mapOf("status" to "APPLIED"),"revision" to 1)))).andExpect(status().isBadRequest)
  val otherCv=cv(user,job(user));mvc.perform(put("$path/$id").with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(mapOf("content" to content+mapOf("cvVersionId" to otherCv),"revision" to 1)))).andExpect(status().isConflict)
  mvc.perform(get(path)).andExpect(status().isUnauthorized);verifyNoInteractions(ai)
 }
 companion object {
  @Container @JvmStatic val postgres=PostgreSQLContainer<Nothing>("postgres@sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826")
  private val directory=Files.createTempDirectory("career-applications-")
  @DynamicPropertySource @JvmStatic fun properties(r:DynamicPropertyRegistry){r.add("spring.datasource.url",postgres::getJdbcUrl);r.add("spring.datasource.username",postgres::getUsername);r.add("spring.datasource.password",postgres::getPassword);r.add("DOCUMENT_STORAGE_PATH"){directory.toString()}}
 }
}
