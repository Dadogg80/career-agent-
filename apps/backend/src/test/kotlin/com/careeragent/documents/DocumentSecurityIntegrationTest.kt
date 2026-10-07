package com.careeragent.documents

import com.careeragent.ai.application.AiModel
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.*
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
    @Autowired lateinit var analyses: com.careeragent.documents.application.DocumentAnalysisRepository
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
    @Test fun `rereading existing originals recovers missing sections invalidates stale analysis and preserves claims`() {
        val user = profile(); val other = profile(); val body = "Built APIs with Kotlin for a synthetic project."
        val header = """<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:t>Azure course certificate</w:t></w:r></w:p></w:hdr>"""
        val bytes = DocumentFixture.docx(body, parts=mapOf("word/header1.xml" to header)); val id = upload(user, bytes=bytes)
        // Simulate extraction persisted by the previous main-body-only reader.
        jdbc.update("UPDATE career_document SET extracted_text = ? WHERE id = ?", body, UUID.fromString(id))
        mvc.perform(post("$path/$id/claims").with(caller(user)).with(csrf()).contentType("application/json").content("""{"skill":"Kotlin","statement":"Built APIs","context":"Project","quote":"Built APIs with Kotlin"}""")).andExpect(status().isOk)
        val valid = """{"summary":[{"text":"Kotlin APIs","quote":"Built APIs with Kotlin"}],"suggestions":[]}"""
        `when`(ai.generateJson(anyString(), anyString(), anyMap())).thenReturn(valid)
        mvc.perform(post("$path/$id/analysis").with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(mapOf("text" to body,"locale" to "nb","consent" to true)))).andExpect(status().isOk)
        val reread = post("$path/$id/reread").contentType("application/json").content("""{"ocr":false}""")
        mvc.perform(reread.with(caller(other)).with(csrf())).andExpect(status().isNotFound)
        mvc.perform(post("$path/$id/reread").with(caller(user)).contentType("application/json").content("""{"ocr":false}""")).andExpect(status().isForbidden)
        mvc.perform(post("$path/$id/reread").with(caller(user)).with(csrf()).contentType("application/json").content("""{"ocr":false,"text":"injected"}""")).andExpect(status().isBadRequest)
        mvc.perform(post("$path/$id/reread").with(caller(user)).with(csrf()).contentType("application/json").content("""{"ocr":false}""")).andExpect(status().isOk).andExpect(jsonPath("$.text").value("$body\n\nAzure course certificate")).andExpect(jsonPath("$.document.extractionMethod").value("TEXT"))
        mvc.perform(get("$path/$id/analysis").with(caller(user))).andExpect(jsonPath("$.analysis").isEmpty)
        mvc.perform(get("/api/profile/me/claims").with(caller(user))).andExpect(jsonPath("$[0].status").value("UNVERIFIED")).andExpect(jsonPath("$[0].sourceQuote").value("Built APIs with Kotlin"))
        assertThat(mvc.perform(get("$path/$id/original").with(caller(user))).andReturn().response.contentAsByteArray).isEqualTo(bytes)
        verify(ai, times(1)).generateJson(anyString(), anyString(), anyMap())
        mvc.perform(post("$path/$id/reread").with(caller(user)).with(csrf()).contentType("application/json").content("""{"ocr":true}""")).andExpect(status().isBadRequest)
    }
    @Test fun `changed document text prevents an in flight analysis from republishing stale evidence`() {
        val user = profile(); val body = "Built APIs with Kotlin for a synthetic project."; val id = upload(user, bytes=DocumentFixture.docx(body))
        `when`(ai.generateJson(anyString(), anyString(), anyMap())).thenAnswer {
            jdbc.update("UPDATE career_document SET extracted_text = ? WHERE id = ?", "Different source after rereading", UUID.fromString(id))
            """{"summary":[{"text":"Kotlin APIs","quote":"Built APIs with Kotlin"}],"suggestions":[]}"""
        }
        mvc.perform(post("$path/$id/analysis").with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(mapOf("text" to body,"locale" to "nb","consent" to true)))).andExpect(status().isConflict).andExpect(jsonPath("$.code").value("DOCUMENT_ANALYSIS_CONFLICT"))
        mvc.perform(get("$path/$id/analysis").with(caller(user))).andExpect(jsonPath("$.analysis").isEmpty)
    }
    @Test fun `empty rereading cannot erase text recovered earlier with OCR`() {
        val user = profile(); val id = upload(user, "scan.pdf", DocumentFixture.pdf(""))
        jdbc.update("UPDATE career_document SET extracted_text = ?, extraction_method = 'OCR' WHERE id = ?", "Previously recovered Kotlin course evidence", UUID.fromString(id))
        mvc.perform(post("$path/$id/reread").with(caller(user)).with(csrf()).contentType("application/json").content("""{"ocr":false}""")).andExpect(status().isBadRequest).andExpect(jsonPath("$.code").value("DOCUMENT_AI_NO_TEXT"))
        mvc.perform(get("$path/$id").with(caller(user))).andExpect(jsonPath("$.text").value("Previously recovered Kotlin course evidence")).andExpect(jsonPath("$.document.extractionMethod").value("OCR"))
        verifyNoInteractions(ai)
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
    @Test fun `owned AI analysis persists without creating confirmed claims and failed replacement retains the previous result`() {
        val text = "Built APIs with Kotlin for a synthetic project."
        val user = profile(); val id = upload(user, bytes = DocumentFixture.docx(text))
        mvc.perform(get("$path/$id/analysis").with(caller(user))).andExpect(status().isOk).andExpect(jsonPath("$.analysis").isEmpty)
        verifyNoInteractions(ai)
        val output = """{"summary":[{"text":"API development","quote":"Built APIs with Kotlin"}],"suggestions":[{"skill":"Kotlin","statement":"Built APIs","context":"Synthetic project","quote":"Built APIs with Kotlin"}]}"""
        `when`(ai.generateJson(anyString(), anyString(), anyMap())).thenReturn(output)
        val request = json.writeValueAsString(mapOf("text" to text, "locale" to "nb", "consent" to true))
        val response = mvc.perform(post("$path/$id/analysis").with(caller(user)).with(csrf()).contentType("application/json").content(request)).andExpect(status().isOk)
            .andExpect(header().string("Cache-Control", "no-store")).andExpect(jsonPath("$.suggestions[0].skill").value("Kotlin")).andReturn()
        val analysisId = json.readTree(response.response.contentAsString)["id"].asText()
        mvc.perform(get("$path/$id/analysis").with(caller(user))).andExpect(jsonPath("$.analysis.id").value(analysisId))
        mvc.perform(get("/api/profile/me/claims").with(caller(user))).andExpect(jsonPath("$").isEmpty)
        `when`(ai.generateJson(anyString(), anyString(), anyMap())).thenReturn("not JSON")
        mvc.perform(post("$path/$id/analysis").with(caller(user)).with(csrf()).contentType("application/json").content(request)).andExpect(status().isBadGateway).andExpect(jsonPath("$.reason").value("MALFORMED_JSON"))
        mvc.perform(get("$path/$id/analysis").with(caller(user))).andExpect(jsonPath("$.analysis.id").value(analysisId))
        val claim = json.writeValueAsString(mapOf("skill" to "Kotlin", "statement" to "Built APIs", "context" to "Synthetic project", "quote" to "Built APIs with Kotlin", "analysisId" to analysisId))
        mvc.perform(post("$path/$id/claims").with(caller(user)).with(csrf()).contentType("application/json").content(claim)).andExpect(status().isOk)
            .andExpect(jsonPath("$.status").value("UNVERIFIED")).andExpect(jsonPath("$.sourceNote").value("AI-assisted CV: synthetic.docx"))
        verify(ai, times(2)).generateJson(anyString(), anyString(), anyMap())
        mvc.perform(delete("$path/$id").with(caller(user)).with(csrf())).andExpect(status().isNoContent)
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM document_analysis WHERE document_id = ?::uuid", Long::class.java, id)).isZero()
    }
    @Test fun `multiple documents are analyzed in one call with correct source attribution and collection invalidation`() {
        val user = profile(); val firstText = "Built APIs with Kotlin for a synthetic project."; val secondText = "Completed a PostgreSQL course with a synthetic certificate."
        val first = upload(user, bytes = DocumentFixture.docx(firstText)); val second = upload(user, "course.docx", DocumentFixture.docx(secondText))
        upload(user, "scan.pdf", DocumentFixture.pdf(""))
        val output = json.writeValueAsString(mapOf("summary" to listOf(mapOf("text" to "Kotlin API experience", "quote" to "Built APIs with Kotlin", "documentId" to first)), "suggestions" to listOf(
            mapOf("skill" to "PostgreSQL", "statement" to "Completed a PostgreSQL course", "context" to "Course", "quote" to "Completed a PostgreSQL course", "documentId" to second),
            mapOf("skill" to "Invented source", "statement" to "Built APIs", "context" to "Wrong document", "quote" to "Built APIs with Kotlin", "documentId" to second))))
        `when`(ai.generateJson(anyString(), anyString(), anyMap())).thenReturn(output)
        val body = json.writeValueAsString(mapOf("documents" to listOf(mapOf("documentId" to first, "text" to firstText), mapOf("documentId" to second, "text" to secondText)), "locale" to "en", "consent" to true))
        val result = mvc.perform(post("$path/analysis").with(caller(user)).with(csrf()).contentType("application/json").content(body)).andExpect(status().isOk)
            .andExpect(jsonPath("$.documents.length()").value(2)).andExpect(jsonPath("$.partial").value(true)).andExpect(jsonPath("$.suggestions.length()").value(1)).andExpect(jsonPath("$.suggestions[0].documentId").value(second)).andExpect(jsonPath("$.omittedItems").value(1)).andReturn()
        val analysisId = json.readTree(result.response.contentAsString)["id"].asText()
        mvc.perform(get("$path/analysis").with(caller(user))).andExpect(jsonPath("$.analysis.id").value(analysisId))
        verify(ai, times(1)).generateJson(anyString(), anyString(), anyMap())
        val claim = json.writeValueAsString(mapOf("skill" to "PostgreSQL", "statement" to "Completed a course", "context" to "Course", "quote" to "Completed a PostgreSQL course", "analysisId" to analysisId))
        mvc.perform(post("$path/$second/claims").with(caller(user)).with(csrf()).contentType("application/json").content(claim)).andExpect(status().isOk).andExpect(jsonPath("$.status").value("UNVERIFIED"))
        val other = profile()
        mvc.perform(get("$path/analysis").with(caller(other))).andExpect(jsonPath("$.analysis").isEmpty)
        mvc.perform(post("$path/analysis").with(caller(other)).with(csrf()).contentType("application/json").content(body)).andExpect(status().isNotFound)
        mvc.perform(delete("$path/$first").with(caller(user)).with(csrf())).andExpect(status().isNoContent)
        mvc.perform(get("$path/analysis").with(caller(user))).andExpect(jsonPath("$.analysis").isEmpty)
        mvc.perform(post("$path/$second/claims").with(caller(user)).with(csrf()).contentType("application/json").content(claim)).andExpect(status().isConflict)
    }
    @Test fun `private AI endpoints require ownership consent CSRF and bounded input before any provider call`() {
        val user = profile(); val id = upload(user, bytes = DocumentFixture.docx("Built APIs with Kotlin for a synthetic project.")); val other = profile()
        val body = """{"text":"Built APIs with Kotlin for a synthetic project.","locale":"nb","consent":true}"""
        mvc.perform(get("$path/$id/analysis")).andExpect(status().isUnauthorized)
        mvc.perform(post("$path/$id/analysis").with(caller(user)).contentType("application/json").content(body)).andExpect(status().isForbidden)
        mvc.perform(post("$path/$id/analysis").with(caller(other)).with(csrf()).contentType("application/json").content(body)).andExpect(status().isNotFound)
        for (invalid in listOf(body.replace("true", "false"), body.replace("\"nb\"", "\"unknown\""), body.dropLast(1) + ",\"ownerId\":\"spoofed\"}")) {
            mvc.perform(post("$path/$id/analysis").with(caller(user)).with(csrf()).contentType("application/json").content(invalid)).andExpect(status().isBadRequest)
        }
        mvc.perform(post("$path/analysis").with(caller(user)).contentType("application/json").content("{}")).andExpect(status().isForbidden)
        mvc.perform(get("$path/analysis")).andExpect(status().isUnauthorized)
        verifyNoInteractions(ai)
    }
    companion object {
        val storage = Files.createTempDirectory("career-documents-test-")
        @Container @JvmStatic val postgres = PostgreSQLContainer<Nothing>("postgres@sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826")
        @DynamicPropertySource @JvmStatic fun database(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl); registry.add("spring.datasource.username", postgres::getUsername); registry.add("spring.datasource.password", postgres::getPassword); registry.add("DOCUMENT_STORAGE_PATH") { storage.toString() }
        }
    }
}
