package com.careeragent.jobs

import com.careeragent.jobs.application.*
import com.careeragent.jobs.infrastructure.*
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

class FinnImportTest {
    private val url = "https://www.finn.no/job/ad/123456789"
    private val mapper = jacksonObjectMapper()
    private val transport = mock(GroqBrowserTransport::class.java)
    private fun browser(limit: Int = 10, enabled: Boolean = true) = GroqAdvertisementBrowser(transport, mapper, "openai/gpt-oss-20b", limit, enabled)
    private fun response(target: String = url, type: String = "browser.open", finish: String = "stop", body: String = "Du må kunne Kotlin og PostgreSQL for å jobbe med disse integrasjonene og backend-tjenestene.", outputUrl: String = target, arguments: String? = null): String = mapper.writeValueAsString(mapOf(
        "choices" to listOf(mapOf("finish_reason" to finish, "message" to mapOf("content" to "HALLUCINATED FINAL ANSWER", "reasoning" to "PRIVATE REASONING", "executed_tools" to listOf(mapOf(
            "type" to type, "arguments" to (arguments ?: mapper.writeValueAsString(mapOf("id" to target))),
            "output" to "L0: URL: $outputUrl\nL1: Backend engineer - Example \\| FINN.no\nL2: # Backend engineer\nL3: $body",
        ))))),
    ))
    @Test fun `FINN URLs are canonicalized and unsafe variants are rejected`() {
        assertEquals(url, JobImporter.finnUrl("https://finn.no/job/ad/123456789/?tracking=x#details"))
        listOf("http://www.finn.no/job/ad/123456789", "https://user@www.finn.no/job/ad/123456789", "https://www.finn.no:8443/job/ad/123456789", "https://www.finn.no.evil.example/job/ad/123456789", "https://127.0.0.1/job/ad/123456789", "https://www.finn.no/job/ad/%31%32%33", "https://www.finn.no/job/ad/123456789/../../", "https://www.finn.no/job/ad/123456789%0aevil").forEach {
            assertThrows(ImportFailure::class.java) { JobImporter.finnUrl(it) }
        }
        verifyNoInteractions(transport)
    }
    @Test fun `only browser source output is imported never the final answer`() {
        val job = browser().parse(url, response())
        assertEquals("Backend engineer - Example", job.title)
        assertEquals("GROQ_BROWSER_EXCERPT", job.sourceType)
        assertEquals("Groq",job.aiSelection?.provider)
        assertEquals("openai/gpt-oss-20b",job.aiSelection?.model)
        assertFalse(job.text.contains("HALLUCINATED")); assertFalse(job.text.contains("PRIVATE"))
        assertTrue(job.text.contains("Du må kunne Kotlin")); assertFalse(job.text.contains("L3:"))
    }
    @Test fun `other advertisements search snippets redirects and missing evidence are rejected`() {
        listOf(response(target = "https://www.finn.no/job/ad/999999999"), response(type = "browser.search"), response(outputUrl = "https://other.example/job"), response(finish = "length"), response(arguments = "malformed"), "{}").forEach {
            assertThrows(ImportFailure::class.java) { browser().parse(url, it) }
        }
    }
    @Test fun `wrapped FINN title and emphasis are handled without losing source identity`() {
        val root = mapper.readTree(response(body = "Søknadsfrist **11.10.2026**. Du må kunne Kotlin og PostgreSQL for å jobbe med disse backend-integrasjonene."))
        val tool = root.path("choices").path(0).path("message").path("executed_tools").path(0) as com.fasterxml.jackson.databind.node.ObjectNode
        val output = tool.path("output").asText().replace("| FINN.no", "|\nL2: FINN.no")
        assertTrue(output.contains("\nL2: FINN.no"))
        tool.put("output", output)
        val job = browser().parse(url, mapper.writeValueAsString(root))
        assertEquals("Backend engineer - Example", job.title)
        assertTrue(job.text.contains("Søknadsfrist 11.10.2026"))
        assertFalse(job.text.contains("**"))
        assertEquals(url, job.sourceUrl)
    }
    @Test fun `large browser excerpts fail without silent truncation`() {
        assertEquals("SOURCE_TOO_LARGE", assertThrows(ImportFailure::class.java) { browser().parse(url, response(body = "x".repeat(15001))) }.code)
    }
    @Test fun `FINN separator and site suffix can wrap together onto a separate title line`() {
        val root = mapper.readTree(response())
        val tool = root.path("choices").path(0).path("message").path("executed_tools").path(0) as com.fasterxml.jackson.databind.node.ObjectNode
        tool.put("output", tool.path("output").asText().replace("Example \\| FINN.no", "Example\nL2: \\| FINN.no"))
        val job = browser().parse(url, mapper.writeValueAsString(root))
        assertEquals("Backend engineer - Example", job.title)
        assertEquals(url, job.sourceUrl)
        assertTrue(job.text.contains("Du må kunne Kotlin"))
        tool.put("output", tool.path("output").asText().replace("URL: $url", "URL: https://www.finn.no/job/ad/999999999"))
        assertEquals("SOURCE_NOT_AVAILABLE", assertThrows(ImportFailure::class.java) { browser().parse(url, mapper.writeValueAsString(root)) }.code)
    }
    @Test fun `search uses the documented built-in tool without structured output or code execution`() {
        val body = browser().requestBody(url)
        assertEquals(listOf(mapOf("type" to "browser_search")), body["tools"])
        assertFalse(body.containsKey("response_format"))
        assertEquals("required", body["tool_choice"])
        assertEquals(4000, body["max_completion_tokens"])
    }
    @Test fun `failed searches count toward the process limit and do not retry`() {
        val b = browser(1)
        `when`(transport.complete(anyMap(), anyString())).thenThrow(ImportFailure("SOURCE_RATE_LIMITED", 429))
        assertEquals("SOURCE_RATE_LIMITED", assertThrows(ImportFailure::class.java) { b.load(url) }.code)
        assertEquals("SOURCE_BUDGET_REACHED", assertThrows(ImportFailure::class.java) { b.load(url) }.code)
        verify(transport, times(1)).complete(anyMap(), anyString())
    }
    @Test fun `disabled and zero-budget search never calls Groq`() {
        assertEquals("SOURCE_SEARCH_DISABLED", assertThrows(ImportFailure::class.java) { browser(enabled = false).load(url) }.code)
        assertEquals("SOURCE_BUDGET_REACHED", assertThrows(ImportFailure::class.java) { browser(0).load(url) }.code)
        verifyNoInteractions(transport)
    }
    @Test fun `router keeps NAV and FINN adapters separate`() {
        val nav = mock(VacancySource::class.java)
        val search = mock(AdvertisementBrowser::class.java)
        val job = ImportedJob(url, "Backend engineer", "Kotlin and PostgreSQL are required for the advertised role.", "2026-10-07T00:00:00Z", "GROQ_BROWSER_EXCERPT")
        `when`(search.load(url)).thenReturn(job)
        assertEquals(job, JobImporter(nav, search).import(url))
        verifyNoInteractions(nav)
    }
}

