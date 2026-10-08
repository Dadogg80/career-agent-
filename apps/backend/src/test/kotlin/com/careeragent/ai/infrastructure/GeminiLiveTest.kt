package com.careeragent.ai.infrastructure

import com.careeragent.ai.application.AiRouting
import com.careeragent.documents.application.DocumentDraftExtractor
import com.careeragent.documents.domain.AnalysisBatch
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable
import org.springframework.mock.env.MockEnvironment
import java.util.UUID

/** Explicit, bounded live verification. Normal tests never transmit data or use a provider key. */
@EnabledIfEnvironmentVariable(named="GEMINI_LIVE_TEST", matches="true")
class GeminiLiveTest {
    @Test fun `synthetic document yields explicit technologies sourced history and a grounded profile`() {
        val selected=System.getenv("GEMINI_MODEL") ?: "gemini-3.5-flash"
        val config=AiRouting(MockEnvironment().withProperty("AI_PROVIDER","gemini").withProperty("GEMINI_MODEL",selected))
        val mapper=jacksonObjectMapper()
        val extractor=DocumentDraftExtractor(GeminiAiModel(mapper,System.getenv("GEMINI_API_KEY") ?: "",config),mapper)
        val source="""Example AS
Senior Developer, 2021 – 2024
Built a web application using React, Next.js, TypeScript, Node.js and PostgreSQL.
Implemented REST APIs, payment webhooks and retry handling. Deployed the application with Docker.
Mentored two developers and coordinated releases.
Education: Example University, software development course, 2020.
Interests: cycling and product development."""
        val result=extractor.extract(AnalysisBatch(UUID.randomUUID(),source,source.length),source,"nb")
        val skills=result.suggestions.map { it.skill.lowercase() }.toSet()
        assertThat(skills).contains("react","next.js","typescript","node.js","postgresql","docker","retry handling","mentored","coordinated releases")
        assertThat(skills).anyMatch { it=="webhooks" || it=="payment webhooks" }
        assertThat(skills).doesNotContain("kafka","kubernetes","spring boot","idempotency")
        assertThat(result.suggestions).allMatch { source.contains(it.quote) }
        assertThat(result.entries).anyMatch { it.content.organization=="Example AS" && it.content.startMonth==null }
        val summary=extractor.summarize(result.profile,result.suggestions,"nb",result.entries)
        assertThat(summary.map { it.kind }).contains("EDUCATION","INTERESTS")
        assertThat(summary).allMatch { source.contains(it.quote) }
        println("Synthetic Gemini check: model=$selected explicitSkills=${result.suggestions.size} historyDrafts=${result.entries.size} profileSections=${summary.size}")
    }
}
