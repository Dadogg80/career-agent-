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
    @Test fun `a preferred example retains its own importance without weakening the broader capability`() {
        val source = "Relasjonsdatabaser, gjerne MariaDB"
        assertThat(RequirementImportance.classify(source,source,"Relasjonsdatabaser")).isEqualTo(RequirementKind.UNCLEAR)
        assertThat(RequirementImportance.classify(source,source,"Erfaring med MariaDB")).isEqualTo(RequirementKind.PREFERRED)
        assertThat(RequirementImportance.classify(source,source,"Relasjonsdatabaser, gjerne MariaDB")).isEqualTo(RequirementKind.UNCLEAR)
        assertThat(RequirementImportance.classify("Relasjonsdatabaser, gjerne MariaDB\nDu må ha MariaDB.","MariaDB","MariaDB")).isEqualTo(RequirementKind.UNCLEAR)
    }

    @Test fun `split simple alternatives become one literal criterion without adding mandatory branches`() {
        val source = "A fictional employer seeks an applicant.\nFørerkort B eller vilje til å ta førerkort"
        val quote = source.substringAfter('\n')
        val mapper = jacksonObjectMapper()
        val output = mapper.writeValueAsString(mapOf("facts" to emptyList<Any>(),"requirements" to listOf("Førerkort B","Vilje til å ta førerkort").map {
            mapOf("label" to it,"kind" to "REQUIRED","quote" to quote)
        }))
        val extractor = RequirementExtractor(object: AiModel {
            override fun generateJson(system:String,user:String,schema:Map<String,Any>) = output
        },mapper)
        val result = extractor.extract(source,"nb")
        assertThat(result.requirements).containsExactly(ExtractedRequirement(quote,RequirementKind.UNCLEAR,quote))
        assertThat(result.omittedItems).isEqualTo(1)
        val compound = ExtractedRequirement("SQL",RequirementKind.UNCLEAR,"Java or Kotlin and SQL")
        assertThat(RequirementSourceGuard.preserveSimpleAlternative(compound)).isEqualTo(compound)
    }
    @Test fun `preferred examples survive explanatory labels and multiline source context across professions`() {
        val source = "Du har erfaring med flere av følgende områder:\nKundeservice\nSpråk, gjerne fransk"
        assertThat(RequirementImportance.classify(source, source, "Gjerne fransk som tillegg til språkkompetanse"))
            .isEqualTo(RequirementKind.PREFERRED)
        assertThat(RequirementImportance.classify(source, source, "Kundeservice")).isEqualTo(RequirementKind.UNCLEAR)
        assertThat(RequirementImportance.classify("Transport, gjerne pasienttransport", "Transport, gjerne pasienttransport",
            "Gjerne pasienttransport som spesialisering innen transport")).isEqualTo(RequirementKind.PREFERRED)
        assertThat(RequirementImportance.classify("Transport, gjerne pasienttransport", "Transport, gjerne pasienttransport",
            "Transport og pasienttransport")).isEqualTo(RequirementKind.UNCLEAR)
    }

}