@SpringBootTest
@AutoConfigureMockMvc
class FinnImportApiTest {
    @Autowired lateinit var mvc: MockMvc
    @MockitoBean lateinit var browser: AdvertisementBrowser
    @Test fun `canonical FINN link returns excerpt provenance through existing endpoint`() {
        val url = "https://www.finn.no/job/ad/123456789"
        `when`(browser.load(url)).thenReturn(ImportedJob(url, "Backend engineer", "Kotlin and PostgreSQL are required for the advertised role.", "2026-10-07T00:00:00Z", "GROQ_BROWSER_EXCERPT"))
        mvc.perform(post("/api/jobs/import").contentType("application/json").content(mapper().writeValueAsString(mapOf("url" to "$url?tracking=x"))))
            .andExpect(status().isOk).andExpect(jsonPath("$.sourceType").value("GROQ_BROWSER_EXCERPT"))
    }
    @Test fun `rate limit headers are returned without provider details`() {
        val url = "https://www.finn.no/job/ad/123456789"
        `when`(browser.load(url)).thenThrow(ImportFailure("SOURCE_RATE_LIMITED", 429, 16))
        mvc.perform(post("/api/jobs/import").contentType("application/json").content(mapper().writeValueAsString(mapOf("url" to url))))
            .andExpect(status().isTooManyRequests).andExpect(header().string("Retry-After", "16"))
            .andExpect(jsonPath("$.code").value("SOURCE_RATE_LIMITED"))
    }
    private fun mapper() = jacksonObjectMapper()
}
