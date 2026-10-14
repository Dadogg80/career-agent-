package com.careeragent.ai.infrastructure

import com.careeragent.ai.application.AiTask
import com.careeragent.ai.application.AiFailureReasons
import com.careeragent.ai.application.AiModelCapabilities
import com.careeragent.ai.application.AiSelection
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.header
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import java.util.UUID

class AiCallDiagnosticsTest {
    private val diagnostics = AiCallDiagnostics(true)

    @AfterEach
    fun clearRequestContext() {
        RequestContextHolder.resetRequestAttributes()
    }

    @Test
    fun `does not capture AI payload until the developer explicitly starts capture`() {
        request()

        val result = diagnostics.trace(AiTask.DOCUMENT_EXTRACTION, "Groq", "test-model", "provider.test", "rules", "private input", "{}") {
            it.response("private response")
            "private response"
        }

        assertThat(result).isEqualTo("private response")
        assertThat(diagnostics.snapshot().calls).isEmpty()
    }

    @Test
    fun `captures numbered document workflow calls with instructions input schema and response`() {
        val workflowId = UUID.randomUUID().toString()
        request("/api/profile/me/documents/workflow/$workflowId/next")
        diagnostics.setCapturing(true)

        diagnostics.trace(AiTask.DOCUMENT_EXTRACTION, "Gemini", "gemini-test", "provider.test", "review this source", "source excerpt", """{"type":"object"}""") {
            it.response("""{"claims":[]}""")
            "ignored result"
        }

        val snapshot = diagnostics.snapshot()
        val call = snapshot.calls.single()
        assertThat(snapshot.capturing).isTrue()
        assertThat(call.groupId).isEqualTo("document-workflow:$workflowId")
        assertThat(call.groupLabel).contains(workflowId.take(8))
        assertThat(call.sequence).isEqualTo(1)
        assertThat(call.instructions).isEqualTo("review this source")
        assertThat(call.input).isEqualTo("source excerpt")
        assertThat(call.schema).isEqualTo("""{"type":"object"}""")
        assertThat(call.response).isEqualTo("""{"claims":[]}""")
        assertThat(call.status).isEqualTo("SUCCESS")

        diagnostics.setCapturing(false)
        assertThat(diagnostics.snapshot().calls).hasSize(1)
        diagnostics.clear()
        assertThat(diagnostics.snapshot().calls).isEmpty()
    }

    @Test
    fun `groups match calls by the exact saved job`() {
        val jobId = UUID.randomUUID().toString()
        request("/api/profile/me/jobs/$jobId/match")
        diagnostics.setCapturing(true)

        diagnostics.trace(AiTask.PERSONAL_MATCH, "Groq", "test-model", "provider.test", "match rules", "job-specific input", "{}") {
            it.response("match response")
            "match response"
        }

        val call = diagnostics.snapshot().calls.single()
        assertThat(call.groupId).isEqualTo("job-match:$jobId")
        assertThat(call.groupLabel).isEqualTo("Personal match · ${jobId.take(8)}")
    }

    @Test
    fun `document validation outcome is separate from successful provider exchange`() {
        val workflowId=UUID.randomUUID().toString()
        request("/api/profile/me/documents/workflow/$workflowId/next")
        diagnostics.setCapturing(true)
        diagnostics.trace(AiTask.DOCUMENT_EXTRACTION,"Groq","test-model","provider.test","rules","private input","{}") {
            it.response("""{"invalid":"private provider body"}""")
            "provider response"
        }

        diagnostics.documentValidationOutcome(AiTask.DOCUMENT_EXTRACTION,"INVALID_RESULT")

        val call=diagnostics.snapshot().calls.single()
        assertThat(call.status).isEqualTo("SUCCESS")
        assertThat(call.downstreamOutcome).isEqualTo("INVALID_RESULT")
        assertThat(call.errorCode).isNull()
        assertThat(call.response).contains("private provider body")
    }

    @Test
    fun `document validation outcome does not capture raw or unsupported reason values`() {
        val workflowId=UUID.randomUUID().toString()
        request("/api/profile/me/documents/workflow/$workflowId/next")
        diagnostics.trace(AiTask.DOCUMENT_EXTRACTION,"Groq","test-model","provider.test","rules","private input","{}") {
            it.response("private provider body")
            "provider response"
        }
        diagnostics.documentValidationOutcome(AiTask.DOCUMENT_EXTRACTION,"PRIVATE provider text")
        assertThat(diagnostics.snapshot().calls).isEmpty()
        assertThat(AiFailureReasons.safe("PROVIDER_SCHEMA_MISMATCH")).isEqualTo("PROVIDER_SCHEMA_MISMATCH")
        assertThat(AiFailureReasons.safe("PRIVATE provider text")).isNull()
    }

