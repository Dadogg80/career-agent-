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
        val result = extractor("""{"facts":[],"requirements":[{"label":"Kotlin","kind":"REQUIRED","quote":"Du må ha erfaring med Kotlin."}]}""")
            .extract(source, "nb")
        assertThat(result.requirements).containsExactly(ExtractedRequirement("Kotlin", RequirementKind.REQUIRED, "Du må ha erfaring med Kotlin."))
    }

    @Test
    fun `rejects a quotation invented by the model`() {
        assertInvalid("""{"facts":[],"requirements":[{"label":"Kafka","kind":"REQUIRED","quote":"Du må kunne Kafka."}]}""")
    }

    @Test
    fun `rejects invalid classification and malformed output`() {
        assertInvalid("""{"facts":[],"requirements":[{"label":"Kotlin","kind":"CONFIRMED","quote":"Kotlin"}]}""")
        assertInvalid("not JSON")
        assertInvalid("""{"facts":[],"requirements":null}""")
        assertInvalid("""{"facts":[],"requirements":[{"label":"","kind":"REQUIRED","quote":"Kotlin"}]}""")
    }

    @Test
    fun `accepts no requirements without inventing any`() {
        assertThat(extractor("""{"facts":[],"requirements":[]}""").extract(source, "en").requirements).isEmpty()
    }

    @Test
    fun `normalizes whitespace in evidence without accepting new words`() {
        val result = extractor("""{"facts":[],"requirements":[{"label":"Kotlin","kind":"REQUIRED","quote":"Du må ha\n erfaring med Kotlin."}]}""")
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


    @Test
    fun `accepts useful source backed facts without requiring all metadata`() {
        val result = extractor("""{"requirements":[],"facts":[{"kind":"ROLE","label":"Rolle","value":"Utvikler","quote":"Vi søker en utvikler."}]}""").extract(source, "nb")
        assertThat(result.facts).containsExactly(JobFact(JobFactKind.ROLE, "Rolle", "Utvikler", "Vi søker en utvikler."))
    }

    @Test
    fun `rejects invented fact quotes invalid kinds and unbounded metadata`() {
        assertInvalid("""{"requirements":[],"facts":[{"kind":"COMPANY","label":"Bedrift","value":"Example","quote":"Unknown company"}]}""")
        assertInvalid("""{"requirements":[],"facts":[{"kind":"GUESS","label":"Rolle","value":"Utvikler","quote":"utvikler"}]}""")
        assertInvalid("""{"requirements":[]} """)
        assertInvalid("""{"requirements":[],"facts":[{"kind":"ROLE","label":"Rolle","value":"${"x".repeat(501)}","quote":"utvikler"}]}""")
    }

    @Test
    fun `one unsupported fact does not discard valid sourced requirements`() {
        val result = extractor("""{"requirements":[{"label":"Kotlin","kind":"REQUIRED","quote":"Du må ha erfaring med Kotlin."}],"facts":[{"kind":"LOCATION","label":"Lokasjon","value":"Oslo","quote":"Kontoret ligger i Oslo."}]}""").extract(source, "nb")
        assertThat(result.requirements).hasSize(1)
        assertThat(result.facts).isEmpty()
        assertThat(result.omittedItems).isEqualTo(1)
    }

    @Test
    fun `unsupported requirements are omitted while source backed facts remain`() {
        val result = extractor("""{"requirements":[{"label":"Kafka","kind":"REQUIRED","quote":"Kafka er nødvendig."}],"facts":[{"kind":"ROLE","label":"Rolle","value":"Utvikler","quote":"Vi søker en utvikler."}]}""").extract(source, "nb")
        assertThat(result.requirements).isEmpty()
        assertThat(result.facts).hasSize(1)
        assertThat(result.omittedItems).isEqualTo(1)
    }

    @Test
    fun `Unicode whitespace differences do not introduce new words`() {
        val result = extractor("""{"requirements":[{"label":"Kotlin","kind":"REQUIRED","quote":"Du må ha\u00a0erfaring med Kotlin."}],"facts":[]}""").extract(source, "nb")
        assertThat(result.requirements).hasSize(1)
        assertThat(result.omittedItems).isZero()
    }

    private fun assertInvalid(result: String) {
        assertThatThrownBy { extractor(result).extract(source, "nb") }
            .isInstanceOf(AiFailure::class.java).hasMessage("AI_INVALID_RESULT")
    }
}
