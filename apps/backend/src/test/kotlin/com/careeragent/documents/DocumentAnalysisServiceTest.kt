package com.careeragent.documents

import com.careeragent.ai.application.*
import com.careeragent.documents.application.*
import com.careeragent.documents.domain.*
import com.careeragent.profile.application.VerifiedIdentity
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import java.time.OffsetDateTime
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class DocumentAnalysisServiceTest {
    private val docs = mock(DocumentRepository::class.java)
    private val repository = mock(DocumentAnalysisRepository::class.java)
    private val model = mock(AiModel::class.java)
    private val service = DocumentAnalysisService(docs, repository, model, jacksonObjectMapper(), 2)
    private val identity = VerifiedIdentity("https://identity.example.test", "synthetic")
    private val id = UUID.randomUUID()
    private val text = "Built APIs with Kotlin in a synthetic project."
    private val valid = """{"summary":[{"text":"API development","quote":"Built APIs with Kotlin"}],"suggestions":[{"skill":"Kotlin","statement":"Built APIs","context":"Synthetic project","quote":"Built APIs with Kotlin"}]}"""
    private fun source() = DocumentDetail(CareerDocument(id, "synthetic.docx", "application/pdf", 10, "a".repeat(64), "nb", false, OffsetDateTime.now()), text)
    @Test fun `layout whitespace differences map back to exact source without allowing factual rewrites`() {
        val source = "Built\u00a0APIs\nwith\tKotlin in a synthetic project."
        val result = service.parse(valid, source, source)
        assertThat(result.second.single().quote).isEqualTo("Built\u00a0APIs\nwith\tKotlin")
        assertThat(source).contains(result.second.single().quote)
        assertThatThrownBy { service.parse(valid, source.replace("Kotlin", "Java"), source) }.hasMessage("AI_INVALID_RESULT")
        assertThatThrownBy { service.parse(valid, "Built no APIs with Kotlin in a synthetic project.", "Built no APIs with Kotlin in a synthetic project.") }.hasMessage("AI_INVALID_RESULT")
    }
    @Test fun `twenty concise sourced proposals are accepted without silently imposing the previous ten item cap`() {
        val mapper = jacksonObjectMapper()
        val suggestions = (1..20).map { mapOf("skill" to "Listed skill $it", "statement" to "Document lists Kotlin", "context" to "Skill list", "quote" to "Built APIs with Kotlin") }
        fun output(items: List<Map<String,String>>) = mapper.writeValueAsString(mapOf("summary" to emptyList<String>(), "suggestions" to items))
        assertThat(service.parse(output(suggestions), text, text).second).hasSize(20)
        val extra = suggestions + suggestions.first().plus("skill" to "Extra skill")
        assertThat(service.parse(output(extra), text, text).second).hasSize(20)
        assertThat(service.parse(output(extra), text, text).third).isEqualTo(1)
    }
    @Test fun `quotes must exist in both the original and approved preview and valid items survive omissions`() {
        val result = service.parse(valid, text, text)
        assertThat(result.first.single().text).isEqualTo("API development")
        val partial = valid.replace("API development", "Ignored").replaceFirst("Built APIs with Kotlin", "Invented Kafka")
        assertThat(service.parse(partial, text, text).third).isEqualTo(1)
        val failure = catchThrowable { service.parse(valid, "Only unrelated text remains after redaction", text) } as AiFailure
        assertThat(failure.reason).isEqualTo("NO_SUPPORTED_ITEMS")
        assertThatThrownBy { service.parse(valid, text, "Unrelated original") }.isInstanceOf(AiFailure::class.java)
    }
    @Test fun `malformed root schema and unknown fields are rejected without payload disclosure`() {
        for (bad in listOf("not JSON", valid.replace("\"summary\":", "\"ownerId\":\"spoofed\",\"summary\":"))) {
            assertThatThrownBy { service.parse(bad, text, text) }.isInstanceOf(AiFailure::class.java).hasMessage("AI_INVALID_RESULT")
        }
        assertThat(service.parse("""{"summary":[],"suggestions":[]}""", text, text).first).isEmpty()
    }
    @Test fun `one malformed item never suppresses valid evidence and empty context is honestly unknown`() {
        val invalid = valid.replace("\"Kotlin\"", "true")
        val partial = service.parse(invalid, text, text)
        assertThat(partial.first).hasSize(1); assertThat(partial.second).isEmpty(); assertThat(partial.third).isEqualTo(1)
        val longContext = valid.replace("Synthetic project", "x".repeat(501))
        assertThat(service.parse(longContext, text, text).first).hasSize(1)
        assertThat(service.parse(longContext, text, text).second).isEmpty()
        val unknown = valid.replace("\"context\":\"Synthetic project\"", "\"context\":\"\"")
        assertThat(service.parse(unknown, text, text).second.single().context).isEqualTo("Kontekst ikke oppgitt")
        assertThat(service.parse(unknown, text, text, "en").second.single().context).isEqualTo("Context not stated")
        assertThatThrownBy { service.parse("{\"summary\":[],\"suggestions\":[{\"skill\":true}]}", text, text) }.hasMessage("AI_INVALID_RESULT")
    }
    @Test fun `consent and bounded input are required before invoking the model`() {
        `when`(docs.detail(identity, id)).thenReturn(source())
        assertThatThrownBy { service.analyze(identity, id, text, "nb", false) }.hasMessage("DOCUMENT_AI_CONSENT_REQUIRED")
        assertThatThrownBy { service.analyze(identity, id, "x".repeat(12001), "nb", true) }.hasMessage("DOCUMENT_AI_INPUT_INVALID")
        assertThatThrownBy { service.analyzeCollection(identity, listOf(DocumentExcerpt(id, text), DocumentExcerpt(id, text)), "nb", true) }.hasMessage("DOCUMENT_AI_INPUT_INVALID")
        verifyNoInteractions(model, repository)
    }
    @Test fun `one model call per attempt concurrency is bounded and failures release the permit`() {
        `when`(docs.detail(identity, id)).thenReturn(source())
        val entered = CountDownLatch(1); val release = CountDownLatch(1)
        `when`(model.generateJson(anyString(), anyString(), anyMap())).thenAnswer { entered.countDown(); check(release.await(5, TimeUnit.SECONDS)); throw AiFailure("AI_RATE_LIMITED", 429, 2) }
        val pool = Executors.newSingleThreadExecutor()
        try {
            val first = pool.submit<Throwable> { catchThrowable { service.analyze(identity, id, text, "nb", true) } }
            assertThat(entered.await(3, TimeUnit.SECONDS)).isTrue()
            assertThatThrownBy { service.analyze(identity, id, text, "nb", true) }.hasMessage("AI_BUSY")
            release.countDown(); assertThat(first.get(5, TimeUnit.SECONDS)).hasMessage("AI_RATE_LIMITED")
            assertThatThrownBy { service.analyze(identity, id, text, "nb", true) }.hasMessage("AI_RATE_LIMITED")
            assertThatThrownBy { service.analyze(identity, id, text, "nb", true) }.hasMessage("AI_BUDGET_REACHED")
            verify(model, times(2)).generateJson(anyString(), anyString(), anyMap())
            verifyNoInteractions(repository)
        } finally { release.countDown(); pool.shutdownNow() }
    }
}