    @Test
    fun `captures only loopback-originated model requests and marks truncated fields`() {
        request(remoteAddress = "10.0.0.7")
        diagnostics.setCapturing(true)

        diagnostics.trace(AiTask.JOB_ANALYSIS, "Groq", "test-model", "provider.test", "rules", "x".repeat(60_001), "{}") {
            it.response("answer")
            "answer"
        }

        assertThat(diagnostics.snapshot().calls).isEmpty()

        request()
        diagnostics.trace(AiTask.JOB_ANALYSIS, "Groq", "test-model", "provider.test", "rules", "x".repeat(60_001), "{}") {
            it.failure("AI_INVALID_RESULT")
            it.response("partial response")
            "unused"
        }
        val call = diagnostics.snapshot().calls.single()
        assertThat(call.input).hasSize(60_000)
        assertThat(call.truncatedFields).containsExactly("input")
        assertThat(call.status).isEqualTo("ERROR")
        assertThat(call.errorCode).isEqualTo("AI_INVALID_RESULT")
    }

    private fun request(
        path: String = "/api/profile/me/jobs/match",
        remoteAddress: String = "127.0.0.1",
    ) {
        val request = MockHttpServletRequest("POST", path)
        request.remoteAddr = remoteAddress
        RequestContextHolder.setRequestAttributes(ServletRequestAttributes(request))
    }
}

@SpringBootTest
@AutoConfigureMockMvc
class AiCallDiagnosticsEndpointTest {
    @Autowired lateinit var mvc: MockMvc
    @Autowired lateinit var diagnostics: AiCallDiagnostics
    @Autowired lateinit var mapper: com.fasterxml.jackson.databind.ObjectMapper

    @BeforeEach
    fun resetDiagnostics() {
        diagnostics.setCapturing(false)
        diagnostics.clear()
    }

    @Test
    fun `loopback controls require no provider key and are not cacheable`() {
        mvc.perform(get("/api/dev/ai-calls"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.supported").value(true))
            .andExpect(jsonPath("$.capturing").value(false))
            .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("no-store")))

        mvc.perform(post("/api/dev/ai-calls").contentType("application/json").content("""{"capturing":true}"""))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.capturing").value(true))

        mvc.perform(delete("/api/dev/ai-calls"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.calls").isEmpty)
    }

    @Test
    fun `remote requests cannot read or control captured content`() {
        mvc.perform(get("/api/dev/ai-calls").with { request -> request.remoteAddr = "192.168.1.9"; request })
            .andExpect(status().isForbidden)
            .andExpect(jsonPath("$.code").value("ACCESS_DENIED"))
        mvc.perform(post("/api/dev/ai-calls").with { request -> request.remoteAddr = "192.168.1.9"; request }
            .contentType("application/json").content("""{"capturing":true}"""))
            .andExpect(status().isForbidden)
            .andExpect(jsonPath("$.code").value("ACCESS_DENIED"))
        assertThat(diagnostics.snapshot().capturing).isFalse()
    }

    @Test
    fun `configuration endpoint publishes every structured capability but only retrieval tool choices`() {
        val response=mvc.perform(get("/api/ai/config"))
            .andExpect(status().isOk)
            .andExpect(header().string("Cache-Control",org.hamcrest.Matchers.containsString("no-store")))
            .andReturn().response.contentAsString
        val options=mapper.readTree(response).path("options")
        val structured=AiModelCapabilities.structuredSelections()
        for(area in listOf("job","documents","documentExcerpt","matching","tailoring")) {
            val actual=options.path(area).map { option ->
                val selection=option.path("approval").path("selections").path(0)
                AiSelection(selection.path("provider").asText(),selection.path("model").asText())
            }
            assertThat(actual).containsAll(structured).hasSizeBetween(structured.size,structured.size+1)
        }
        val retrieval=options.path("sourceRetrieval").map { option ->
            val selection=option.path("approval").path("selections").path(0)
            AiSelection(selection.path("provider").asText(),selection.path("model").asText())
        }
        assertThat(retrieval).containsAll(AiModelCapabilities.jobSourceRetrievalSelections)
            .hasSizeBetween(AiModelCapabilities.jobSourceRetrievalSelections.size,AiModelCapabilities.jobSourceRetrievalSelections.size+1)
        assertThat(retrieval).doesNotContain(AiSelection("Groq","qwen/qwen3.8-27b"))
    }
}
