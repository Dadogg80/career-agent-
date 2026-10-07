package com.careeragent.system.api

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.http.HttpStatus

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SystemStatusIntegrationTest @Autowired constructor(
    private val client: TestRestTemplate,
) {
    @Test
    fun `status endpoint returns the application contract over HTTP`() {
        val response = client.getForEntity("/api/system/status", SystemStatus::class.java)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body).isEqualTo(SystemStatus("career-agent", "UP"))
    }

    @Test
    fun `health endpoint exposes health without component details`() {
        val response = client.getForEntity("/actuator/health", Map::class.java)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.get("status")).isEqualTo("UP")
        assertThat(response.body?.containsKey("components")).isFalse()
    }
}
