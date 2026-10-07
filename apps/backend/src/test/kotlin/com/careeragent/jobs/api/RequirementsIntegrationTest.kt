package com.careeragent.jobs.api

import com.careeragent.ai.application.AiFailure
import com.careeragent.ai.application.AiModel
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.http.HttpStatus
import org.springframework.test.context.bean.override.mockito.MockitoBean

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RequirementsIntegrationTest @Autowired constructor(private val client: TestRestTemplate) {
    @MockitoBean
    private lateinit var model: AiModel

    private val source = "Vi søker en utvikler. Du må ha erfaring med Kotlin. PostgreSQL er en fordel."

    @Test
    fun `HTTP extraction returns grounded structured requirements`() {
        `when`(model.generateJson(anyString(), anyString(), anyMap())).thenReturn(
            """{"requirements":[{"label":"Kotlin","kind":"REQUIRED","quote":"Du må ha erfaring med Kotlin."}]}""",
        )
        val response = client.postForEntity("/api/jobs/requirements", ExtractionRequest(source), Map::class.java)
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.get("requirements") as List<*>).hasSize(1)
        verify(model).generateJson(anyString(), anyString(), anyMap())
        assertThat(mockingDetails(model).invocations.single().arguments[1]).isEqualTo(source)
    }

    @Test
    fun `bad input is rejected before calling the provider`() {
        val response = client.postForEntity("/api/jobs/requirements", ExtractionRequest("short"), Map::class.java)
        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        assertThat(response.body?.get("code")).isEqualTo("INVALID_INPUT")
        verifyNoInteractions(model)
    }

    @Test
    fun `provider failure is mapped to a stable error code`() {
        `when`(model.generateJson(anyString(), anyString(), anyMap())).thenThrow(AiFailure("AI_RATE_LIMITED", 429))
        val response = client.postForEntity("/api/jobs/requirements", ExtractionRequest(source), Map::class.java)
        assertThat(response.statusCode).isEqualTo(HttpStatus.TOO_MANY_REQUESTS)
        assertThat(response.body).isEqualTo(mapOf("code" to "AI_RATE_LIMITED"))
    }

    @Test
    fun `fabricated evidence is rejected over HTTP`() {
        `when`(model.generateJson(anyString(), anyString(), anyMap())).thenReturn(
            """{"requirements":[{"label":"Kafka","kind":"REQUIRED","quote":"Must know Kafka"}]}""",
        )
        val response = client.postForEntity("/api/jobs/requirements", ExtractionRequest(source), Map::class.java)
        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_GATEWAY)
        assertThat(response.body?.get("code")).isEqualTo("AI_INVALID_RESULT")
    }
}
