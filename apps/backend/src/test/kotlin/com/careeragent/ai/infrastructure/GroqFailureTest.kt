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
        assertThat(GroqCooldown().record("99999")).isBetween(299, 300)
    }
}
