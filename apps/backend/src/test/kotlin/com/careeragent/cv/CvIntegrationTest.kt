package com.careeragent.cv

import com.careeragent.ai.application.AiModel
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import com.careeragent.documents.domain.DocumentStorage
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean
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
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("persistence")
@Testcontainers
class CvIntegrationTest {
 @Autowired lateinit var mvc:MockMvc
 @Autowired lateinit var json:ObjectMapper
 @MockitoBean lateinit var ai:AiModel
 @MockitoSpyBean lateinit var storage:DocumentStorage
 private val path="/api/profile/me/cvs"
 private fun caller(subject:String,issuer:String="https://identity.example.test")=oidcLogin().idToken {it.issuer(issuer).subject(subject).audience(listOf("career-agent")).issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(600))}
 private fun profile():String {val user=UUID.randomUUID().toString();mvc.perform(put("/api/profile/me").with(caller(user)).with(csrf()).contentType("application/json").content("""{"displayName":"Fictional Pilot","preferredLanguage":"nb","revision":0}""")).andExpect(status().isOk);return user}
 private fun claim(user:String,confirmed:Boolean=true):String {val result=mvc.perform(post("/api/profile/me/claims").with(caller(user)).with(csrf()).contentType("application/json").content("""{"skill":"Kotlin","statement":"Built APIs using Kotlin","context":"Fictional project","sourceNote":"Own statement"}""")).andExpect(status().isOk).andReturn();val id=json.readTree(result.response.contentAsString)["id"].asText();if(confirmed)mvc.perform(post("/api/profile/me/claims/$id/review").with(caller(user)).with(csrf()).contentType("application/json").content("""{"decision":"CONFIRM","revision":1}""")).andExpect(status().isOk);return id}
 private fun input(claim:String,revision:Int=2)=mapOf("title" to "Fictional CV","locale" to "nb","identity" to mapOf("name" to "Åse Ødegård","headline" to "Utvikler","email" to "ase@example.test","phone" to "","location" to "Oslo","summary" to ""),"claims" to listOf(mapOf("id" to claim,"revision" to revision)),"entries" to emptyList<Any>(),"jobId" to null)
 private fun create(user:String,claim:String):String {val result=mvc.perform(post(path).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(input(claim)))).andExpect(status().isOk).andExpect(jsonPath("$.status").value("DRAFT")).andExpect(jsonPath("$.artifacts.length()").value(0)).andReturn();return json.readTree(result.response.contentAsString)["id"].asText()}
 private fun approve(user:String,id:String)=mvc.perform(post("$path/$id/approve").with(caller(user)).with(csrf()).contentType("application/json").content("""{"revision":1,"approved":true}"""))
 @Test fun `owned CV requires confirmed selections current revision CSRF and explicit approval`() {
  val user=profile();val other=profile();val claim=claim(user,false)
  mvc.perform(post(path).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(input(claim,1)))).andExpect(status().isConflict)
  mvc.perform(post("/api/profile/me/claims/$claim/review").with(caller(user)).with(csrf()).contentType("application/json").content("""{"decision":"CONFIRM","revision":1}""")).andExpect(status().isOk)
  mvc.perform(post(path).with(caller(other)).with(csrf()).contentType("application/json").content(json.writeValueAsString(input(claim)))).andExpect(status().isConflict)
  mvc.perform(post(path).with(caller(user)).contentType("application/json").content(json.writeValueAsString(input(claim)))).andExpect(status().isForbidden)
  val version=create(user,claim)
  mvc.perform(get("$path/$version").with(caller(other))).andExpect(status().isNotFound)
  mvc.perform(get("$path/$version").with(caller(user,"https://different.example.test"))).andExpect(status().isNotFound)
  mvc.perform(get("$path/$version/download/pdf").with(caller(user))).andExpect(status().isConflict)
  mvc.perform(post("$path/$version/approve").with(caller(user)).with(csrf()).contentType("application/json").content("""{"revision":1,"approved":false}""")).andExpect(status().isBadRequest)
  approve(user,version).andExpect(status().isOk).andExpect(jsonPath("$.artifacts.length()").value(2)).andExpect(jsonPath("$.status").value("APPROVED"))
  mvc.perform(get("$path/$version/download/pdf").with(caller(other))).andExpect(status().isNotFound)
  mvc.perform(get(path)).andExpect(status().isUnauthorized);verifyNoInteractions(ai)
 }
 @Test fun `approved artifacts remain immutable after knowledge changes without regeneration`() {
  val user=profile();val claim=claim(user);val version=create(user,claim)
  approve(user,version).andExpect(status().isOk)
  val pdf=mvc.perform(get("$path/$version/download/pdf").with(caller(user))).andExpect(status().isOk).andExpect(header().string("Cache-Control","no-store")).andExpect(header().string("X-Content-Type-Options","nosniff")).andReturn().response.contentAsByteArray
  val docx=mvc.perform(get("$path/$version/download/docx").with(caller(user))).andExpect(status().isOk).andReturn().response.contentAsByteArray
  mvc.perform(put("/api/profile/me/claims/$claim").with(caller(user)).with(csrf()).contentType("application/json").content("""{"skill":"Kotlin","statement":"Different own contribution","context":"Fictional project","sourceNote":"Own statement","revision":2}""")).andExpect(status().isOk)
  assertArrayEquals(pdf,mvc.perform(get("$path/$version/download/pdf").with(caller(user))).andReturn().response.contentAsByteArray)
  assertArrayEquals(docx,mvc.perform(get("$path/$version/download/docx").with(caller(user))).andReturn().response.contentAsByteArray)
  approve(user,version).andExpect(status().isConflict)
  mvc.perform(delete("$path/$version").with(caller(user)).with(csrf()).contentType("application/json").content("""{"revision":2}""")).andExpect(status().isNoContent)
  mvc.perform(get("$path/$version").with(caller(user))).andExpect(status().isNotFound);verifyNoInteractions(ai)
 }
 @Test fun `stale draft cannot approve and invalid inputs never accept client status or claim content`() {
  val user=profile();val claim=claim(user);val version=create(user,claim)
  mvc.perform(post("/api/profile/me/claims/$claim/review").with(caller(user)).with(csrf()).contentType("application/json").content("""{"decision":"REJECT","revision":2}""")).andExpect(status().isOk)
  mvc.perform(get("$path/$version").with(caller(user))).andExpect(jsonPath("$.stale").value(true))
  approve(user,version).andExpect(status().isConflict).andExpect(jsonPath("$.code").value("CV_SOURCE_CONFLICT"))
  mvc.perform(post(path).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(input(claim)+("status" to "APPROVED")))).andExpect(status().isBadRequest)
  mvc.perform(post(path).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(input(claim)+("claims" to listOf(mapOf("id" to claim,"revision" to 3,"statement" to "Invented")))))).andExpect(status().isBadRequest)
  mvc.perform(get("$path/$version/download/other").with(caller(user))).andExpect(status().isBadRequest);verifyNoInteractions(ai)
 }
 @Test fun `failed file deletion remains queued and cleanup requires owner CSRF`() {
  val user=profile();val other=profile();val version=create(user,claim(user));val approved=approve(user,version).andExpect(status().isOk).andReturn()
  val objects=json.readTree(approved.response.contentAsString)["artifacts"].map { UUID.fromString(it["id"].asText()) }
  objects.forEach { doThrow(IllegalStateException("synthetic storage failure")).`when`(storage).delete(it) }
  try {
   mvc.perform(delete("$path/$version").with(caller(user)).with(csrf()).contentType("application/json").content("""{"revision":2}""")).andExpect(status().isNoContent)
   mvc.perform(get("$path/cleanup").with(caller(user))).andExpect(jsonPath("$.remaining").value(2))
   mvc.perform(get("$path/cleanup").with(caller(other))).andExpect(jsonPath("$.remaining").value(0))
   mvc.perform(post("$path/cleanup").with(caller(user))).andExpect(status().isForbidden)
   objects.forEach { doCallRealMethod().`when`(storage).delete(it) }
   mvc.perform(post("$path/cleanup").with(caller(user)).with(csrf())).andExpect(status().isOk).andExpect(jsonPath("$.remaining").value(0))
  } finally { reset(storage) }
 }
 companion object {
  @Container @JvmStatic val postgres=PostgreSQLContainer<Nothing>("postgres@sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826")
  private val directory=Files.createTempDirectory("career-cv-integration-")
  @DynamicPropertySource @JvmStatic fun properties(registry:DynamicPropertyRegistry){registry.add("spring.datasource.url",postgres::getJdbcUrl);registry.add("spring.datasource.username",postgres::getUsername);registry.add("spring.datasource.password",postgres::getPassword);registry.add("DOCUMENT_STORAGE_PATH"){directory.toString()}}
 }
}
