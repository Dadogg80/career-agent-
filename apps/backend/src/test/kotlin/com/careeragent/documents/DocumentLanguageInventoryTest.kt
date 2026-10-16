package com.careeragent.documents

import com.careeragent.documents.application.DocumentAnalysisPlanner
import com.careeragent.documents.application.DocumentCompetencyInventory
import com.careeragent.documents.application.DocumentLanguageInventory
import com.careeragent.documents.domain.AnalysisBatch
import com.careeragent.documents.domain.CompetencySuggestion
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.util.UUID

class DocumentLanguageInventoryTest {
    private val id = UUID.randomUUID()
    private fun recover(source: String) = DocumentLanguageInventory.recover(AnalysisBatch(id, source, source.length), source, "nb", emptyList())

    @Test fun `table section and first language sharing a row retain the complete literal evidence`() {
        val source = "Språk Norsk – morsmål\nItaliensk – morsmål\nEngelsk – flytende, muntlig og skriftlig\nInteresser Fotturer"
        val result = recover(source)
        assertThat(result.map { it.skill }).containsExactly("Norsk","Italiensk","Engelsk")
        assertThat(result.first().quote).isEqualTo("Språk Norsk – morsmål")
        assertThat(result).allMatch { source.contains(it.quote) && it.contextQuote == null }
        assertThat(recover("Språk jeg ønsker å lære\nSpansk")).isEmpty()
        assertThat(recover("Languages Java, Kotlin")).isEmpty()
    }

    @Test fun `explicit CV language rows retain mother tongue and written oral wording without an inferred level`() {
        val source = "Språk\n\nNorsk  – morsmål \nItaliensk – morsmål\nEngelsk – flytende, muntlig og skriftlig\nInteresser\nCycling"
        val found = recover(source)
        assertThat(found.map { it.skill }).containsExactly("Norsk", "Italiensk", "Engelsk")
        assertThat(found.map { it.statement }).containsExactly("Norsk  – morsmål", "Italiensk – morsmål", "Engelsk – flytende, muntlig og skriftlig")
        assertThat(found).allMatch { source.contains(it.quote) && it.recovered && !it.drafted && it.category == "OTHER" && it.contextQuote == null }
        assertThat(found.map { it.context }).containsOnly("Kontekst ikke oppgitt")
        assertThat(found.map { it.statement }.joinToString()).doesNotContain("C1", "C2")
    }

    @Test fun `table labels and levels on separate rows retain the exact contiguous quotation`() {
        val source = "Language skills\nNorwegian\n  – mother tongue\nEnglish\n\n– fluent, spoken and written\nHindi\nB2\nWork experience\nExample Clinic"
        val found = recover(source)
        assertThat(found.map { it.skill }).containsExactly("Norwegian", "English", "Hindi")
        assertThat(found.map { it.quote }).containsExactly("Norwegian\n  – mother tongue", "English\n\n– fluent, spoken and written", "Hindi\nB2")
        assertThat(found).allMatch { source.contains(it.quote) }
    }

    @Test fun `a table row split across portions is recovered once only after its whole level is processed`() {
        val source = "Språk\nNorsk\n  – morsmål\nEngelsk – flytende, muntlig og skriftlig"
        val end = source.indexOf("morsmål") + 3
        val first = AnalysisBatch(id, source.substring(0, end), end)
        val second = AnalysisBatch(id, source.substring(end), source.length - end, end)
        assertThat(DocumentLanguageInventory.recover(first, source, "nb", emptyList())).isEmpty()
        val found = DocumentLanguageInventory.recover(second, source, "nb", emptyList())
        assertThat(found.map { it.skill }).containsExactly("Norsk", "Engelsk")
        assertThat(found.first().quote).isEqualTo("Norsk\n  – morsmål")
    }

