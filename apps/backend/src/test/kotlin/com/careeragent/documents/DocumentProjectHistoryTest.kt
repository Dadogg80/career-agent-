package com.careeragent.documents

import com.careeragent.ai.application.AiModel
import com.careeragent.documents.application.DocumentDraftExtractor
import com.careeragent.documents.application.DocumentHistoryDrafts
import com.careeragent.documents.domain.CareerHistoryDraft
import com.careeragent.documents.domain.CompetencySource
import com.careeragent.profile.domain.CareerEntryContent
import com.careeragent.profile.domain.EntryKind
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import java.util.UUID

class DocumentProjectHistoryTest {
    private val mapper = jacksonObjectMapper()
    private val document = UUID.randomUUID()

    @Test fun `project contract accepts minimal literal proof and rejects expanded names and excessive evidence`() {
        val source = "Atlas via ABC\nPrototype: built scheduling forms.\n2022 – 2023\nMore detail.\nMore detail two.\nMore detail three.\nMore detail four."
        val passages = source.lines().map { DocumentDraftExtractor.Passage(it) }
        fun project(organization: String, ids: List<Int>) = mapOf("kind" to "PROJECT", "title" to "Atlas",
            "organization" to organization, "client" to "", "deliveryRole" to "", "periodText" to "2022 – 2023",
            "description" to "Prototype: built scheduling forms.", "evidenceIds" to ids)
        val output = mapper.writeValueAsString(mapOf("competencies" to emptyList<Any>(), "profile" to emptyList<Any>(),
            "history" to listOf(project("ABC", listOf(0, 1, 2)), project("", listOf(0, 1, 2)),
                project("Example Company AS", listOf(0, 1, 2)), project("ABC", (0..6).toList()), project("ABC", listOf(0, 0, 2)))))
        val result = DocumentDraftExtractor(mock(AiModel::class.java), mapper).parse(output, passages, document, source, "nb")
        assertThat(result.entries).hasSize(2)
        assertThat(result.entries.map { it.content.organization }).containsExactly("ABC", "")
        assertThat(result.entries.all { it.content.kind == EntryKind.PROJECT && it.content.startMonth == null && it.content.endMonth == null }).isTrue()
        assertThat(result.entries.first().quote).isEqualTo(source.lines().take(3).joinToString("\n"))
        assertThat(result.entries.first().content.description).contains("Prototype:")
        assertThat(result.omitted).isEqualTo(3)
        val properties = mapper.valueToTree<com.fasterxml.jackson.databind.JsonNode>(DocumentDraftExtractor.schema())["properties"]
        listOf("competencies", "profile", "history").forEach { kind ->
            val ids = properties[kind]["items"]["properties"]["evidenceIds"]
            assertThat(ids["minItems"].asInt()).isEqualTo(1)
            assertThat(ids["maxItems"].asInt()).isEqualTo(6)
        }
    }

    private fun draft(description: String = "First wording", period: String = "2022 – 2023", quote: String = "Atlas via ABC, 2022 – 2023: built forms.") =
        CareerHistoryDraft(UUID.randomUUID(), CareerEntryContent(EntryKind.PROJECT, "Atlas", "ABC", "", "",
            null, null, false, description, "Document evidence"), period, document, quote)

    @Test fun `reworded dated history retains first review identity and all distinct sources`() {
        val first = draft().copy(profileEntryId = UUID.randomUUID(), reviewState = "CONFIRMED")
        val second = draft("Different AI wording", quote = "Atlas via ABC, 2022 – 2023: scheduling prototype.").copy(documentId = UUID.randomUUID())
        val merged = DocumentHistoryDrafts.merge(listOf(first, second, second))
        assertThat(merged).hasSize(1)
        assertThat(merged.single()).isEqualTo(first.copy(additionalSources = listOf(CompetencySource(second.documentId, second.quote))))
    }

    @Test fun `distinct clients roles periods and uncertain accounts are not merged`() {
        val first = draft()
        val distinct = listOf(first, first.copy(content = first.content.copy(client = "Client B")),
            first.copy(content = first.content.copy(deliveryRole = "Designer")), first.copy(periodText = "2020 – 2021"),
            draft(period = ""), draft(period = "", quote = "Atlas: different undated assignment."),
            first.copy(content = first.content.copy(organization = "")),
            first.copy(documentId = UUID.randomUUID(), content = first.content.copy(organization = "")))
        assertThat(DocumentHistoryDrafts.merge(distinct)).hasSize(distinct.size)
    }
}
