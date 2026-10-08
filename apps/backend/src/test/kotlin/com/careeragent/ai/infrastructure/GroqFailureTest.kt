package com.careeragent.ai.infrastructure

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class GroqFailureTest {
    @Test fun `schema failure is distinguished without exposing provider payload`() {
        val model = GroqAiModel(jacksonObjectMapper(), "", "openai/gpt-oss-20b", GroqCooldown())
        val failure = model.providerFailure(400, """{"error":{"code":"json_validate_failed","failed_generation":"PRIVATE CONTENT"}}""", null)!!
        assertThat(failure.code).isEqualTo("AI_INVALID_RESULT")
        assertThat(failure.httpStatus).isEqualTo(502)
        assertThat(failure.reason).isEqualTo("PROVIDER_SCHEMA_MISMATCH")
        assertThat(failure.message).doesNotContain("PRIVATE CONTENT")
        assertThat(model.providerFailure(400, "malformed", null)!!.code).isEqualTo("AI_UNAVAILABLE")
    }
    @Test fun `rate failure records bounded shared cooldown for later calls`() {
        val cooldown = GroqCooldown()
        val model = GroqAiModel(jacksonObjectMapper(), "", "openai/gpt-oss-20b", cooldown)
        assertThat(cooldown.remainingSeconds()).isZero()
        val failure = model.providerFailure(429, "", "15.4725")!!
        assertThat(failure.retryAfterSeconds).isBetween(15, 16)
        assertThat(cooldown.remainingSeconds()).isBetween(15, 16)
        cooldown.record("1")
        assertThat(cooldown.remainingSeconds()).isBetween(15, 16)
    }
    @Test fun `absent malformed and oversized retry hints remain bounded`() {
        assertThat(GroqCooldown().record(null)).isBetween(59, 60)
        assertThat(GroqCooldown().record("bad value")).isBetween(59, 60)
        assertThat(GroqCooldown().record("Infinity")).isBetween(59, 60)
        assertThat(GroqCooldown().record("99999")).isBetween(86399, 86400)
        assertThat(GroqCooldown().record("-5")).isBetween(59, 60)
        assertThat(GroqCooldown().record("NaN")).isBetween(59, 60)
    }

    @Test fun `daily quota waits are preserved when provided only in the Groq message`() {
        val cooldown = GroqCooldown()
        val model = GroqAiModel(jacksonObjectMapper(), "", "openai/gpt-oss-20b", cooldown)
        val failure = model.providerFailure(429, """{"error":{"message":"Rate limit reached on tokens per day (TPD). Please try again in 16m7.68s. Private account details."}}""", null)!!
        assertThat(failure.retryAfterSeconds).isBetween(967, 968)
        assertThat(failure.message).isEqualTo("AI_RATE_LIMITED")
        assertThat(failure.reason).isNull()
        // Quota feedback is shared across features and prevents another provider call.
        org.assertj.core.api.Assertions.assertThatThrownBy { model.generateJson("system", "input", emptyMap()) }
            .isInstanceOfSatisfying(com.careeragent.ai.application.AiFailure::class.java) { assertThat(it.code).isEqualTo("AI_RATE_LIMITED") }
        org.assertj.core.api.Assertions.assertThatThrownBy {
            com.careeragent.jobs.infrastructure.GroqBrowserTransport(jacksonObjectMapper(), "", cooldown).complete(emptyMap())
        }.isInstanceOfSatisfying(com.careeragent.jobs.application.ImportFailure::class.java) { assertThat(it.code).isEqualTo("SOURCE_RATE_LIMITED") }
    }

    @Test fun `a shorter header does not override the longer daily quota hint`() {
        assertThat(GroqCooldown().record("300", "Please try again in 16m7.68s.")).isBetween(967, 968)
        assertThat(GroqCooldown().record("1200", "Please try again in 15.4725s.")).isBetween(1199, 1200)
        assertThat(GroqCooldown().record(null, "Please try again in 1h2m3s.")).isBetween(3722, 3723)
        assertThat(GroqCooldown().record(null, "Untrusted malformed duration")).isBetween(59, 60)
    }

    @Test fun `standard HTTP date retry hints are supported`() {
        val date = java.time.ZonedDateTime.now(java.time.ZoneOffset.UTC).plusMinutes(20)
            .format(java.time.format.DateTimeFormatter.RFC_1123_DATE_TIME)
        assertThat(GroqCooldown().record(date)).isBetween(1198, 1200)
    }
}
