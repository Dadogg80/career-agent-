package com.careeragent.documents

import com.careeragent.ai.application.AiModel
import com.careeragent.ai.application.AiTask
import com.careeragent.documents.DocumentExtractionBenchmark.ExpectedFact
import com.careeragent.documents.DocumentExtractionBenchmark.Finding
import com.careeragent.documents.DocumentExtractionBenchmark.Kind
import com.careeragent.documents.application.DocumentAnalysisPlanner
import com.careeragent.documents.application.DocumentDraftExtractor
import com.careeragent.documents.application.DocumentEvidenceInventory
import com.careeragent.documents.domain.*
import com.careeragent.profile.domain.CareerEntryContent
import com.careeragent.profile.domain.EntryKind
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import java.time.OffsetDateTime
import java.util.UUID

class DocumentExtractionBenchmarkTest {
    private val id=UUID.randomUUID()
    private fun analysis(skills: List<CompetencySuggestion> = emptyList(), history: List<CareerHistoryDraft> = emptyList(), profile: List<ProfileSummaryDraft> = emptyList())=
        DocumentAnalysis(UUID.randomUUID(),"en","Recorded fixture",emptyList(),skills,0,0,false,0,OffsetDateTime.now(),careerEntries=history,profile=profile)
    private fun fact(key: String, skill: String, quote: String, context: String="Example AS")=
        ExpectedFact(key,Kind.COMPETENCY,id,quote,mapOf("skill" to skill,"context" to context))

