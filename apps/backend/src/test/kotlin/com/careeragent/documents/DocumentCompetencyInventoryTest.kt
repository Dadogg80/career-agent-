package com.careeragent.documents

import com.careeragent.documents.application.DocumentAnalysisPlanner
import com.careeragent.documents.application.DocumentCompetencyInventory
import com.careeragent.documents.domain.AnalysisBatch
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.util.UUID

class DocumentCompetencyInventoryTest {
    @Test fun `colon headings dash separated technologies and single named items are recovered without company guessing`() {
        val source="## Example AS\nBuilt applications.\nKjernekompetanse\nBackend:\nNode.js - TypeScript - REST API - C++\nFrontend:\nReact - Next.js - HTML5 - CSS\nData:\nPostgreSQL - MongoDB\nCloud & DevOps:\nDocker\nEducation\nA narrative sentence is not a technology."
        val id=UUID.randomUUID()
        val result=DocumentCompetencyInventory.recover(AnalysisBatch(id,source,source.length),source,"en",emptyList())
        assertThat(result.map { it.skill }).containsExactly("Node.js","TypeScript","REST API","C++","React","Next.js","HTML5","CSS","PostgreSQL","MongoDB","Docker")
        assertThat(result).allMatch { it.context=="Context not stated" && source.contains(it.quote) }
    }
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
    @Test fun `standalone technology subsection retains exact project evidence without borrowing global or peer lists`() {
        val source="Project: Atlas\nFrontend:\nNext.js - React\nKjernekompetanse:\nFrontend:\nNext.js - Vue\n## Other AS\nDeveloper\n### Data\nPostgreSQL\n## Data\nMongoDB"
        val result=DocumentCompetencyInventory.recover(AnalysisBatch(id,source,source.length),source,"en",emptyList())
        assertThat(result.first { it.skill=="React" }.context).isEqualTo("Atlas")
        assertThat(result.first { it.skill=="React" }.contextQuote).isEqualTo("Project: Atlas")
        assertThat(result.first { it.skill=="Vue" }.context).isEqualTo("Context not stated")
        assertThat(result.first { it.skill=="PostgreSQL" }.context).isEqualTo("Other AS")
        assertThat(result.first { it.skill=="MongoDB" }.context).isEqualTo("Context not stated")
    }
    @Test fun `a skills section crossing automatic portions recovers every literal item exactly once`() {
        val source="Project: Atlas\nFrontend:\n"+(1..100).joinToString("\n") { "FrameworkTechnology$it, PlatformRuntime$it, LibraryPackage$it" }+"\nEducation\n2020 Example College"
        val batches=DocumentAnalysisPlanner.batches(mapOf(id to source))
        assertThat(batches).hasSizeGreaterThan(1)
        val result=batches.flatMap { DocumentCompetencyInventory.recover(it,source,"en",emptyList()) }
        assertThat(result.map { it.skill }).containsExactlyElementsOf((1..100).flatMap { listOf("FrameworkTechnology$it","PlatformRuntime$it","LibraryPackage$it") })
        assertThat(result).allMatch { it.context=="Atlas" && it.contextQuote=="Project: Atlas" && source.contains(it.quote) }
    }
    @Test fun `continued list recovery respects an intervening global boundary and does not borrow a project`() {
        val source="Project: Atlas\nFrontend:\n"+(1..100).joinToString("\n") { "FrameworkTechnology$it, PlatformRuntime$it, LibraryPackage$it" }+"\nCore competencies\nBackend:\nKotlin, PostgreSQL\nInterests\nCycling, hiking"
        val result=DocumentAnalysisPlanner.batches(mapOf(id to source)).flatMap { DocumentCompetencyInventory.recover(it,source,"en",emptyList()) }
        assertThat(result.filter { it.skill in setOf("Kotlin","PostgreSQL") }).allMatch { it.context=="Context not stated" }
        assertThat(result.map { it.skill }).doesNotContain("Cycling","hiking")
    }
    @Test fun `a source row split across portions is emitted only when its complete literal quote is available`() {
        val row="FrameworkTechnology, PlatformRuntime, LibraryPackage"
        val source="Frontend:\n$row\nEducation\n2020 Example College"
        val end=source.indexOf("PlatformRuntime")+5
        val first=AnalysisBatch(id,source.substring(0,end),end)
        val second=AnalysisBatch(id,source.substring(end),source.length-end,end)
        assertThat(DocumentCompetencyInventory.recover(first,source,"en",emptyList())).isEmpty()
        val recovered=DocumentCompetencyInventory.recover(second,source,"en",emptyList())
        assertThat(recovered.map { it.skill }).containsExactly("FrameworkTechnology","PlatformRuntime","LibraryPackage")
        assertThat(recovered.map { it.quote }).containsOnly(row)
    }
}
