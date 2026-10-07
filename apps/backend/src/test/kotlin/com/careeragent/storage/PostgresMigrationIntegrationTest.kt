package com.careeragent.storage

import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.flywaydb.core.Flyway
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.util.UUID

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("persistence")
@Testcontainers
class PostgresMigrationIntegrationTest {
    @Autowired lateinit var jdbc: JdbcTemplate
    @Autowired lateinit var flyway: Flyway

    @Test
    fun `migrations are repeatable and user profile data survives reopening`() {
        val user = UUID.randomUUID()
        val profile = UUID.randomUUID()
        jdbc.update("INSERT INTO app_user(id, oidc_issuer, oidc_subject) VALUES (?, ?, ?)", user, "https://login.example.test", user.toString())
        jdbc.update("INSERT INTO career_profile(id, owner_id, display_name) VALUES (?, ?, ?)", profile, user, "Pilot Test")
        assertThat(flyway.migrate().migrationsExecuted).isZero()
        assertThat(jdbc.queryForObject("SELECT preferred_language FROM career_profile WHERE owner_id = ?", String::class.java, user)).isEqualTo("nb")
        assertThat(jdbc.queryForObject("SELECT display_name FROM career_profile WHERE id = ?", String::class.java, profile)).isEqualTo("Pilot Test")
        jdbc.update("DELETE FROM app_user WHERE id = ?", user)
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM career_profile WHERE id = ?", Long::class.java, profile)).isZero()
    }

    @Test
    fun `orphaned profiles unsupported languages and duplicate identity bindings are rejected`() {
        assertThatThrownBy {
            jdbc.update("INSERT INTO career_profile(id, owner_id, display_name) VALUES (?, ?, ?)", UUID.randomUUID(), UUID.randomUUID(), "Test")
        }.isInstanceOf(DataIntegrityViolationException::class.java)
        val user = UUID.randomUUID()
        jdbc.update("INSERT INTO app_user(id, oidc_issuer, oidc_subject) VALUES (?, ?, ?)", user, "https://login.example.test", user.toString())
        assertThatThrownBy {
            jdbc.update("INSERT INTO app_user(id, oidc_issuer, oidc_subject) VALUES (?, ?, ?)", UUID.randomUUID(), "https://login.example.test", user.toString())
        }.isInstanceOf(DataIntegrityViolationException::class.java)
        assertThatThrownBy {
            jdbc.update("INSERT INTO career_profile(id, owner_id, display_name, preferred_language) VALUES (?, ?, ?, ?)", UUID.randomUUID(), user, "Test", "fr")
        }.isInstanceOf(DataIntegrityViolationException::class.java)
        jdbc.update("DELETE FROM app_user WHERE id = ?", user)
    }

    companion object {
        @Container @JvmStatic
        val postgres = PostgreSQLContainer<Nothing>("postgres@sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826")
        @DynamicPropertySource @JvmStatic
        fun database(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
        }
    }
}
