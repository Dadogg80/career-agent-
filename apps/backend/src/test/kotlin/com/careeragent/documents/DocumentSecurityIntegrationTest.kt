package com.careeragent.documents

import com.careeragent.ai.application.AiModel
import org.mockito.Mockito.verifyNoInteractions
import org.springframework.test.context.bean.override.mockito.MockitoBean
import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.mock.web.MockMultipartFile
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
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
class DocumentSecurityIntegrationTest {
    @MockitoBean lateinit var ai: AiModel
    @Autowired lateinit var mvc: MockMvc
    @Autowired lateinit var json: ObjectMapper
    @Autowired lateinit var jdbc: JdbcTemplate
    private val path = "/api/profile/me/documents"
    private fun caller(subject: String, issuer: String = "https://identity.example.test") = oidcLogin().idToken { it.issuer(issuer).subject(subject).audience(listOf("career-agent")).issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(600)) }
    private fun profile(subject: String = UUID.randomUUID().toString(), issuer: String = "https://identity.example.test"): String {
        mvc.perform(put("/api/profile/me").with(caller(subject, issuer)).with(csrf()).contentType("application/json").content("""{"displayName":"Synthetic Pilot","preferredLanguage":"nb","revision":0}""")).andExpect(status().isOk)
        return subject
    }
    private fun upload(user: String, name: String = "synthetic.docx", bytes: ByteArray = DocumentFixture.docx("Built APIs with Kotlin")): String {
        val result = mvc.perform(multipart(path).file(MockMultipartFile("file", name, "application/octet-stream", bytes)).param("language", "nb").with(caller(user)).with(csrf()))
            .andExpect(status().isOk).andExpect(header().string("Cache-Control", "no-store")).andExpect(jsonPath("$.ownerId").doesNotExist()).andExpect(jsonPath("$.isMaster").value(false)).andReturn()
        return json.readTree(result.response.contentAsString)["id"].asText()
    }
    @Test fun `originals are private retained unchanged and selectable as master`() {
        val user = profile(); val bytes = DocumentFixture.docx("Built APIs with Kotlin"); val id = upload(user, bytes = bytes)
        mvc.perform(get("$path/$id").with(caller(user))).andExpect(status().isOk).andExpect(jsonPath("$.text").value("Built APIs with Kotlin"))
        val downloaded = mvc.perform(get("$path/$id/original").with(caller(user))).andExpect(status().isOk).andExpect(header().string("X-Content-Type-Options", "nosniff")).andReturn()
        assertThat(downloaded.response.contentAsByteArray).isEqualTo(bytes)
        verifyNoInteractions(ai)
        assertThat(downloaded.response.getHeader("Content-Disposition")).startsWith("attachment;")
        mvc.perform(post("$path/$id/master").with(caller(user)).with(csrf())).andExpect(status().isOk).andExpect(jsonPath("$.isMaster").value(true))
        val second = upload(user, "synthetic.pdf", DocumentFixture.pdf())
        mvc.perform(post("$path/$second/master").with(caller(user)).with(csrf())).andExpect(status().isOk)
        mvc.perform(get("$path/$id").with(caller(user))).andExpect(jsonPath("$.document.isMaster").value(false))
    }
    @Test fun `source quotes create unverified owned claims with revision provenance and invalid quotations fail`() {
        val user = profile(); val id = upload(user)
        val payload = """{"skill":"Kotlin","statement":"Built APIs","context":"Synthetic project","quote":"Built APIs with Kotlin"}"""
        val result = mvc.perform(post("$path/$id/claims").with(caller(user)).with(csrf()).contentType("application/json").content(payload)).andExpect(status().isOk)
            .andExpect(jsonPath("$.status").value("UNVERIFIED")).andExpect(jsonPath("$.sourceDocumentId").value(id)).andExpect(jsonPath("$.sourceQuote").value("Built APIs with Kotlin")).andReturn()
        val claim = json.readTree(result.response.contentAsString)["id"].asText()
        mvc.perform(get("/api/profile/me/claims/$claim/history").with(caller(user))).andExpect(jsonPath("$.items[0].sourceDocumentId").value(id))
        mvc.perform(post("$path/$id/claims").with(caller(user)).with(csrf()).contentType("application/json").content(payload.replace("Built APIs with Kotlin", "Invented Kafka experience"))).andExpect(status().isBadRequest).andExpect(jsonPath("$.code").value("DOCUMENT_QUOTE_INVALID"))
        mvc.perform(delete("$path/$id").with(caller(user)).with(csrf())).andExpect(status().isNoContent)
        assertThat(Files.exists(storage.resolve("$id.original"))).isFalse()
        mvc.perform(get("$path/$id/original").with(caller(user))).andExpect(status().isNotFound)
        mvc.perform(get("/api/profile/me/claims/$claim/history").with(caller(user))).andExpect(jsonPath("$.items[0].sourceDocumentId").doesNotExist()).andExpect(jsonPath("$.items[0].sourceQuote").value("Built APIs with Kotlin"))
    }
    @Test fun `different subjects and issuers cannot read download select delete or create claims from another document`() {
        val user = profile(); val id = upload(user); val other = profile(); profile(user, "https://other.example.test")
        for ((subject, issuer) in listOf(other to "https://identity.example.test", user to "https://other.example.test")) {
            mvc.perform(get(path).with(caller(subject, issuer))).andExpect(jsonPath("$").isEmpty)
            mvc.perform(get("$path/$id").with(caller(subject, issuer))).andExpect(status().isNotFound)
            mvc.perform(get("$path/$id/original").with(caller(subject, issuer))).andExpect(status().isNotFound)
            mvc.perform(post("$path/$id/master").with(caller(subject, issuer)).with(csrf())).andExpect(status().isNotFound)
            mvc.perform(delete("$path/$id").with(caller(subject, issuer)).with(csrf())).andExpect(status().isNotFound)
            mvc.perform(post("$path/$id/claims").with(caller(subject, issuer)).with(csrf()).contentType("application/json").content("""{"skill":"Kotlin","statement":"Built APIs","context":"Synthetic","quote":"Built APIs with Kotlin"}""")).andExpect(status().isNotFound)
        }
    }
    @Test fun `authentication CSRF file validation and ownership injection fail closed`() {
        val user = profile(); val id = upload(user)
        mvc.perform(get(path)).andExpect(status().isUnauthorized)
        mvc.perform(get("$path/$id/original")).andExpect(status().isUnauthorized)
        mvc.perform(multipart(path).file(MockMultipartFile("file", "test.docx", "application/octet-stream", DocumentFixture.docx("Kotlin"))).param("language", "nb").with(caller(user))).andExpect(status().isForbidden)
        for (request in listOf(post("$path/$id/master"), post("$path/$id/claims"), delete("$path/$id"))) mvc.perform(request.with(caller(user))).andExpect(status().isForbidden)
        for ((name, bytes, code) in listOf(Triple("../../cv.docx", DocumentFixture.docx("Kotlin"), "DOCUMENT_INVALID"), Triple("test.exe", byteArrayOf(1), "DOCUMENT_TYPE"), Triple("test.pdf", "not PDF".toByteArray(), "DOCUMENT_INVALID"), Triple("huge.pdf", ByteArray(5242881), "DOCUMENT_TOO_LARGE"))) {
            mvc.perform(multipart(path).file(MockMultipartFile("file", name, "application/octet-stream", bytes)).param("language", "nb").with(caller(user)).with(csrf())).andExpect(jsonPath("$.code").value(code))
        }
        mvc.perform(post("$path/$id/claims").with(caller(user)).with(csrf()).contentType("application/json").content("""{"skill":"Kotlin","statement":"Built APIs","context":"Synthetic","quote":"Built APIs with Kotlin","status":"CONFIRMED"}""")).andExpect(status().isBadRequest)
    }
    companion object {
        val storage = Files.createTempDirectory("career-documents-test-")
        @Container @JvmStatic val postgres = PostgreSQLContainer<Nothing>("postgres@sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826")
        @DynamicPropertySource @JvmStatic fun database(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl); registry.add("spring.datasource.username", postgres::getUsername); registry.add("spring.datasource.password", postgres::getPassword); registry.add("DOCUMENT_STORAGE_PATH") { storage.toString() }
        }
    }
}
