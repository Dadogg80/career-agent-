package com.careeragent.jobs.application

import com.careeragent.ai.application.AiModel
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class RequirementImportanceTest {
    @Test fun `explicit qualifiers and their absence govern importance independently of provider labels`() {
        val examples = mapOf(
            "Du må ha norsk autorisasjon." to RequirementKind.REQUIRED,
            "Norsk autorisasjon er et krav." to RequirementKind.REQUIRED,
            "Experience with patient assessment is required." to RequirementKind.REQUIRED,
            "Erfaring med sårbehandling er ønskelig." to RequirementKind.PREFERRED,
            "Kjennskap til DIPS er en fordel." to RequirementKind.PREFERRED,
            "Preferably you have customer service experience." to RequirementKind.PREFERRED,
            "Trives med samarbeid og deler kunnskap." to RequirementKind.UNCLEAR,
            "Experience with native iOS or Android development." to RequirementKind.UNCLEAR,
            "Azure-erfaring er ikke et krav." to RequirementKind.UNCLEAR,
            "You must not disclose confidential information." to RequirementKind.REQUIRED,
            "Du må ha mobilutviklingserfaring, helst med React Native." to RequirementKind.UNCLEAR,
        )
        examples.forEach { (text, expected) -> assertThat(RequirementImportance.classify(text, text)).describedAs(text).isEqualTo(expected) }
    }

    @Test fun `explicit list headings apply but generic emphasis and later sections do not`() {
        val source = """Obligatoriske kvalifikasjoner:
Norsk autorisasjon
Ønskede kvalifikasjoner:
Veiledningserfaring
Egenskaper vi legger ekstra vekt på:
Samarbeid
## Om oss
Arbeid med pasienter"""
        assertThat(RequirementImportance.classify(source,"Norsk autorisasjon")).isEqualTo(RequirementKind.REQUIRED)
        assertThat(RequirementImportance.classify(source,"Veiledningserfaring")).isEqualTo(RequirementKind.PREFERRED)
        assertThat(RequirementImportance.classify(source,"Samarbeid")).isEqualTo(RequirementKind.UNCLEAR)
        assertThat(RequirementImportance.classify(source,"Arbeid med pasienter")).isEqualTo(RequirementKind.UNCLEAR)
    }

    @Test fun `short quotes retain sentence qualifiers and conflicting repeated contexts remain unclear`() {
        assertThat(RequirementImportance.classify("Du må ha erfaring med Kotlin. PostgreSQL er en fordel.","Kotlin")).isEqualTo(RequirementKind.REQUIRED)
        assertThat(RequirementImportance.classify("Du må ha erfaring med Kotlin. PostgreSQL er en fordel.","PostgreSQL")).isEqualTo(RequirementKind.PREFERRED)
        assertThat(RequirementImportance.classify("Du må ha Kotlin.\nKotlin er en fordel.","Kotlin")).isEqualTo(RequirementKind.UNCLEAR)
    }

    @Test fun `contradictory model categories cannot duplicate an unsupported mandatory criterion`() {
        val source = "Example employer seeks someone with experience in native iOS or Android development."
        val mapper = jacksonObjectMapper()
        val output = mapper.writeValueAsString(mapOf("facts" to emptyList<Any>(), "requirements" to listOf("REQUIRED","PREFERRED").map {
            mapOf("label" to "Mobile experience", "kind" to it, "quote" to source)
        }))
        val extractor = RequirementExtractor(object: AiModel {
            override fun generateJson(system:String,user:String,schema:Map<String,Any>) = output
        },mapper)
        val result = extractor.extract(source,"en")
        assertThat(result.requirements).containsExactly(ExtractedRequirement("Mobile experience",RequirementKind.UNCLEAR,source))
        assertThat(result.omittedItems).isEqualTo(1)
    }
}
