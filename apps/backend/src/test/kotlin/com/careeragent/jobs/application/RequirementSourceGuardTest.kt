package com.careeragent.jobs.application

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class RequirementSourceGuardTest {
    @Test
    fun `a short stack quote retains explicit non-interest in its containing sentence`() {
        val source = "Vi er ikke opptatt av at du har jobbet med nøyaktig samme teknologiske stack."
        assertThat(RequirementSourceGuard.omissionReason(source, "Teknologisk stack", "teknologiske stack"))
            .isEqualTo("NEGATED_STACK_EXPECTATION")
        val english = "We are not concerned whether you have worked with exactly the same technology stack."
        assertThat(RequirementSourceGuard.omissionReason(english, "Technology stack", "technology stack"))
            .isEqualTo("NEGATED_STACK_EXPECTATION")
    }

    @Test
    fun `optional qualifications and genuine prohibitions survive source guards`() {
        listOf("Azure-erfaring er ikke et krav.", "Experience with Azure is not required.",
            "You must not disclose confidential information.", "Du må ikke dele pasientopplysninger.")
            .forEach { source -> assertThat(RequirementSourceGuard.omissionReason(source, source, source))
                .describedAs(source).isNull() }
        assertThat(RequirementImportance.classify("Experience with Azure is not required.", "Azure"))
            .isEqualTo(RequirementKind.UNCLEAR)
        assertThat(RequirementImportance.classify("You must not disclose confidential information.", "confidential information"))
            .isEqualTo(RequirementKind.REQUIRED)
    }

    @Test
    fun `a repeated term is retained if another occurrence is a legitimate expectation`() {
        val source = "Vi er ikke opptatt av at du har jobbet med nøyaktig samme teknologiske stack. " +
            "Du skal videreutvikle vår teknologiske stack."
        assertThat(RequirementSourceGuard.omissionReason(source, "Stackutvikling", "teknologiske stack")).isNull()
        val repeatedBenefit = "Vi tilbyr hjemmekontor. Du må kunne arbeide fra hjemmekontor ved vakt."
        assertThat(RequirementSourceGuard.omissionReason(repeatedBenefit, "Hjemmekontor", "hjemmekontor")).isNull()
    }

    @Test
    fun `mixed statements containing a positive qualification are not globally discarded`() {
        val source = "Vi er ikke opptatt av at du har jobbet med nøyaktig samme teknologiske stack, " +
            "men du må ha solid programmeringserfaring."
        assertThat(RequirementSourceGuard.omissionReason(source, "Programmeringserfaring", source)).isNull()
        val separateSentences = "Vi er ikke opptatt av at du har jobbet med nøyaktig samme teknologiske stack. " +
            "Du skal videreutvikle vår teknologiske stack."
        assertThat(RequirementSourceGuard.omissionReason(separateSentences, "Stackutvikling", separateSentences)).isNull()
    }

    @Test
    fun `explicit benefits cannot become candidate requirements`() {
        listOf("Vi tilbyr fleksibel arbeidstid.", "We offer a competitive salary.",
            "Du får gode pensjonsordninger.", "You receive health insurance.")
            .forEach { source -> assertThat(RequirementSourceGuard.omissionReason(source, "Benefit", source))
                .describedAs(source).isEqualTo("OFFERED_BENEFIT") }
        assertThat(RequirementSourceGuard.omissionReason("Vi tilbyr fleksibel arbeidstid.",
            "Arbeidstid", "fleksibel arbeidstid")).isEqualTo("OFFERED_BENEFIT")
    }

    @Test
    fun `offer headings provide scope without leaking into responsibilities or qualifications`() {
        val source = """## Vi tilbyr

- Hjemmekontor opptil to dager i uken
- Gode pensjonsordninger
## Arbeidsoppgaver
Arbeid fra hjemmekontor etter behov
Kvalifikasjoner:
Erfaring med forsikringsordninger"""
        assertThat(RequirementSourceGuard.omissionReason(source, "Arbeidsmodell", "Hjemmekontor opptil to dager i uken"))
            .isEqualTo("OFFERED_BENEFIT")
        assertThat(RequirementSourceGuard.omissionReason(source, "Pensjon", "Gode pensjonsordninger"))
            .isEqualTo("OFFERED_BENEFIT")
        assertThat(RequirementSourceGuard.omissionReason(source, "Arbeidsmodell", "Arbeid fra hjemmekontor etter behov")).isNull()
        assertThat(RequirementSourceGuard.omissionReason(source, "Forsikring", "Erfaring med forsikringsordninger")).isNull()
    }

    @Test
    fun `offered responsibility and working pattern constraints retain candidate expectations`() {
        listOf("Vi tilbyr hjemmekontor, men du må møte på kontoret tre dager i uken.",
            "You get responsibility for pension administration.",
            "You will work with health insurance claims.",
            "Erfaring med kundebehandling.", "Arbeid med produksjonssetting og overvåking.")
            .forEach { source -> assertThat(RequirementSourceGuard.omissionReason(source, source, source))
                .describedAs(source).isNull() }
    }

    @Test
    fun `mixed benefits and positive qualifications survive even when offer scope was active`() {
        val norwegian = "Vi tilbyr fleksibel arbeidstid, men erfaring med lønn og pensjonsadministrasjon er ønskelig."
        assertThat(RequirementSourceGuard.omissionReason(norwegian, "Erfaring med lønn og pensjonsadministrasjon", norwegian)).isNull()
        val english = "We offer flexible working hours, but experience with salary and pension administration is desirable."
        assertThat(RequirementSourceGuard.omissionReason(english, "Salary and pension administration experience", english)).isNull()
        val scope = "Vi tilbyr\nHjemmekontor\nHvem søker vi?\nErfaring med pensjonsadministrasjon er ønskelig."
        assertThat(RequirementSourceGuard.omissionReason(scope, "Pensjonsadministrasjon", "Erfaring med pensjonsadministrasjon er ønskelig.")).isNull()
        val uncertainHeading = "Benefits\nInsurance\nProfessional knowledge\nExperience with salary administration"
        assertThat(RequirementSourceGuard.omissionReason(uncertainHeading, "Salary administration", "Experience with salary administration")).isNull()
    }

    @Test
    fun `a language qualification cannot introduce an additional recognizable natural language`() {
        val source = "Det er viktig å ha gode norskkunnskaper."
        assertThat(RequirementSourceGuard.omissionReason(source, "Svenske norskkunnskaper", source))
            .isEqualTo("UNSUPPORTED_LANGUAGE_LABEL")
        assertThat(RequirementSourceGuard.omissionReason(source, "Swedish proficiency", source))
            .isEqualTo("UNSUPPORTED_LANGUAGE_LABEL")
        assertThat(RequirementSourceGuard.omissionReason(source, "Norwegian proficiency", source)).isNull()
        assertThat(RequirementSourceGuard.omissionReason(source, "Kommunikasjon", source)).isNull()
    }

    @Test
    fun `language alternatives subsets and nationality or programming references are preserved`() {
        val alternatives = "You must speak Norwegian or Swedish."
        listOf("Norsk eller svensk", "Swedish proficiency", "Norwegian proficiency")
            .forEach { label -> assertThat(RequirementSourceGuard.omissionReason(alternatives, label, alternatives))
                .describedAs(label).isNull() }
        val formal = "Norsk autorisasjon er et krav."
        assertThat(RequirementSourceGuard.omissionReason(formal, "Swedish nursing authorization", formal)).isNull()
        val programming = "Du må kunne programmeringsspråkene Kotlin og Java."
        assertThat(RequirementSourceGuard.omissionReason(programming, "Programming languages", programming)).isNull()
    }

    @Test
    fun `formatting equivalent labels do not merge different qualifications or source evidence`() {
        fun requirement(label: String, quote: String = "Du må ha Kotlin og PostgreSQL.", kind: RequirementKind = RequirementKind.REQUIRED) =
            ExtractedRequirement(label, kind, quote)
        assertThat(RequirementSourceGuard.equivalent(requirement("Kotlin:"), requirement("KOTLIN."))).isTrue()
        assertThat(RequirementSourceGuard.equivalent(requirement("Kotlin"), requirement("PostgreSQL"))).isFalse()
        assertThat(RequirementSourceGuard.equivalent(requirement("Kotlin"), requirement("Kotlin", "Kotlin er ønskelig."))).isFalse()
        assertThat(RequirementSourceGuard.equivalent(requirement("Kotlin"), requirement("Kotlin", kind = RequirementKind.UNCLEAR))).isFalse()
        assertThat(RequirementSourceGuard.equivalent(requirement("Kotlin erfaring"), requirement("Kotlin"))).isFalse()
    }
}
