package com.careeragent.profile

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.oauth2.core.oidc.OidcIdToken
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
import java.time.Instant
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("persistence")
@Testcontainers
class ProfileSecurityIntegrationTest {
    @Autowired lateinit var mvc: MockMvc
    @Autowired lateinit var jdbc: JdbcTemplate
    private fun caller(subject: String, issuer: String = "https://identity.example.test") = oidcLogin().idToken {
        it.issuer(issuer).subject(subject).audience(listOf("career-agent")).issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(600))
    }
    private fun input(name: String, revision: Long = 0) = """{"displayName":"$name","preferredLanguage":"nb","revision":$revision}"""

    @Test
    fun `anonymous profile requests fail closed and session status contains no identity claims`() {
        mvc.perform(get("/api/profile/me")).andExpect(status().isUnauthorized).andExpect(jsonPath("$.code").value("AUTH_REQUIRED"))
        mvc.perform(put("/api/profile/me").with(csrf()).contentType("application/json").content(input("Blocked"))).andExpect(status().isUnauthorized)
        mvc.perform(get("/api/auth/session")).andExpect(status().isOk).andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.authenticated").value(false)).andExpect(jsonPath("$.csrfToken").isString).andExpect(jsonPath("$.subject").doesNotExist())
    }

    @Test
    fun `CSRF is required for private writes and logout`() {
        val user = caller(UUID.randomUUID().toString())
        mvc.perform(put("/api/profile/me").with(user).contentType("application/json").content(input("Blocked"))).andExpect(status().isForbidden)
        mvc.perform(put("/api/profile/me").with(user).with(csrf().useInvalidToken()).contentType("application/json").content(input("Blocked"))).andExpect(status().isForbidden)
        mvc.perform(post("/api/auth/logout").with(user)).andExpect(status().isForbidden)
        mvc.perform(post("/api/auth/logout").with(user).with(csrf())).andExpect(status().isNoContent)
    }

    @Test
    fun `different subjects and same subject with a different issuer own separate profiles`() {
        val subject = UUID.randomUUID().toString()
        val first = caller(subject)
        val second = caller(UUID.randomUUID().toString())
        val third = caller(subject, "https://other-identity.example.test")
        for ((user, name) in listOf(first to "First", second to "Second", third to "Third")) {
            mvc.perform(get("/api/profile/me").with(user)).andExpect(status().isNotFound)
            mvc.perform(put("/api/profile/me").with(user).with(csrf()).contentType("application/json").content(input(name)))
                .andExpect(status().isOk).andExpect(jsonPath("$.displayName").value(name)).andExpect(jsonPath("$.revision").value(1)).andExpect(jsonPath("$.ownerId").doesNotExist())
            mvc.perform(get("/api/profile/me").with(user)).andExpect(status().isOk).andExpect(jsonPath("$.displayName").value(name)).andExpect(header().string("Cache-Control", "no-store"))
        }
        mvc.perform(put("/api/profile/me").with(second).with(csrf()).contentType("application/json").content(input("Second updated", 1))).andExpect(status().isOk)
        mvc.perform(get("/api/profile/me").with(first)).andExpect(jsonPath("$.displayName").value("First"))
    }

    @Test
    fun `owner spoofing arbitrary IDs invalid fields and stale revisions are rejected`() {
        val user = caller(UUID.randomUUID().toString())
        mvc.perform(put("/api/profile/me").with(user).with(csrf()).contentType("application/json").content(input("Original"))).andExpect(status().isOk)
        mvc.perform(put("/api/profile/me").with(user).with(csrf()).contentType("application/json").content("""{"displayName":"Hacked","preferredLanguage":"nb","revision":1,"ownerId":"other"}"""))
            .andExpect(status().isBadRequest)
        mvc.perform(get("/api/profile/" + UUID.randomUUID()).with(user)).andExpect(status().isForbidden)
        mvc.perform(put("/api/profile/me").with(user).with(csrf()).contentType("application/json").content(input("Stale"))).andExpect(status().isConflict).andExpect(jsonPath("$.code").value("PROFILE_CONFLICT"))
        for (body in listOf(input(""), """{"displayName":"Valid","preferredLanguage":"fr","revision":1}""", """{"displayName":"Valid","preferredLanguage":"nb","revision":1.5}""")) {
            mvc.perform(put("/api/profile/me").with(user).with(csrf()).contentType("application/json").content(body)).andExpect(status().isBadRequest)
        }
        mvc.perform(get("/api/profile/me").with(user)).andExpect(jsonPath("$.displayName").value("Original")).andExpect(jsonPath("$.revision").value(1))
    }

    @Test
    fun `conflict rolls back identity insertion and untrusted identity headers never authenticate`() {
        val subject = UUID.randomUUID().toString()
        mvc.perform(put("/api/profile/me").with(caller(subject)).with(csrf()).contentType("application/json").content(input("Conflict", 9))).andExpect(status().isConflict)
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM app_user WHERE oidc_subject = ?", Long::class.java, subject)).isZero()
        mvc.perform(get("/api/profile/me").header("X-User-Id", subject).header("Authorization", "Bearer fake-token")).andExpect(status().isUnauthorized)
    }

    companion object {
        @Container @JvmStatic val postgres = PostgreSQLContainer<Nothing>("postgres@sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826")
        @DynamicPropertySource @JvmStatic fun database(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
        }
    }
}
