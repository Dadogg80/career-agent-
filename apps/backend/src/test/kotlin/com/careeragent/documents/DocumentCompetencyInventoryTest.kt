package com.careeragent.documents

import com.careeragent.documents.application.DocumentAnalysisPlanner
import com.careeragent.documents.application.DocumentCompetencyInventory
import com.careeragent.documents.domain.AnalysisBatch
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.util.UUID

class DocumentCompetencyInventoryTest {
    private val id=UUID.randomUUID()
    @Test fun `each literal technology is recovered with its company and punctuation intact`() {
        val text="## Synthetic AS\nSenior Developer\nTeknologi: Next.js - TypeScript - Node.js - PostgreSQL - C++ - C# - React Native"
        val found=DocumentCompetencyInventory.recover(AnalysisBatch(id,text,text.length),text,"nb",emptyList())
        assertThat(found.map { it.skill }).containsExactly("Next.js","TypeScript","Node.js","PostgreSQL","C++","C#","React Native")
        assertThat(found.map { it.context }).containsOnly("Synthetic AS")
        assertThat(found).allMatch { text.contains(it.quote) && it.recovered && !it.drafted }
        assertThat(DocumentCompetencyInventory.recover(AnalysisBatch(id,text,text.length),text,"nb",found)).isEmpty()
    }
    @Test fun `global skills do not acquire an employer and prose contacts are not lists`() {
        val text="Kjernekompetanse\nFrontend\nReact, Next.js, TypeScript\nJeg planlegger å lære nye verktøy.\nemail: test@example.test\n## Other AS\nSenior Developer\nTeknologi: Kotlin, PostgreSQL"
        val found=DocumentCompetencyInventory.recover(AnalysisBatch(id,text,text.length),text,"nb",emptyList())
        assertThat(found.take(3).map { it.context }).containsOnly("Kontekst ikke oppgitt")
        assertThat(found.drop(3).map { it.context }).containsOnly("Other AS")
        assertThat(found.map { it.skill }).containsExactly("React","Next.js","TypeScript","Kotlin","PostgreSQL")
    }
    @Test fun `repeated list text retains the context of the actual batch occurrence`() {
        val text="## First AS\nSenior Developer\nTeknologi: Kotlin, PostgreSQL\n"+"Narrative.\n".repeat(390)+"## Second AS\nSenior Developer\nTeknologi: Kotlin, PostgreSQL"
        val all=DocumentAnalysisPlanner.batches(mapOf(id to text)).flatMap { DocumentCompetencyInventory.recover(it,text,"en",emptyList()) }
        assertThat(all.filter { it.skill=="Kotlin" }.map { it.context }).containsExactly("First AS","Second AS")
    }
}
