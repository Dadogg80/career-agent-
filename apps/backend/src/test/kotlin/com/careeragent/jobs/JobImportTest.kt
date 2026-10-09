package com.careeragent.jobs

import com.careeragent.jobs.application.*
import com.careeragent.jobs.infrastructure.*
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

class JobImportTest {
    private val id = "12345678-1234-1234-1234-123456789abc"
    private val source = NavVacancySource(mock(NavFeedClient::class.java), jacksonObjectMapper(), "")
    private fun payload(status: String = "ACTIVE", description: String = "<p>Du må kunne Kotlin og PostgreSQL for denne rollen.</p>") =
        jacksonObjectMapper().writeValueAsString(mapOf("uuid" to id, "status" to status, "ad_content" to mapOf("title" to "Utvikler", "description" to description)))

    @Test fun `valid URL is canonicalized without tracking`() {
        assertEquals(id, JobImporter.advertisementId("https://arbeidsplassen.nav.no/stillinger/stilling/$id/?utm_source=test#section"))
    }
    @Test fun `untrusted hosts schemes credentials and encoded paths are rejected`() {
        val urls = listOf("http://arbeidsplassen.nav.no/stillinger/stilling/$id", "https://127.0.0.1/", "https://[::1]/", "https://10.0.0.1/", "https://arbeidsplassen.nav.no.evil.example/stillinger/stilling/$id", "https://user@arbeidsplassen.nav.no/stillinger/stilling/$id", "https://arbeidsplassen.nav.no:8443/stillinger/stilling/$id", "https://arbeidsplassen.nav.no/stillinger/stilling/%2e%2e", "https://arbeidsplassen.nav.no/stillinger", "https://www.finn.no/job/ad/123")
        urls.forEach { assertThrows(ImportFailure::class.java) { JobImporter.advertisementId(it) } }
    }
    @Test fun `normalized text retains paragraph boundaries without scripts`() {
        val job = source.parse(id, payload(description = "<p>Du må kunne Kotlin og PostgreSQL for denne rollen.</p><script>evil()</script><ul><li>God norsk</li><li>API-er</li></ul>"))
        assertTrue(job.text.contains("God norsk\nAPI-er")); assertFalse(job.text.contains("evil"))
        assertEquals(JobImporter.canonicalUrl(id), job.sourceUrl)
        assertNotNull(java.time.Instant.parse(job.retrievedAt))
    }
    @Test fun `published metadata becomes source evidence without exposing unrelated fields`() {
        val raw = jacksonObjectMapper().writeValueAsString(mapOf("uuid" to id, "status" to "ACTIVE", "ad_content" to mapOf(
            "title" to "Utvikler", "description" to "Du må kunne Kotlin og PostgreSQL for denne rollen.",
            "applicationDue" to "Snarest", "employer" to mapOf("name" to "Example AS"),
            "workLocations" to listOf(mapOf("city" to "Oslo")),
            "contactList" to listOf(mapOf("name" to "Test Contact", "email" to "contact@example.test")),
            "internalNote" to "must not be included"
        )))
        val text = source.parse(id, raw).text
        assertTrue(text.contains("Employer: Example AS"))
        assertTrue(text.contains("Application deadline: Snarest"))
        assertTrue(text.contains("Location city: Oslo"))
        assertTrue(text.contains("Contact email: contact@example.test"))
        assertFalse(text.contains("must not be included"))
    }
    @Test fun `inactive and absent content fail without leaking the document`() {
        assertEquals("SOURCE_NOT_AVAILABLE", assertThrows(ImportFailure::class.java) { source.parse(id, payload("INACTIVE")) }.code)
        assertEquals("SOURCE_INVALID", assertThrows(ImportFailure::class.java) { source.parse(id, payload(description = "short")) }.code)
        assertEquals("SOURCE_INVALID", assertThrows(ImportFailure::class.java) { source.parse(id, "private raw response") }.code)
    }
    @Test fun `large descriptions are rejected rather than truncated`() {
        assertEquals("SOURCE_TOO_LARGE", assertThrows(ImportFailure::class.java) { source.parse(id, payload(description = "x".repeat(15001))) }.code)
    }
    @Test fun `only fixed official endpoints can be requested`() {
        assertEquals("INVALID_URL", assertThrows(ImportFailure::class.java) { NavFeedClient().get("https://127.0.0.1") }.code)
    }
    @Test fun `public experiment token is obtained and used only for the official entry`() {
        val client = mock(NavFeedClient::class.java)
        `when`(client.get("/api/publicToken", null)).thenReturn("Current public token:\neyJabc.def.ghi")
        `when`(client.get("/api/v1/feedentry/$id", "eyJabc.def.ghi")).thenReturn(payload())
        assertEquals("Utvikler", NavVacancySource(client, jacksonObjectMapper(), "").load(id).title)
        verify(client).get("/api/v1/feedentry/$id", "eyJabc.def.ghi")
    }
    @Test fun `redirects non-json and oversized source responses are rejected`() {
        val connection = mock(javax.net.ssl.HttpsURLConnection::class.java)
        `when`(connection.responseCode).thenReturn(302)
        assertEquals("SOURCE_UNAVAILABLE", assertThrows(ImportFailure::class.java) { NavFeedClient().readResponse(connection, true) }.code)
        verify(connection, never()).inputStream
        `when`(connection.responseCode).thenReturn(200)
        `when`(connection.contentType).thenReturn("text/html")
        assertEquals("SOURCE_INVALID", assertThrows(ImportFailure::class.java) { NavFeedClient().readResponse(connection, true) }.code)
        `when`(connection.contentType).thenReturn("application/json")
        `when`(connection.contentLengthLong).thenReturn(-1)
        `when`(connection.inputStream).thenReturn(java.io.ByteArrayInputStream(ByteArray(1000001)))
        assertEquals("SOURCE_TOO_LARGE", assertThrows(ImportFailure::class.java) { NavFeedClient().readResponse(connection, true) }.code)
    }
    @Test fun `private and local resolved addresses are blocked`() {
        listOf("127.0.0.1", "10.0.0.1", "169.254.169.254", "192.168.1.1", "100.64.0.1", "::1", "fc00::1", "fe80::1").forEach {
            assertFalse(NavFeedClient.isPublicAddress(java.net.InetAddress.getByName(it)))
        }
        assertTrue(NavFeedClient.isPublicAddress(java.net.InetAddress.getByName("8.8.8.8")))
    }

}

