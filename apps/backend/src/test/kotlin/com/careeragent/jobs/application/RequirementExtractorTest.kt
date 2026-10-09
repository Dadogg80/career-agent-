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

    @Test
    fun `advertised applicant and offer sections retain original wording in one call`() {
        var calls = 0
        val text = "Vi er et lokalt selskap. Du liker samarbeid. Vi tilbyr fleksibel arbeidstid. Kontakt: Kari Test, kari@example.test."
        val service = RequirementExtractor(object : AiModel {
            override fun generateJson(system: String, user: String, schema: Map<String, Any>): String {
                calls++
                assertThat(system).contains("Prioritize CONTACT", "never the application's user", "APPLICANT", "OFFER")
                assertThat(jacksonObjectMapper().writeValueAsString(schema)).contains("APPLICANT", "OFFER")
                return """{"requirements":[],"facts":[{"kind":"APPLICANT","label":"Hvem de søker","value":"Samarbeid","quote":"Du liker samarbeid."},{"kind":"OFFER","label":"Tilbud","value":"Fleksibel arbeidstid","quote":"Vi tilbyr fleksibel arbeidstid."},{"kind":"CONTACT","label":"Kontakt","value":"Kari Test","quote":"Kontakt: Kari Test, kari@example.test."}]}"""
            }
        }, jacksonObjectMapper())
        val result = service.extract(text, "nb")
        assertThat(result.facts.map { it.kind }).containsExactly(JobFactKind.APPLICANT, JobFactKind.OFFER, JobFactKind.CONTACT)
        assertThat(result.facts[0].quote).isEqualTo("Du liker samarbeid.")
        assertThat(calls).isEqualTo(1)
    }

    @Test
    fun `invalid analysis reports only a safe failure category`() {
        try { extractor("not JSON").extract(source, "nb"); error("Must fail") }
        catch (failure: AiFailure) { assertThat(failure.reason).isEqualTo("MALFORMED_JSON") }
        try { extractor("""{"facts":[],"requirements":[{"label":"Other","kind":"REQUIRED","quote":"Invented source words"}]}""").extract(source, "nb"); error("Must fail") }
        catch (failure: AiFailure) { assertThat(failure.reason).isEqualTo("NO_SUPPORTED_ITEMS") }
    }

    @Test
    fun `an overlong narrative does not discard valid requirements or contact information`() {
        var calls = 0
        val text = source + " Kontakt: Kari Test, kari@example.test."
        val service = RequirementExtractor(object : AiModel {
            override fun generateJson(system: String, user: String, schema: Map<String, Any>): String {
                calls++
                return jacksonObjectMapper().writeValueAsString(mapOf(
                    "requirements" to listOf(mapOf("label" to "Kotlin", "kind" to "REQUIRED", "quote" to "Du må ha erfaring med Kotlin.")),
                    "facts" to listOf(
                        mapOf("label" to "Bedrift", "kind" to "COMPANY", "value" to "x".repeat(501), "quote" to "Vi søker en utvikler."),
                        mapOf("label" to "Kontakt", "kind" to "CONTACT", "value" to "Kari Test", "quote" to "Kontakt: Kari Test, kari@example.test."),
                    ),
                ))
            }
        }, jacksonObjectMapper())
        val result = service.extract(text, "nb")
        assertThat(result.requirements.map { it.label }).containsExactly("Kotlin")
        assertThat(result.facts.map { it.kind }).containsExactly(JobFactKind.CONTACT)
        assertThat(result.omittedItems).isEqualTo(1)
        assertThat(calls).isEqualTo(1)
    }

    @Test
    fun `malformed individual items are omitted without bypassing evidence or classification checks`() {
        val invalid = listOf<Any?>(
            null, "Kotlin", mapOf("label" to listOf("Kotlin"), "kind" to "REQUIRED", "quote" to "Kotlin"),
            mapOf("label" to "Kotlin", "kind" to "CONFIRMED", "quote" to "Kotlin"),
            mapOf("label" to "Kotlin", "kind" to "REQUIRED", "quote" to "x".repeat(601)),
            mapOf("label" to "Kotlin", "kind" to "REQUIRED", "quote" to "Invented wording"),
        )
        val result = extractor(jacksonObjectMapper().writeValueAsString(mapOf(
            "requirements" to invalid + mapOf("label" to "Kotlin", "kind" to "REQUIRED", "quote" to "Kotlin"),
            "facts" to listOf(mapOf("label" to "Rolle", "value" to "Utvikler", "kind" to "GUESS", "quote" to "utvikler")),
        ))).extract(source, "nb")
        assertThat(result.requirements).containsExactly(ExtractedRequirement("Kotlin", RequirementKind.REQUIRED, "Kotlin"))
        assertThat(result.facts).isEmpty()
        assertThat(result.omittedItems).isEqualTo(7)
    }

    @Test
    fun `oversized arrays retain bounded valid items and report every omission`() {
        val result = extractor(jacksonObjectMapper().writeValueAsString(mapOf(
            "requirements" to List(129) { mapOf("label" to "Criterion $it", "kind" to "REQUIRED", "quote" to "Kotlin") },
            "facts" to List(11) { mapOf("label" to "Rolle", "value" to "Utvikler", "kind" to "ROLE", "quote" to "utvikler") },
        ))).extract(source, "en")
        assertThat(result.requirements).hasSize(128)
        assertThat(result.facts).hasSize(10)
        assertThat(result.omittedItems).isEqualTo(2)
    }

    @Test
    fun `invalid items do not consume the retained result capacity`() {
        val result = extractor(jacksonObjectMapper().writeValueAsString(mapOf(
            "requirements" to List(12) { mapOf("label" to "", "kind" to "REQUIRED", "quote" to "Kotlin") } +
                mapOf("label" to "Kotlin", "kind" to "REQUIRED", "quote" to "Kotlin"), "facts" to emptyList<Any>(),
        ))).extract(source, "nb")
        assertThat(result.requirements).hasSize(1)
        assertThat(result.omittedItems).isEqualTo(12)
    }

    @Test
    fun `inspection is bounded even when the model returns hundreds of items`() {
        val result = extractor(jacksonObjectMapper().writeValueAsString(mapOf(
            "requirements" to List(200) { mapOf("label" to "Criterion $it", "kind" to "REQUIRED", "quote" to "Kotlin") },
            "facts" to emptyList<Any>(),
        ))).extract(source, "nb")
        assertThat(result.requirements).hasSize(128)
        assertThat(result.omittedItems).isEqualTo(72)
    }

    @Test
    fun `invalid top level containers remain structural errors`() {
        for (json in listOf("[]", "null", "{\"requirements\":[],\"facts\":{}}")) {
            assertThatThrownBy { extractor(json).extract(source, "nb") }
                .isInstanceOfSatisfying(AiFailure::class.java) { assertThat(it.reason).isEqualTo("INVALID_STRUCTURE") }
        }
    }

    @Test
    fun `all sourced nursing requirements including late licenses and shifts survive one extraction call`() {
        val criteria = listOf("patient assessment", "medication administration", "infection prevention", "wound care",
            "clinical documentation", "care planning", "patient safety", "family communication", "team collaboration",
            "handover", "emergency response", "clinical equipment", "quality improvement", "confidentiality",
            "Norwegian communication", "supervision", "electronic patient records", "shift work",
            "a current nursing authorization", "documented intensive care experience")
        val quotes = criteria.map { "You must have experience with $it." }
        val text = "Fictional nursing role.\n" + quotes.joinToString("\n")
        var calls = 0
        val service = RequirementExtractor(object : AiModel {
            override fun generateJson(system: String, user: String, schema: Map<String, Any>): String {
                calls++
                assertThat(system).contains("every distinct", "beginning, middle and end", "licenses/authorizations", "A or equivalent B")
                assertThat(user).isEqualTo(text)
                return jacksonObjectMapper().writeValueAsString(mapOf("requirements" to criteria.mapIndexed { i, label ->
                    mapOf("label" to label, "kind" to "REQUIRED", "quote" to quotes[i]) }, "facts" to emptyList<Any>()))
            }
        }, jacksonObjectMapper())
        val result = service.extract(text, "en")
        assertThat(result.requirements.map { it.label }).containsExactlyElementsOf(criteria)
        assertThat(result.requirements.last().quote).isEqualTo(quotes.last())
        assertThat(result.omittedItems).isZero()
        assertThat(calls).isEqualTo(1)
    }

    @Test
    fun `exact repeated criteria cannot inflate matching while distinct qualifications sharing a sentence remain`() {
        val items = listOf(
            mapOf("label" to "Kotlin", "kind" to "REQUIRED", "quote" to "Du må ha erfaring med Kotlin."),
            mapOf("label" to "kotlin", "kind" to "REQUIRED", "quote" to "Du må ha\n erfaring med Kotlin."),
            mapOf("label" to "Practical experience", "kind" to "REQUIRED", "quote" to "Du må ha erfaring med Kotlin."))
        val result = extractor(jacksonObjectMapper().writeValueAsString(mapOf("requirements" to items, "facts" to emptyList<Any>()))).extract(source,"en")
        assertThat(result.requirements.map { it.label }).containsExactly("Kotlin", "Practical experience")
        assertThat(result.omittedItems).isEqualTo(1)
    }

    private fun assertInvalid(result: String) {
        assertThatThrownBy { extractor(result).extract(source, "nb") }
            .isInstanceOf(AiFailure::class.java).hasMessage("AI_INVALID_RESULT")
    }
}
