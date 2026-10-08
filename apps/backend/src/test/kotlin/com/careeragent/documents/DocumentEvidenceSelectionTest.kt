package com.careeragent.documents

import com.careeragent.documents.application.*
import com.careeragent.ai.application.AiFailure
import com.careeragent.ai.application.AiModel
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import java.util.UUID

class DocumentEvidenceSelectionTest {
    private val mapper = jacksonObjectMapper()
    private val first = UUID.randomUUID()
    private val second = UUID.randomUUID()
    private val parser = DocumentAnalysisService(mock(DocumentRepository::class.java), mock(DocumentAnalysisRepository::class.java), mock(AiModel::class.java), mapper, 2)

    @Test fun `numbered evidence keeps literal technology wording and nearby project proof`() {
        val source = "Project: Example AS\nBuilt Next.js interfaces.\nProject: Other AS\nBuilt NestJS APIs."
        val selection = DocumentEvidenceSelection(mapOf(first to source), mapper)
        val output = """{"summary":[{"evidenceId":1}],"suggestions":[{"skill":"Next.js","evidenceId":1,"contextId":0,"context":"Example AS"},{"skill":"NestJS","evidenceId":3,"contextId":2,"context":"Other AS"},{"skill":"Kafka","evidenceId":3,"contextId":2,"context":"Other AS"}]}"""
        val result = parser.parse(selection.expand(output, false), source, source)
        assertThat(result.second.map { it.statement }).containsExactly("Built Next.js interfaces.", "Built NestJS APIs.")
        assertThat(result.second.map { it.context }).containsExactly("Example AS", "Other AS")
        assertThat(result.third).isEqualTo(1)
        assertThat(result.first.single().text).isEqualTo("Built Next.js interfaces.")
    }

    @Test fun `a Java label cannot be backed by a JavaScript quotation`() {
        val source = "Built JavaScript interfaces."
        val selection = DocumentEvidenceSelection(mapOf(first to source), mapper)
        val output = """{"summary":[],"suggestions":[{"skill":"Java","evidenceId":0,"contextId":-1,"context":""},{"skill":"JavaScript","evidenceId":0,"contextId":-1,"context":""}]}"""
        val result = parser.parse(selection.expand(output, false), source, source)
        assertThat(result.second.map { it.skill }).containsExactly("JavaScript")
        assertThat(result.third).isEqualTo(1)
    }

    @Test fun `invalid IDs cannot select unsent text and collection context cannot cross documents`() {
        val a = "Project: Example AS\nBuilt Kotlin APIs."
        val b = "Completed a PostgreSQL course."
        val selection = DocumentEvidenceSelection(mapOf(first to a, second to b), mapper)
        val output = """{"summary":[{"evidenceId":999}],"suggestions":[{"skill":"PostgreSQL","evidenceId":2,"contextId":0,"context":"Example AS"}]}"""
        val expanded = mapper.readTree(selection.expand(output, true))
        assertThat(expanded["suggestions"][0]["documentId"].asText()).isEqualTo(second.toString())
        assertThat(expanded["suggestions"][0]["contextQuote"].asText()).isEmpty()
        assertThat(expanded["summary"][0]["quote"].asText()).isEmpty()
        assertThatThrownBy { selection.expand("not JSON", false) }.isInstanceOf(AiFailure::class.java)
        assertThatThrownBy { selection.expand("{\"summary\":[],\"suggestions\":[],\"ownerId\":\"spoofed\"}", false) }.isInstanceOf(AiFailure::class.java)
    }

    @Test fun `long lines retain all reviewed words in bounded literal passages`() {
        val source = (1..300).joinToString(" ") { "word$it" }
        val input = mapper.readTree(DocumentEvidenceSelection(mapOf(first to source), mapper).input())["passages"]
        val excerpts = input.map { it["text"].asText() }
        assertThat(excerpts.joinToString("")).isEqualTo(source)
        assertThat(excerpts.all { it.length <= 260 && source.contains(it) }).isTrue()
        assertThatThrownBy { DocumentEvidenceSelection(mapOf(first to "a\n".repeat(513)), mapper) }.hasMessage("DOCUMENT_AI_INPUT_INVALID")
    }
}
