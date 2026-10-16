package com.careeragent.jobs.application

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class SourceDutyRecoveryTest {
    @Test fun `recovered duties pass through the same bounded extractor without another provider call`() {
        val source = "A fictional employer seeks a coordinator.\nResponsibilities\n- Coordinate care with colleagues.\nQualifications\nRelevant experience"
        var calls = 0
        val mapper = com.fasterxml.jackson.module.kotlin.jacksonObjectMapper()
        val model = object: com.careeragent.ai.application.AiModel {
            override fun generateJson(system:String,user:String,schema:Map<String,Any>):String {
                calls++
                return "{\"requirements\":[],\"facts\":[]}"
            }
        }
        val result = RequirementExtractor(model,mapper).extract(source,"en")
        assertThat(calls).isEqualTo(1)
        assertThat(result.requirements.single().quote).isEqualTo("- Coordinate care with colleagues.")
        assertThat(result.omittedItems).isZero()
        val large = "A fictional employer seeks a coordinator.\nResponsibilities\n" + (1..140).joinToString("\n") { "- Coordinate distinct service number $it." } + "\nQualifications\nRelevant experience"
        val bounded = RequirementExtractor(model,mapper).extract(large,"en")
        assertThat(bounded.requirements).hasSize(JobAnalysisLimits.REQUIREMENTS)
        assertThat(bounded.omittedItems).isEqualTo(12)
    }

    @Test fun `explicit duties survive an otherwise qualifications-only model result`() {
        val source = "Main duties\n- Maintain accurate patient records.\n- Coordinate care with colleagues.\nQualifications\nNursing authorization\nBenefits\nFree lunch"
        val found = SourceDutyRecovery.recover(source,emptyList())
        assertThat(found.map { it.quote }).containsExactly("- Maintain accurate patient records.","- Coordinate care with colleagues.")
        assertThat(found).allMatch { source.contains(it.quote) && it.kind == RequirementKind.UNCLEAR }
        val existing = listOf(ExtractedRequirement("Records",RequirementKind.UNCLEAR,"Maintain accurate patient records."))
        assertThat(SourceDutyRecovery.recover(source,existing).map { it.quote }).containsExactly("- Coordinate care with colleagues.")
    }
    @Test fun `plain duty rows are distinct from employer benefits and existing criteria are retained`() {
        val first = "Utvikle og vedlikeholde interne rutiner"
        val second = "Samarbeide tett med kunder og kollegaer"
        val source = "Viktigste arbeidsoppgaver\n$first\n$second\nHvem ser vi etter?\nRelevant erfaring\nHvorfor velge oss?\nGode vilkår"
        val existing = listOf(ExtractedRequirement("Rutiner",RequirementKind.UNCLEAR,first))
        assertThat(SourceDutyRecovery.recover(source,existing).map { it.quote }).containsExactly(second)
        assertThat(SourceDutyRecovery.recover("Company information\nWe build exciting products.",emptyList())).isEmpty()
    }
    @Test fun `indented duty continuations retain exact whitespace while ambiguous short rows are skipped`() {
        val quote = "- Manage customer accounts and\n  coordinate internal delivery."
        val source = "Responsibilities\n$quote\nnext line\nBenefits\n- Free transport"
        val found = SourceDutyRecovery.recover(source,emptyList())
        assertThat(found.map { it.quote }).containsExactly(quote)
        assertThat(source).contains(found.single().quote)
        val ambiguous = "Responsibilities\n- Coordinate customer deliveries.\nOur perks\nTravel with international colleagues"
        assertThat(SourceDutyRecovery.recover(ambiguous,emptyList()).map { it.quote }).containsExactly("- Coordinate customer deliveries.")
    }
    @Test fun `mandatory duty wording and alternatives retain their source scope`() {
        val source = "Arbeidsoppgaver\n- Du må følge sikkerhetsrutinene.\n- Handle orders or coordinate returns.\n## Other section\n- Free company trips"
        val found = SourceDutyRecovery.recover(source,emptyList())
        assertThat(found).hasSize(2)
        assertThat(found.first().kind).isEqualTo(RequirementKind.REQUIRED)
        assertThat(found.last().quote).isEqualTo("- Handle orders or coordinate returns.")
    }
}