    @Test fun `wrapped oral and written qualifiers retain their whole literal proof without swallowing narrative`() {
        val source = "Språk\nEngelsk – flytende, muntlig og\nskriftlig\nNorsk – morsmål\nArbeidet med kundebehandling."
        val found = recover(source)
        assertThat(found.map { it.skill }).containsExactly("Engelsk", "Norsk")
        assertThat(found.first().quote).isEqualTo("Engelsk – flytende, muntlig og\nskriftlig")
        assertThat(found.last().quote).isEqualTo("Norsk – morsmål")
    }

    @Test fun `language section state persists through automatic portions and no employer is borrowed`() {
        val source = "## Example Hospital\nNurse\nSpråkkunnskaper\n" + "\n".repeat(3650) + "Arabisk – morsmål\nFransk – flytende\nInteresser\nSpansk"
        val batches = DocumentAnalysisPlanner.batches(mapOf(id to source))
        val found = batches.flatMap { DocumentCompetencyInventory.recover(it, source, "nb", emptyList()) }
        assertThat(batches).hasSizeGreaterThan(1)
        assertThat(found.map { it.skill }).containsExactly("Arabisk", "Fransk")
        assertThat(found.map { it.context }).containsOnly("Kontekst ikke oppgitt")
        assertThat(DocumentAnalysisPlanner.contextHeader(source, source.indexOf("Arabisk"))).isNull()
    }

    @Test fun `negative planned desired and programming language rows are not natural language facts`() {
        val source = "Språk\nNorsk – ikke flytende\nEngelsk – ønsker å lære\nLanguages\nJava\nKotlin\nRust\n" +
            "Norsk\nplanlegger å lære\nLanguage proficiency\nGerman – not fluent\nFrench – learning\nSpanish – no experience"
        assertThat(recover(source)).isEmpty()
        assertThat(recover("Norsk\nItaliensk\nNationality: Norwegian")).isEmpty()
        assertThat(recover("Språk jeg ønsker å lære\nSpansk\nPortugisisk")).isEmpty()
        val techFallback = "Languages: English - want to learn\nLanguages: French - wish to learn\nLanguages: German - learning\nLanguages: Want English"
        assertThat(DocumentCompetencyInventory.recover(AnalysisBatch(id, techFallback, techFallback.length), techFallback, "en", emptyList())).isEmpty()
        assertThat(recover("Språk\nNorsk – ikke flytende\nEngelsk\nInteresser\nItaliensk").map { it.skill }).containsExactly("Engelsk")
    }

    @Test fun `generic Languages sections retain technology and natural language recovery without misclassification`() {
        val source = "Languages\nNorwegian\nEnglish\nLanguages: Java, Kotlin"
        val found = DocumentCompetencyInventory.recover(AnalysisBatch(id, source, source.length), source, "en", emptyList())
        assertThat(found.filter { it.category == "OTHER" }.map { it.skill }).containsExactly("Norwegian", "English")
        assertThat(found.filter { it.category == "TECHNOLOGY" }.map { it.skill }).containsExactly("Java", "Kotlin")
        assertThat(found.map { it.skill }).doesNotHaveDuplicates()
    }

    @Test fun `several literal languages with a shared level and an inline heading preserve one source row`() {
        val source = "Språk: Norsk og italiensk – morsmål\nEnglish, French: fluent, spoken and written\nGerman (basic)"
        val found = recover(source)
        assertThat(found.map { it.skill }).containsExactly("Norsk", "italiensk", "English", "French", "German")
        assertThat(found.take(2).map { it.quote }).containsOnly("Språk: Norsk og italiensk – morsmål")
        assertThat(found).allMatch { source.contains(it.quote) }
    }

    @Test fun `existing AI language evidence is not duplicated by local recovery even with another category`() {
        val source = "Languages\nNorwegian"
        val existing = listOf(CompetencySuggestion("Norwegian", "Draft", "Context not stated", "Norwegian", id, category = "TECHNOLOGY", drafted = true))
        assertThat(DocumentCompetencyInventory.recover(AnalysisBatch(id, source, source.length), source, "en", existing)).isEmpty()
    }
}
