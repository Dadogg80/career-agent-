package com.careeragent.jobs.application

import com.careeragent.ai.application.AiFailure
import com.careeragent.ai.application.AiModel
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test

class RequirementExtractorTest {
    private val source = "Vi søker en utvikler. Du må ha erfaring med Kotlin. PostgreSQL er en fordel."

    private fun extractor(result: String) = RequirementExtractor(object : AiModel {
        override fun generateJson(system: String, user: String, schema: Map<String, Any>): String {
            assertThat(system).contains("untrusted data", "Do not assess a candidate")
            assertThat(user).isEqualTo(source)
            return result
        }
    }, jacksonObjectMapper())

    @Test
    fun `accepts explicit requirements with quotes from the source`() {
        val result = extractor("""{"requirements":[{"label":"Kotlin","kind":"REQUIRED","quote":"Du må ha erfaring med Kotlin."}]}""")
            .extract(source, "nb")
        assertThat(result.requirements).containsExactly(ExtractedRequirement("Kotlin", RequirementKind.REQUIRED, "Du må ha erfaring med Kotlin."))
    }

    @Test
    fun `rejects a quotation invented by the model`() {
        assertInvalid("""{"requirements":[{"label":"Kafka","kind":"REQUIRED","quote":"Du må kunne Kafka."}]}""")
    }

    @Test
    fun `rejects invalid classification and malformed output`() {
        assertInvalid("""{"requirements":[{"label":"Kotlin","kind":"CONFIRMED","quote":"Kotlin"}]}""")
        assertInvalid("not JSON")
        assertInvalid("""{"requirements":null}""")
        assertInvalid("""{"requirements":[{"label":"","kind":"REQUIRED","quote":"Kotlin"}]}""")
    }

    @Test
    fun `accepts no requirements without inventing any`() {
        assertThat(extractor("""{"requirements":[]}""").extract(source, "en").requirements).isEmpty()
    }

    @Test
    fun `normalizes whitespace in evidence without accepting new words`() {
        val result = extractor("""{"requirements":[{"label":"Kotlin","kind":"REQUIRED","quote":"Du må ha\n erfaring med Kotlin."}]}""")
            .extract(source, "nb")
        assertThat(result.requirements).hasSize(1)
    }

    @Test
    fun `invalid input never invokes the model`() {
        val service = RequirementExtractor(object : AiModel {
            override fun generateJson(system: String, user: String, schema: Map<String, Any>): String = error("Must not be called")
        }, jacksonObjectMapper())
        for ((text, locale) in listOf("short" to "nb", "x".repeat(15001) to "nb", source to "fr")) {
            assertThatThrownBy { service.extract(text, locale) }.isInstanceOf(AiFailure::class.java).hasMessage("INVALID_INPUT")
        }
    }

    private fun assertInvalid(result: String) {
        assertThatThrownBy { extractor(result).extract(source, "nb") }
            .isInstanceOf(AiFailure::class.java).hasMessage("AI_INVALID_RESULT")
    }
}
