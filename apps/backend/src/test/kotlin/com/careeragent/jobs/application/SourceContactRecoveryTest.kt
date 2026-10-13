package com.careeragent.jobs.application

import com.careeragent.ai.application.AiModel
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class SourceContactRecoveryTest {
    @Test fun `recover exact named contact details and stop before skills and related advertisements`() {
        val source="A fictional employer seeks a consultant.\nTa gjerne kontakt med oss for en prat om stillingen!\nExample Recruiter, Head of Recruitment, e-post\njobs@example.test, tlf. 12 34 56 78\n- Teamarbeid\nRelaterte stillinger\nKontakt: Other Recruiter, other@example.test"
        var calls=0
        val model=object:AiModel { override fun generateJson(system:String,user:String,schema:Map<String,Any>):String {
            calls++;return """{"requirements":[],"facts":[]}"""
        } }
        val result=RequirementExtractor(model,jacksonObjectMapper()).extract(source,"nb")
        assertThat(result.facts).hasSize(1)
        val contact=result.facts.single()
        assertThat(contact.value).isEqualTo("Example Recruiter, Head of Recruitment, e-post\njobs@example.test, tlf. 12 34 56 78")
        assertThat(source).contains(contact.quote)
        assertThat(contact.quote).doesNotContain("Teamarbeid","Other Recruiter")
        assertThat(calls).isEqualTo(1)
    }

    @Test fun `replace partial overlapping contact wording but retain unrelated contacts and be idempotent`() {
        val source="Kontakt: Example Recruiter, jobs@example.test, 12 34 56 78."
        val partial=JobFact(JobFactKind.CONTACT,"Contact","Example Recruiter",source)
        val unrelated=JobFact(JobFactKind.CONTACT,"Other contact","Another Recruiter","Contact: Another Recruiter, other@example.test")
        val result=SourceContactRecovery.merge(source,"en",listOf(partial,unrelated))
        assertThat(result).hasSize(2)
        assertThat(result[0].value).isEqualTo(source)
        assertThat(result[0].label).isEqualTo("Contact details")
        assertThat(result[1]).isEqualTo(unrelated)
        assertThat(SourceContactRecovery.merge(source,"en",result)).isEqualTo(result)
        val broad=unrelated.copy(quote=source+"\n"+unrelated.quote,value="Example Recruiter and Another Recruiter")
        assertThat(SourceContactRecovery.merge(source,"en",listOf(broad))).contains(broad)
    }

    @Test fun `unmarked addresses generic customer contact and oversized blocks are not guessed as recruiters`() {
        assertThat(SourceContactRecovery.merge("Company: billing@example.test. Customer contact is required.","en",emptyList())).isEmpty()
        assertThat(SourceContactRecovery.merge("Du er kundens kontaktperson og ansvarlig for støtte.\nFirma: billing@example.test","nb",emptyList())).isEmpty()
        assertThat(SourceContactRecovery.merge("Kontaktperson\n"+"Long source ".repeat(50)+"jobs@example.test","nb",emptyList())).isEmpty()
        assertThat(SourceContactRecovery.merge("Relaterte stillinger\nKontakt: jobs@example.test","nb",emptyList())).isEmpty()
        assertThat(SourceContactRecovery.merge("Spørsmål om stillingen? Søknadsfrist 12-10-2026.","nb",emptyList())).isEmpty()
        assertThat(SourceContactRecovery.merge("Kontakt: tlf. 2026-2027","nb",emptyList())).isEmpty()
        assertThat(SourceContactRecovery.merge("Kontaktperson: Example Recruiter\nTelefon: ikke oppgitt\nOrganisasjonsnummer: 123456789","nb",emptyList())).isEmpty()
    }

    @Test fun `formal contact sections retain bounded blank lines and short quoted duplicates collapse`() {
        val source="Kontaktperson\n\nExample Recruiter\n\nE-post: jobs@example.test\nTelefon: 12 34 56 78\nArbeidssted: Oslo"
        val recovered=SourceContactRecovery.merge(source,"nb",emptyList()).single()
        assertThat(recovered.value).contains("Example Recruiter","jobs@example.test","12 34 56 78").doesNotContain("Arbeidssted")
        assertThat(source).contains(recovered.quote)
        val shortEmail=JobFact(JobFactKind.CONTACT,"Email","jobs@example.test","jobs@example.test")
        val shortPhone=JobFact(JobFactKind.CONTACT,"Phone","12 34 56 78","12 34 56 78")
        assertThat(SourceContactRecovery.merge(source,"nb",listOf(recovered,shortEmail,shortPhone))).containsExactly(recovered)
        assertThat(SourceContactRecovery.merge("Example Recruiter, kontaktperson\nE-post: jobs@example.test","nb",emptyList()).single().value).contains("Example Recruiter")
    }

    @Test fun `literal call labels preserve the named contact and adjacent number without borrowing a role`() {
        val source="Company information\nRing Example Recruiter\n12 34 56 78\n## Annonseinformasjon\nOther jobs"
        val contact=SourceContactRecovery.merge(source,"nb",emptyList()).single()
        assertThat(contact.value).isEqualTo("Ring Example Recruiter\n12 34 56 78")
        assertThat(contact.quote).isEqualTo(contact.value)
        assertThat(SourceContactRecovery.merge("Call Example Recruiter\n12-10-2026","en",emptyList())).isEmpty()
    }
}
