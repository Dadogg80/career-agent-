package com.careeragent.ai.infrastructure

import com.careeragent.ai.application.AiRouting
import com.careeragent.documents.application.DocumentDraftExtractor
import com.careeragent.documents.DocumentExtractionBenchmark
import com.careeragent.documents.domain.AnalysisBatch
import com.careeragent.documents.domain.DocumentAnalysis
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable
import org.springframework.mock.env.MockEnvironment
import java.util.UUID
import java.time.OffsetDateTime

/** Explicit, bounded live verification. Normal tests never transmit data or use a provider key. */
@EnabledIfEnvironmentVariable(named="GEMINI_LIVE_TEST", matches="true")
class GeminiLiveTest {
    @Test fun `synthetic document yields explicit technologies sourced history and a grounded profile`() {
        val selected=System.getenv("GEMINI_MODEL") ?: "gemini-3.5-flash-lite"
        val config=AiRouting(MockEnvironment().withProperty("AI_PROVIDER","gemini")
            .withProperty("GEMINI_DOCUMENT_MODEL",selected).withProperty("GEMINI_PROFILE_MODEL",selected))
        val mapper=jacksonObjectMapper()
        val extractor=DocumentDraftExtractor(GeminiAiModel(mapper,System.getenv("GEMINI_API_KEY") ?: "",config),mapper)
        val source="""Example AS
Senior Developer, 2021 – 2024
Built a web application using React, Next.js, TypeScript, Node.js and PostgreSQL.
Implemented REST APIs, payment webhooks and retry handling. Deployed the application with Docker.
Mentored two developers and coordinated releases.
Education: Example University, software development course, 2020.
Interests: cycling and product development."""
        val documentId=UUID.randomUUID()
        val result=extractor.extract(AnalysisBatch(documentId,source,source.length),source,"nb")
        val skills=result.suggestions.map { it.skill.lowercase() }.toSet()
        assertThat(skills).contains("react","next.js","typescript","node.js","postgresql","docker","retry handling","mentored","coordinated releases")
        assertThat(skills).anyMatch { it=="webhooks" || it=="payment webhooks" }
        assertThat(skills).doesNotContain("kafka","kubernetes","spring boot","idempotency")
        assertThat(result.suggestions).allMatch { source.contains(it.quote) }
        assertThat(result.entries).anyMatch { it.content.organization=="Example AS" && it.content.startMonth==null }
        val expected=listOf("React","Next.js","TypeScript","Node.js","PostgreSQL","Docker","retry handling","Mentored","coordinated releases").mapIndexed { index,skill ->
            DocumentExtractionBenchmark.ExpectedFact("skill-$index",DocumentExtractionBenchmark.Kind.COMPETENCY,documentId,skill,mapOf("skill" to skill,"context" to "Example AS"))
        }
        val analysis=DocumentAnalysis(UUID.randomUUID(),"nb","Gemini",emptyList(),result.suggestions,source.length,source.length,false,result.omitted,OffsetDateTime.now(),profile=result.profile,careerEntries=result.entries)
        val benchmark=DocumentExtractionBenchmark.assess(mapOf(documentId to source),expected,analysis)
        assertThat(benchmark.captured).describedAs("Synthetic expected facts with employer context").isEqualTo(expected.size)
        assertThat(benchmark.unsupportedEvidence).isZero()
        println("Synthetic expected-fact benchmark: ${benchmark.counts()}")
        val summary=extractor.summarize(result.profile,result.suggestions,"nb",result.entries)
        assertThat(summary.map { it.kind }).contains("EDUCATION","INTERESTS")
        assertThat(summary).allMatch { source.contains(it.quote) }
        println("Synthetic Gemini check: model=$selected explicitSkills=${result.suggestions.size} historyDrafts=${result.entries.size} profileSections=${summary.size}")
    }
}