    @Test fun `a cited responsibility paragraph can still omit individual expected competencies`() {
        val quote="Implemented REST APIs, payment webhooks and retry handling."
        val source="## Example AS\n$quote"
        val expected=listOf("REST APIs","webhooks","retry handling").mapIndexed { index, skill -> fact("fact-$index",skill,quote) }
        val result=analysis(listOf(CompetencySuggestion("REST APIs","API work","Example AS",quote,id,contextQuote="## Example AS",category="DELIVERY")))
        assertThat(DocumentEvidenceInventory.assess(mapOf(id to source),result).missing).isEmpty()
        val measured=DocumentExtractionBenchmark.assess(mapOf(id to source),expected,result)
        assertThat(measured.counts()).containsEntry("expected",3).containsEntry("captured",1).containsEntry("missing",2).containsEntry("unsupportedEvidence",0)
    }
    @Test fun `repeated source wording does not hide wrong employer attribution or punctuation sensitive skills`() {
        val quote="Technology: React, React Native, C++, C#"
        val source="## First AS\n$quote\n## Second AS\n$quote"
        val expected=listOf(ExpectedFact("second-react",Kind.COMPETENCY,id,quote,mapOf("skill" to "React","context" to "Second AS"),"## Second AS"),
            ExpectedFact("second-native",Kind.COMPETENCY,id,quote,mapOf("skill" to "React Native","context" to "Second AS"),"## Second AS"),
            ExpectedFact("second-csharp",Kind.COMPETENCY,id,quote,mapOf("skill" to "C#","context" to "Second AS"),"## Second AS"))
        val captured=analysis(listOf(CompetencySuggestion("React","Listed","First AS",quote,id,contextQuote="## First AS"),CompetencySuggestion("C++","Listed","Second AS",quote,id,contextQuote="## Second AS")))
        val measured=DocumentExtractionBenchmark.assess(mapOf(id to source),expected,captured)
        assertThat(measured.outcomes.map { it.finding }).containsExactly(Finding.WRONG_CONTEXT,Finding.MISSING,Finding.MISSING)
        val corrected=captured.copy(suggestions=captured.suggestions+CompetencySuggestion("React","Listed","Second AS",quote,id,contextQuote="## Second AS"))
        assertThat(DocumentExtractionBenchmark.assess(mapOf(id to source),expected,corrected).captured).isEqualTo(1)
    }
    @Test fun `career month precision and meaningful profile content are measured independently of source use`() {
        val quote="Example University\nSoftware Development Course, 2020 – 08.2021"
        val source="$quote\nInterests\nCycling and product development."
        val expected=listOf(ExpectedFact("education",Kind.HISTORY,id,quote,mapOf("kind" to "EDUCATION","title" to "Software Development Course","organization" to "Example University","periodText" to "2020 – 08.2021","startMonth" to "","endMonth" to "2021-08","ongoing" to "false")),
            ExpectedFact("interests",Kind.PROFILE,id,"Cycling and product development.",mapOf("kind" to "INTERESTS"),proseTerms=listOf("Cycling","product development")))
        val content=CareerEntryContent(EntryKind.EDUCATION,"Software Development Course","Example University","","","2020-01","2021-08",false,"Coursework","")
        val result=analysis(history=listOf(CareerHistoryDraft(UUID.randomUUID(),content,"2020 – 08.2021",id,quote)),
            profile=listOf(ProfileSummaryDraft("INTERESTS","Interested in technology.",id,"Cycling and product development.")))
        val measured=DocumentExtractionBenchmark.assess(mapOf(id to source),expected,result)
        assertThat(measured.outcomes.map { it.finding }).containsOnly(Finding.WRONG_FIELDS)
        assertThat(measured.outcomes.flatMap { it.mismatches }).containsExactly("startMonth","proseTerms")
        val corrected=result.copy(careerEntries=result.careerEntries.map { it.copy(content=it.content.copy(startMonth=null)) },profile=result.profile.map { it.copy(text="Cycling and product development.") })
        assertThat(DocumentExtractionBenchmark.assess(mapOf(id to source),expected,corrected).captured).isEqualTo(2)
    }
    @Test fun `another document cannot supply a fact without its explicit additional source link`() {
        val quote="Built APIs with Kotlin."
        val other=UUID.randomUUID()
        val source=mapOf(id to quote,other to quote)
        val expected=listOf(fact("kotlin","Kotlin",quote,"Context not stated"))
        val result=analysis(listOf(CompetencySuggestion("Kotlin","Built APIs","Context not stated",quote,other)))
        assertThat(DocumentExtractionBenchmark.assess(source,expected,result).captured).isZero()
        val linked=result.copy(suggestions=result.suggestions.map { it.copy(additionalSources=listOf(CompetencySource(id,quote))) })
        assertThat(DocumentExtractionBenchmark.assess(source,expected,linked).captured).isEqualTo(1)
    }
    @Test fun `substantive profile terms match whole phrases without borrowing substrings`() {
        val quote="Built REST APIs with React."
        val expected=listOf(ExpectedFact("profile-1",Kind.PROFILE,id,quote,mapOf("kind" to "EXPERIENCE"),proseTerms=listOf("React")))
        val result=analysis(profile=listOf(ProfileSummaryDraft("EXPERIENCE","Reactive delivery.",id,quote)))
        assertThat(DocumentExtractionBenchmark.assess(mapOf(id to quote),expected,result).outcomes.single().finding).isEqualTo(Finding.WRONG_FIELDS)
        assertThat(DocumentExtractionBenchmark.assess(mapOf(id to quote),expected,result.copy(profile=result.profile.map { it.copy(text="Delivered applications with React.") })).captured).isEqualTo(1)
    }
    @Test fun `unsupported quotations labels or documents are counted without pretending the checklist exhausts knowledge`() {
        val quote="Built APIs with Kotlin."
        val expected=listOf(fact("kotlin","Kotlin",quote,"Context not stated"))
        val result=analysis(listOf(CompetencySuggestion("Kotlin","Built APIs","Context not stated",quote,id),
            CompetencySuggestion("Kafka","Invented work","Context not stated",quote,id),
            CompetencySuggestion("Kotlin","Invented wording","Context not stated","Led a migration with Kotlin.",id),
            CompetencySuggestion("Kotlin","Unknown source","Context not stated",quote,UUID.randomUUID())))
        val measured=DocumentExtractionBenchmark.assess(mapOf(id to quote),expected,result)
        assertThat(measured.captured).isEqualTo(1)
        assertThat(measured.unsupportedEvidence).isEqualTo(3)
        assertThatThrownBy { DocumentExtractionBenchmark.assess(mapOf(id to quote),expected+expected,result) }.hasMessage("Invalid expected fact inventory")
        assertThatThrownBy { DocumentExtractionBenchmark.assess(mapOf(id to quote),listOf(expected.single().copy(quote="Unrelated private phrase")),result) }.hasMessage("Invalid expected source fact")
    }
    @Test fun `the actual numbered evidence pipeline preserves later portions and measures a recorded partial answer`() {
        val source="Project: Atlas\nFrontend:\n"+(1..100).joinToString("\n") { "FrameworkTechnology$it, PlatformRuntime$it, LibraryPackage$it" }
        val expected=(1..100).flatMap { index -> val quote="FrameworkTechnology$index, PlatformRuntime$index, LibraryPackage$index"
            listOf("FrameworkTechnology$index","PlatformRuntime$index","LibraryPackage$index").mapIndexed { item,skill -> fact("fact-$index-$item",skill,quote,"Atlas") } }
        val model=mock(AiModel::class.java)
        `when`(model.generateJson(anyString(),anyString(),anyMap(),(any(AiTask::class.java) ?: AiTask.DOCUMENT_EXTRACTION)))
            .thenReturn("""{"competencies":[],"profile":[],"history":[]}""")
        val extractor=DocumentDraftExtractor(model,jacksonObjectMapper())
        val batches=DocumentAnalysisPlanner.batches(mapOf(id to source))
        val result=analysis(batches.flatMap { extractor.extract(it,source,"en").suggestions })
        val measured=DocumentExtractionBenchmark.assess(mapOf(id to source),expected,result)
        assertThat(measured.captured).isEqualTo(300)
        assertThat(measured.unsupportedEvidence).isZero()
        verify(model,times(batches.size)).generateJson(anyString(),anyString(),anyMap(),(any(AiTask::class.java) ?: AiTask.DOCUMENT_EXTRACTION))
    }
}
