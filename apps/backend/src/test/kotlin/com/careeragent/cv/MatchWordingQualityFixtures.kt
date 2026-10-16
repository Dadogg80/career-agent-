package com.careeragent.cv

import com.careeragent.jobs.domain.MatchClaim
import com.careeragent.jobs.domain.MatchKind
import java.util.UUID

/** Held-out fictional source/criterion controls; expectations are not provider input. */
internal object MatchWordingQualityFixtures {
    data class Criterion(val text: String, val expected: Set<MatchKind>, val rubric: String)
    data class Case(val id: String, val claims: List<MatchClaim>, val criteria: List<Criterion>, val cv: String,
        val wordingRubric: String) {
        val advertisement: String get() = "Vi søker en medarbeider til en fiktiv stilling.\n"+criteria.joinToString("\n") {it.text}
    }
    private fun claim(id: String, skill: String, statement: String, context: String) =
        MatchClaim(UUID.nameUUIDFromBytes(id.toByteArray()),1,skill,statement,context)
    private fun strong(text: String,rubric: String) = Criterion(text,setOf(MatchKind.STRONG),rubric)
    private fun limited(text: String,rubric: String) = Criterion(text,setOf(MatchKind.PARTIAL,MatchKind.CLARIFY),rubric)
    private fun formal(text: String) = Criterion(text,setOf(MatchKind.CLARIFY),"Patient/customer contact or related practical work does not establish the required authorization.")
    fun cases(): List<Case> = listOf(
        Case("healthcare",listOf(
            claim("care-reception","Pasientmottak","Tok imot pasienter, registrerte henvendelser og avtalte timer.","2021–2024 Eksempel Klinikk – Resepsjonsmedarbeider"),
            claim("care-course","Observasjon","Fullførte førstehjelpskurs og øvde på observasjon i kursøvelser.","2020 Eksempel Kurssted – Førstehjelpskurs"),
            claim("care-stock","Varemottak","Registrerte vareleveranser i lagersystemet.","2019–2021 Eksempel Apotek – Butikkmedarbeider"),
            claim("care-interest","Pasientlogistikk","Jeg er interessert i å lære pasientlogistikk.","Personlig interesse")
        ),listOf(
            strong("Erfaring med pasientmottak og timeavtaler.","The reception contribution covers both activities."),
            formal("Norsk autorisasjon som sykepleier er påkrevd."),
            strong("Erfaring med pasientlogistikk eller interesse for å lære dette.","Explicit interest satisfies the offered alternative without professional delivery."),
            limited("Selvstendig klinisk observasjon av pasienter.","Course exercises do not establish independent clinical practice.")
        ),"""Fiktiv kandidat

PROFIL
Erfaring fra resepsjon og butikk.

FERDIGHETER
Pasientkontakt og registrering

ARBEIDSERFARING
2021–2024 Eksempel Klinikk – Resepsjonsmedarbeider
Arbeidet i resepsjonen.

2019–2021 Eksempel Apotek – Butikkmedarbeider
Arbeidet med varemottak.

UTDANNING
2020 Eksempel Kurssted – Førstehjelpskurs
Førstehjelp og øvelser i observasjon.
""", "Keep observation at course scope, never imply nursing authorization or clinical independence; keep pharmacy stock work separate from clinic work."),
        Case("retail",listOf(
            claim("retail-customers","Kundeservice","Besvarte produktspørsmål og registrerte bestillinger fra kunder.","2021–2024 Eksempel Nordtorget – Butikkmedarbeider"),
            claim("retail-shifts","Vaktplanlegging","Laget bemanningsplaner og fordelte arbeidsoppgaver.","2021–2024 Eksempel Nordtorget – Butikkmedarbeider"),
            claim("retail-parallel","Salg","Bisto med salg ved siden av den andre butikkstillingen.","2022–2025 Eksempel Markedshuset – Deltidsmedarbeider"),
            claim("retail-interest","Lagersystemer","Jeg er interessert i å lære nye lagersystemer.","Personlig interesse")
        ),listOf(
            strong("Erfaring med produktveiledning og kundebestillinger.","The documented customer activities support this capability."),
            limited("Personalansvar med oppfølging av sykefravær.","Shift coordination does not establish personnel or absence-management responsibility."),
            limited("Minst fem års salgserfaring.","Overlapping employment periods cannot be added, and the source does not establish five years of sales activity."),
            strong("Erfaring med SAP eller interesse for å lære lagersystemer.","Interest is an explicitly sufficient branch; it does not establish SAP experience.")
        ),"""Fiktiv butikkandidat

PROFIL
Erfaring fra butikkarbeid.

FERDIGHETER
Kundeservice
Vaktplanlegging

ARBEIDSERFARING
2021–2024 Eksempel Nordtorget – Butikkmedarbeider
Besvarte spørsmål fra kunder og hjalp til med planlegging.

2022–2025 Eksempel Markedshuset – Deltidsmedarbeider
Bisto med salg ved siden av butikkstillingen.
""", "Do not invent personnel/budget/absence-management responsibility, SAP experience or five years of sales; preserve parallel roles and each employer."),
        Case("trades",listOf(
            claim("trade-inspection","Kontroll","Utførte visuelle kontroller og registrerte avvik med støtte fra fagansvarlig.","2022–2024 Eksempel Service – Verkstedmedarbeider"),
            claim("trade-mechanics","Montering","Deltok i mekanisk montering under veiledning.","2020–2022 Eksempel Verksted – Assistent"),
            claim("trade-proposal","Vedlikehold","Foreslo en sjekkliste for vedlikehold som fortsatt er i planleggingsfasen.","2022–2024 Eksempel Service – Verkstedmedarbeider")
        ),listOf(
            strong("Erfaring med visuelle kontroller og registrering av avvik.","Supervised own inspection activity satisfies this criterion; independence is not requested."),
            formal("Fagbrev som elektriker er påkrevd."),
            limited("Erfaring med å innføre nye vedlikeholdsrutiner i drift.","A planned checklist does not establish implementation or operational delivery."),
            strong("Fagbrev som industrimekaniker eller relevant praksis med mekanisk montering.","Documented supervised assembly is relevant practice under the offered alternative; it does not establish a trade certificate.")
        ),"""Fiktiv verkstedkandidat

PROFIL
Praktisk erfaring fra verksted.

FERDIGHETER
Kontroll og mekanisk montering

ARBEIDSERFARING
2022–2024 Eksempel Service – Verkstedmedarbeider
Arbeidet med kontroll og forbedringsforslag.

2020–2022 Eksempel Verksted – Assistent
Hjalp til med montering.
""", "Preserve supervision and planned status. Do not invent electrical authorization, a trade certificate, independent certification or implemented routines; do not transfer assembly to the service employer.")
    )
}
