package com.careeragent.profile

import com.careeragent.profile.application.*
import com.careeragent.documents.application.*
import com.careeragent.documents.domain.*
import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.Mockito.`when`
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.time.OffsetDateTime
import java.time.Instant
import java.util.UUID

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("persistence") @Testcontainers
class PresentationIntegrationTest {
 @Autowired lateinit var mvc:MockMvc
 @Autowired lateinit var profiles:ProfileService
 @Autowired lateinit var presentation:PresentationService
 @Autowired lateinit var json:ObjectMapper
 @MockitoBean lateinit var workflows:DocumentAnalysisWorkflow
 private val issuer="https://identity.example.test"
 private fun caller(subject:String)=oidcLogin().idToken {it.issuer(issuer).subject(subject).audience(listOf("career-agent")).issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(600))}
 @Test fun `selected wording survives new analysis and validates owner source and exact revisions`() {
  val subject=UUID.randomUUID().toString();val identity=VerifiedIdentity(issuer,subject);profiles.save(identity,"Fictional Pilot","nb",0)
  val document=UUID.randomUUID();val runId=UUID.randomUUID()
  val item=ProfileSummaryDraft("PROFILE","Fictional API experience",document,"Built fictional APIs")
  val analysis=DocumentAnalysis(UUID.randomUUID(),"nb","Gemini",emptyList(),emptyList(),100,100,false,0,OffsetDateTime.now(),listOf(AnalysisDocument(document,"synthetic.txt",100,100)),listOf(item))
  val run=DocumentRunState(runId,document.toString(),3,"nb","COMPLETED",emptyMap(),emptyMap(),emptyList(),0,null,null,analysis).view()
  `when`(workflows.load(identity,runId)).thenReturn(run)
  fun input(revision:Int,runRevision:Int=3)=json.writeValueAsString(mapOf("runId" to runId,"runRevision" to runRevision,"index" to 0,"revision" to revision))
  val route="/api/profile/me/presentation"
  mvc.perform(get("$route?locale=nb")).andExpect(status().isUnauthorized)
  mvc.perform(put(route).with(caller(subject)).contentType("application/json").content(input(0))).andExpect(status().isForbidden)
  mvc.perform(put(route).with(caller(subject)).with(csrf()).contentType("application/json").content(input(0))).andExpect(status().isOk).andExpect(jsonPath("$.revision").value(1))
  `when`(workflows.load(identity,runId)).thenReturn(run.copy(revision=4,analysis=analysis.copy(profile=listOf(item.copy(text="New suggested wording")))))
  mvc.perform(get("$route?locale=nb").with(caller(subject))).andExpect(status().isOk).andExpect(jsonPath("$.sections[0].item.text").value(item.text))
  mvc.perform(get("$route?locale=nb").with(caller("other"))).andExpect(status().isOk).andExpect(jsonPath("$.sections.length()").value(0))
  mvc.perform(get("$route?locale=en").with(caller(subject))).andExpect(jsonPath("$.sections.length()").value(0))
  mvc.perform(put(route).with(caller(subject)).with(csrf()).contentType("application/json").content(input(1))).andExpect(status().isConflict)
  mvc.perform(put(route).with(caller(subject)).with(csrf()).contentType("application/json").content(input(0,4))).andExpect(status().isConflict)
  mvc.perform(put(route).with(caller(subject)).with(csrf()).contentType("application/json").content(input(1,4))).andExpect(status().isOk).andExpect(jsonPath("$.sections[0].item.text").value("New suggested wording"))
  `when`(workflows.load(identity,runId)).thenThrow(DocumentFailure("DOCUMENT_ANALYSIS_CONFLICT",409))
  mvc.perform(put(route).with(caller(subject)).with(csrf()).contentType("application/json").content(input(2,4))).andExpect(status().isConflict)
  assertThat(presentation.read(identity,"nb").revision).isEqualTo(2)
  mvc.perform(put(route).with(caller(subject)).with(csrf()).contentType("application/json").content(input(2,4).dropLast(1)+",\"text\":\"Injected wording\"}")).andExpect(status().isBadRequest)
 }
 companion object {
  @Container @JvmStatic val postgres=PostgreSQLContainer<Nothing>("postgres@sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826")
  @DynamicPropertySource @JvmStatic fun database(r:DynamicPropertyRegistry){r.add("spring.datasource.url",postgres::getJdbcUrl);r.add("spring.datasource.username",postgres::getUsername);r.add("spring.datasource.password",postgres::getPassword)}
 }
}
