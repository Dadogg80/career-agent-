package com.careeragent.jobs.application

import com.careeragent.ai.application.AiModel
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class AdvertisementAnalysisSourceTest {
    @Test fun `explicit recommendation heading removes only the tail while retaining primary contact evidence`() {
        val main="We seek a nurse with documented clinical experience.\nContact: Primary Recruiter, primary@example.test.\nDeadline: 01.11.2026."
        val source="$main\n## Related jobs\nWe seek a salesperson with CRM experience.\nContact: Other Recruiter, other@example.test."
        assertThat(AdvertisementAnalysisSource.prepare(source)).isEqualTo(main)
        assertThat(source).startsWith(main)
        assertThat(AdvertisementAnalysisSource.prepare(main+"\nSimilar jobs are available in our nursing team.")).contains("Similar jobs are available")
    }

    @Test fun `repeated footer recommendation cards are excluded without deleting preceding metadata or contact`() {
        val main="We seek a professional consultant.\nRing Primary Recruiter\n12 34 56 78\n## Annonseinformasjon\nAd identifier: 1234"
        val card="\n- Oslo\n- 8 dager siden\nDifferent specialist\nDifferent Company\n- Bergen\n- 3 dager siden\nOther role\nOther Company"
        assertThat(AdvertisementAnalysisSource.prepare(main+card)).isEqualTo(main)
        assertThat(AdvertisementAnalysisSource.prepare(main+"\n- 8 dager siden\nPrimary consultant\nPrimary Company")).contains("Primary Company")
    }

    @Test fun `model only receives main advertisement and cannot reintroduce recommendation quotes`() {
        val primary="We seek a nurse with documented clinical experience. Contact: primary@example.test."
        val foreign="CRM experience is required. Contact: foreign@example.test."
        var calls=0
        val model=object:AiModel { override fun generateJson(system:String,user:String,schema:Map<String,Any>):String {
            calls++;assertThat(user).isEqualTo(primary)
            return """{"requirements":[{"label":"Clinical experience","kind":"REQUIRED","quote":"documented clinical experience"},{"label":"CRM","kind":"REQUIRED","quote":"CRM experience is required."}],"facts":[{"kind":"CONTACT","label":"Foreign contact","value":"foreign@example.test","quote":"Contact: foreign@example.test."}]}"""
        } }
        val result=RequirementExtractor(model,jacksonObjectMapper()).extract("$primary\nRelated jobs\n$foreign","en")
        assertThat(result.requirements.map { it.label }).containsExactly("Clinical experience")
        assertThat(result.facts).allMatch { !it.value.contains("foreign@example.test") }
        assertThat(result.omittedItems).isEqualTo(2)
        assertThat(calls).isEqualTo(1)
    }

    @Test fun `redacting recommendation headings cannot restore excluded preview lines`() {
        val primary="We seek a professional consultant with documented clinical experience.\nContact: primary@example.test."
        val foreign="CRM experience is required for the unrelated role."
        val source="$primary\nRelated jobs\n$foreign"
        val preview="We seek a professional consultant with documented clinical experience.\n$foreign"
        assertThat(AdvertisementAnalysisSource.preparePreview(source,preview))
            .isEqualTo("We seek a professional consultant with documented clinical experience.")
        assertThat(AdvertisementAnalysisSource.preparePreview(source,source)).isEqualTo(primary)
    }
}
