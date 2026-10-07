package com.careeragent.jobs.api

import com.careeragent.ai.application.AiFailure
import com.careeragent.ai.application.AiModel
import com.careeragent.jobs.application.RequirementExtractor
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class RequirementsBudgetTest {
    private val request = ExtractionRequest("We require experience with Kotlin and PostgreSQL for this role.")

    @Test
    fun `process budget prevents further calls even after provider failure`() {
        var calls = 0
        val extractor = RequirementExtractor(object : AiModel {
            override fun generateJson(system: String, user: String, schema: Map<String, Any>): String {
                calls++
                throw AiFailure("AI_UNAVAILABLE", 503)
            }
        }, jacksonObjectMapper())
        val controller = RequirementsController(extractor, 1)
        assertThatThrownBy { controller.extract(request) }.hasMessage("AI_UNAVAILABLE")
        assertThatThrownBy { controller.extract(request) }.hasMessage("AI_BUDGET_REACHED")
        assertThat(calls).isEqualTo(1)
    }

    @Test
    fun `only one inference can be in flight and permit is released`() {
        val started = CountDownLatch(1)
        val release = CountDownLatch(1)
        val extractor = RequirementExtractor(object : AiModel {
            override fun generateJson(system: String, user: String, schema: Map<String, Any>): String {
                started.countDown()
                check(release.await(5, TimeUnit.SECONDS))
                return """{"facts":[],"requirements":[]}"""
            }
        }, jacksonObjectMapper())
        val controller = RequirementsController(extractor, 3)
        val executor = Executors.newSingleThreadExecutor()
        try {
            val first = executor.submit<Any> { controller.extract(request) }
            assertThat(started.await(5, TimeUnit.SECONDS)).isTrue()
            assertThatThrownBy { controller.extract(request) }.hasMessage("AI_BUSY")
            release.countDown()
            first.get(5, TimeUnit.SECONDS)
            controller.extract(request)
        } finally {
            release.countDown()
            executor.shutdownNow()
        }
    }
}