@SpringBootTest
@AutoConfigureMockMvc
class JobImportApiTest {
    @Autowired lateinit var mvc: MockMvc
    @MockitoBean lateinit var source: VacancySource
    @Test fun `unsupported source returns a safe error without fetching`() {
        mvc.perform(post("/api/jobs/import").contentType("application/json").content("{\"url\":\"https://other.example/job/ad/123\"}"))
            .andExpect(status().isBadRequest).andExpect(jsonPath("$.code").value("SOURCE_UNSUPPORTED"))
        verifyNoInteractions(source)
    }
    @Test fun `valid source is returned as plain text with provenance`() {
        val id = "12345678-1234-1234-1234-123456789abc"
        `when`(source.load(id)).thenReturn(ImportedJob(JobImporter.canonicalUrl(id), "Utvikler", "Kotlin er et krav for denne spennende stillingen.", "2026-10-07T00:00:00Z"))
        mvc.perform(post("/api/jobs/import").contentType("application/json").content("{\"url\":\"${JobImporter.canonicalUrl(id)}\"}"))
            .andExpect(status().isOk).andExpect(jsonPath("$.title").value("Utvikler"))
    }
    @Test fun `invalid model approval releases the source permit for subsequent imports`() {
        val id = "12345678-1234-1234-1234-123456789abc"
        mvc.perform(post("/api/jobs/import").contentType("application/json")
            .content("{\"url\":\"${JobImporter.canonicalUrl(id)}\",\"aiApproval\":\"invalid\"}"))
            .andExpect(status().isBadRequest).andExpect(jsonPath("$.code").value("SOURCE_MODEL_SELECTION_INVALID"))
        `when`(source.load(id)).thenReturn(ImportedJob(JobImporter.canonicalUrl(id), "Utvikler", "Kotlin er et krav for denne spennende stillingen.", "2026-10-07T00:00:00Z"))
        mvc.perform(post("/api/jobs/import").contentType("application/json")
            .content("{\"url\":\"${JobImporter.canonicalUrl(id)}\"}"))
            .andExpect(status().isOk).andExpect(jsonPath("$.title").value("Utvikler"))
    }
}
