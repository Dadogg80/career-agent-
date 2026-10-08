package com.careeragent.profile

import com.careeragent.profile.application.*
import com.careeragent.profile.domain.ClaimContent
import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.jdbc.core.JdbcTemplate
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
import java.util.concurrent.Callable
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("persistence")
@Testcontainers
class ClaimSecurityIntegrationTest {
    @Autowired lateinit var mvc: MockMvc
    @Autowired lateinit var json: ObjectMapper
    @Autowired lateinit var jdbc: JdbcTemplate
    @Autowired lateinit var claims: ClaimService
    private val issuer = "https://identity.example.test"
    private val path = "/api/profile/me/claims"
    private fun caller(subject: String, authority: String = issuer) = oidcLogin().idToken {
        it.issuer(authority).subject(subject).audience(listOf("career-agent")).issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(600))
    }
    private fun content(statement: String = "Implemented payment callbacks") = mapOf("skill" to "Webhooks", "statement" to statement, "context" to "Synthetic project", "sourceNote" to "My recollection of the integration")
    private fun profile(subject: String = UUID.randomUUID().toString(), authority: String = issuer): String {
        mvc.perform(put("/api/profile/me").with(caller(subject, authority)).with(csrf()).contentType("application/json")
            .content("""{"displayName":"Synthetic Pilot","preferredLanguage":"nb","revision":0}""")).andExpect(status().isOk)
        return subject
    }
    private fun create(subject: String): String {
        val result = mvc.perform(post(path).with(caller(subject)).with(csrf()).contentType("application/json").content(json.writeValueAsString(content())))
            .andExpect(status().isOk).andExpect(jsonPath("$.status").value("UNVERIFIED")).andExpect(jsonPath("$.revision").value(1))
            .andExpect(jsonPath("$.ownerId").doesNotExist()).andReturn()
        return json.readTree(result.response.contentAsString)["id"].asText()
    }

    @Test fun `manual entry needs explicit confirmation and edits invalidate confirmation without rewriting history`() {
        val user = profile(); val id = create(user)
        mvc.perform(post("$path/$id/review").with(caller(user)).with(csrf()).contentType("application/json").content("""{"decision":"CONFIRM","revision":1}"""))
            .andExpect(status().isOk).andExpect(jsonPath("$.status").value("CONFIRMED")).andExpect(jsonPath("$.revision").value(2))
        mvc.perform(put("$path/$id").with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(content("Implemented retries") + ("revision" to 2))))
            .andExpect(status().isOk).andExpect(jsonPath("$.status").value("UNVERIFIED")).andExpect(jsonPath("$.revision").value(3))
        mvc.perform(post("$path/$id/review").with(caller(user)).with(csrf()).contentType("application/json").content("""{"decision":"REJECT","revision":3}"""))
            .andExpect(status().isOk).andExpect(jsonPath("$.status").value("REJECTED")).andExpect(jsonPath("$.revision").value(4))
        mvc.perform(get("$path/$id/history").with(caller(user))).andExpect(status().isOk).andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.total").value(4)).andExpect(jsonPath("$.items[2].status").value("CONFIRMED"))
            .andExpect(jsonPath("$.items[2].statement").value("Implemented payment callbacks"))
            .andExpect(jsonPath("$.items[2].action").value("USER_CONFIRMATION")).andExpect(jsonPath("$.items[2].recordedBy").value("PROFILE_OWNER"))
            .andExpect(jsonPath("$.items[2].recordedAt").isString).andExpect(jsonPath("$.items[3].action").value("MANUAL_ENTRY"))
    }

    @Test fun `other subjects and issuers cannot inspect modify review or delete claims`() {
        val user = profile(); val id = create(user)
        val other = profile(); profile(user, "https://other.example.test")
        for ((subject, authority) in listOf(other to issuer, user to "https://other.example.test")) {
            mvc.perform(get(path).with(caller(subject, authority))).andExpect(status().isOk).andExpect(jsonPath("$").isEmpty)
            mvc.perform(get("$path/$id/history").with(caller(subject, authority))).andExpect(status().isNotFound)
            mvc.perform(put("$path/$id").with(caller(subject, authority)).with(csrf()).contentType("application/json").content(json.writeValueAsString(content("Spoofed") + ("revision" to 1)))).andExpect(status().isNotFound)
            mvc.perform(post("$path/$id/review").with(caller(subject, authority)).with(csrf()).contentType("application/json").content("""{"decision":"CONFIRM","revision":1}""")).andExpect(status().isNotFound)
            mvc.perform(delete("$path/$id").with(caller(subject, authority)).with(csrf()).contentType("application/json").content("""{"revision":1}""")).andExpect(status().isNotFound)
        }
        mvc.perform(get(path).with(caller(user))).andExpect(jsonPath("$[0].revision").value(1)).andExpect(jsonPath("$[0].statement").value("Implemented payment callbacks"))
    }

    @Test fun `unauthenticated and CSRF-free claim operations fail closed`() {
        val user = profile(); val id = create(user)
        mvc.perform(get(path)).andExpect(status().isUnauthorized)
        mvc.perform(get("$path/$id/history")).andExpect(status().isUnauthorized)
        mvc.perform(post(path).with(csrf()).contentType("application/json").content(json.writeValueAsString(content()))).andExpect(status().isUnauthorized)
        for (request in listOf(post(path), put("$path/$id"), post("$path/$id/review"), delete("$path/$id"))) {
            mvc.perform(request.with(caller(user)).contentType("application/json").content("{}")).andExpect(status().isForbidden)
        }
    }

    @Test fun `status and owner injection malformed values stale revisions and repeated confirmations are rejected`() {
        val user = profile(); val id = create(user)
        for (body in listOf(content() + ("status" to "CONFIRMED"), content() + ("ownerId" to UUID.randomUUID().toString()), content() + ("skill" to ""), content() + ("statement" to "x".repeat(1001)))) {
            mvc.perform(post(path).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isBadRequest)
        }
        mvc.perform(post("$path/$id/review").with(caller(user)).with(csrf()).contentType("application/json").content("""{"decision":"CONFIRM","revision":1.5}""")).andExpect(status().isBadRequest)
        mvc.perform(post("$path/$id/review").with(caller(user)).with(csrf()).contentType("application/json").content("""{"decision":"CONFIRM","revision":9}""")).andExpect(status().isConflict)
        mvc.perform(post("$path/$id/review").with(caller(user)).with(csrf()).contentType("application/json").content("""{"decision":"CONFIRM","revision":1}""")).andExpect(status().isOk)
        mvc.perform(post("$path/$id/review").with(caller(user)).with(csrf()).contentType("application/json").content("""{"decision":"CONFIRM","revision":2}""")).andExpect(status().isBadRequest)
        mvc.perform(put("$path/$id").with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(content("Stale") + ("revision" to 1)))).andExpect(status().isConflict)
        mvc.perform(get("$path/$id/history").with(caller(user))).andExpect(jsonPath("$.total").value(2))
        mvc.perform(get("$path/not-an-id/history").with(caller(user))).andExpect(status().isBadRequest)
    }

    @Test fun `concurrent reviews produce one result and one conflict with one additional history entry`() {
        val user = profile(); val id = create(user)
        val ready = CountDownLatch(2); val start = CountDownLatch(1); val pool = Executors.newFixedThreadPool(2)
        try {
            val results = listOf("CONFIRM", "REJECT").map { decision -> pool.submit(Callable {
                ready.countDown(); check(start.await(5, TimeUnit.SECONDS))
                mvc.perform(post("$path/$id/review").with(caller(user)).with(csrf()).contentType("application/json").content("""{"decision":"$decision","revision":1}""")).andReturn().response.status
            }) }
            check(ready.await(5, TimeUnit.SECONDS)); start.countDown()
            assertThat(results.map { it.get(10, TimeUnit.SECONDS) }).containsExactlyInAnyOrder(200, 409)
            mvc.perform(get("$path/$id/history").with(caller(user))).andExpect(jsonPath("$.total").value(2))
        } finally { start.countDown(); pool.shutdownNow() }
    }

    @Test fun `explicit deletion purges claim revisions and stale deletion preserves them`() {
        val user = profile(); val id = create(user)
        mvc.perform(delete("$path/$id").with(caller(user)).with(csrf()).contentType("application/json").content("""{"revision":2}""")).andExpect(status().isConflict)
        mvc.perform(delete("$path/$id").with(caller(user)).with(csrf()).contentType("application/json").content("""{"revision":1}""")).andExpect(status().isNoContent)
        mvc.perform(get("$path/$id/history").with(caller(user))).andExpect(status().isNotFound)
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM competency_claim_revision WHERE claim_id = ?", Long::class.java, UUID.fromString(id))).isZero()
        mvc.perform(get("/api/profile/me").with(caller(user))).andExpect(status().isOk)
    }

    @Test fun `the local claim limit rejects excess entries without extra history`() {
        val user = profile(); val identity = VerifiedIdentity(issuer, user)
        repeat(500) { claims.create(identity, ClaimContent("Kotlin", "Built a service", "Synthetic project $it", "Manual recollection")) }
        assertThat(claims.list(identity)).hasSize(500)
        assertThatThrownBy { claims.create(identity, ClaimContent("Extra", "Built another service", "Synthetic", "Manual")) }
            .isInstanceOfSatisfying(ClaimFailure::class.java) { assertThat(it.code).isEqualTo("CLAIM_LIMIT") }
        assertThat(claims.list(identity)).hasSize(500)
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
