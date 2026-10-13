package com.careeragent.documents

import com.careeragent.ai.application.AiModel
import com.careeragent.documents.application.DocumentDraftExtractor
import com.careeragent.documents.application.DocumentHistoryDrafts
import com.careeragent.documents.application.DocumentOmissions
import com.careeragent.documents.domain.CareerHistoryDraft
import com.careeragent.documents.domain.CompetencySource
import com.careeragent.documents.domain.DocumentOmission
import com.careeragent.documents.domain.DocumentOmissionReason
import com.careeragent.documents.domain.DocumentResultSection
import com.careeragent.documents.domain.DocumentAnalysis
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

    @Test fun `older analysis JSON remains readable without invented omission reasons`() {
        val previous="""{"id":"$document","locale":"nb","provider":"Groq","summary":[],"suggestions":[],"inputCharacters":40,"sourceCharacters":40,"partial":false,"omittedItems":2,"createdAt":"2026-10-13T00:00:00Z"}"""
        val json=mapper.findAndRegisterModules()
        assertThat(json.readValue(previous,DocumentAnalysis::class.java).omissionReasons).isEmpty()
    }

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
        assertThat(result.omissionReasons).containsExactly(
            DocumentOmission(DocumentResultSection.HISTORY,DocumentOmissionReason.UNSUPPORTED_ORGANIZATION,1),
            DocumentOmission(DocumentResultSection.HISTORY,DocumentOmissionReason.EVIDENCE_LIMIT,1),
            DocumentOmission(DocumentResultSection.HISTORY,DocumentOmissionReason.INVALID_EVIDENCE_IDS,1))
        val properties = mapper.valueToTree<com.fasterxml.jackson.databind.JsonNode>(DocumentDraftExtractor.schema())["properties"]
        listOf("competencies", "profile", "history").forEach { kind ->
            val ids = properties[kind]["items"]["properties"]["evidenceIds"]
            assertThat(ids["minItems"].asInt()).isEqualTo(1)
            assertThat(ids["maxItems"].asInt()).isEqualTo(6)
        }
    }

    @Test fun `source failures are categorized by section without retaining rejected wording`() {
        val source="Atlas via ABC\n2022 – 2023\nBuilt scheduling forms."
        val passages=source.lines().map { DocumentDraftExtractor.Passage(it) }
        val output=mapper.writeValueAsString(mapOf(
            "competencies" to listOf(mapOf("skills" to listOf("PRIVATE_INVENTED_SKILL"),"category" to "OTHER",
                "description" to "Private rejected wording","context" to "","contextId" to -1,"evidenceIds" to listOf(2))),
            "profile" to listOf(mapOf("kind" to "PROFILE","text" to "Private rejected wording","evidenceIds" to listOf(999))),
            "history" to listOf(mapOf("kind" to "PROJECT","title" to "Atlas","organization" to "ABC","client" to "",
                "deliveryRole" to "","periodText" to "2020 – 2021","description" to "Private rejected wording","evidenceIds" to listOf(0,1,2)))))
        val result=DocumentDraftExtractor(mock(AiModel::class.java),mapper).parse(output,passages,document,source,"nb")
        assertThat(result.omitted).isEqualTo(3)
        assertThat(result.suggestions).isEmpty(); assertThat(result.profile).isEmpty(); assertThat(result.entries).isEmpty()
        assertThat(result.omissionReasons).containsExactly(
            DocumentOmission(DocumentResultSection.COMPETENCY,DocumentOmissionReason.UNSUPPORTED_SKILL,1),
            DocumentOmission(DocumentResultSection.PROFILE,DocumentOmissionReason.INVALID_EVIDENCE_IDS,1),
            DocumentOmission(DocumentResultSection.HISTORY,DocumentOmissionReason.UNSUPPORTED_PERIOD,1))
        assertThat(mapper.writeValueAsString(result.omissionReasons)).doesNotContain("Private","PRIVATE_INVENTED_SKILL","Atlas","2020")
        assertThat(DocumentOmissions.merge(result.omissionReasons,result.omissionReasons)).allMatch { it.count==2 }
        val saturated=DocumentOmission(DocumentResultSection.HISTORY,DocumentOmissionReason.EVIDENCE_LIMIT,200)
        assertThat(DocumentOmissions.merge(listOf(saturated,saturated))).containsExactly(saturated)
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
