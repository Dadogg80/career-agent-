package com.careeragent.cv

import com.careeragent.cv.application.*
import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.Test
import java.util.UUID

class CvSectionsTest {
    private val mapper = ObjectMapper()
    @Test fun `explicit headings retain every paragraph and repeated sections have source-bound identities`() {
        val parts = listOf("Fictional person", "PROFIL\nRelevant profile", "Second profile paragraph", "Third profile paragraph",
            "KJERNEKOMPETANSE", "Six groups are template data, not a parser limit", "ARBEIDSERFARING\nExample AS", "Another role",
            "UTDANNING\nExample school", "PROSJEKTER\nA parallel project", "SPRÅK\nNorsk")
        val text = parts.joinToString("\n\n"); val sections = CvSections.identify(text, parts)
        assertThat(sections.flatMap { it.paragraphIndexes }).containsExactlyElementsOf(parts.indices.toList())
        assertThat(sections.map { it.kind }).containsExactly(CvSectionKind.UNCLASSIFIED,CvSectionKind.PROFILE,CvSectionKind.SKILLS,CvSectionKind.EXPERIENCE,CvSectionKind.EDUCATION,CvSectionKind.EXPERIENCE,CvSectionKind.ADDITIONAL)
        assertThat(sections[1].paragraphIndexes).containsExactly(1,2,3)
        assertThat(sections.map { it.id }.distinct()).hasSize(sections.size)
        assertThat(CvSections.identify(text,parts)).isEqualTo(sections)
        assertThat(CvSections.identify("  Profil  \nSource text",listOf("  Profil  \nSource text")).single().heading).isEqualTo("Profil")
        assertThat(CvSections.identify(text+" changed",parts).map { it.id }).doesNotContainAnyElementsOf(sections.map { it.id })
    }
    @Test fun `unheaded and mixed-layout passages stay uncertain without omitting content`() {
        val parts = listOf("Worked in healthcare with patient care skills", "PROFILE\nText\nEDUCATION\nSchool", "Follow-up text", "Education\nReviewed school")
        val sections = CvSections.identify(parts.joinToString("\n\n"),parts)
        assertThat(sections.take(2)).allMatch { it.kind == CvSectionKind.UNCLASSIFIED && it.heading == null }
        assertThat(sections[1].paragraphIndexes).containsExactly(1,2)
        assertThat(sections.last().kind).isEqualTo(CvSectionKind.EDUCATION)
        assertThat(sections.flatMap { it.paragraphIndexes }).containsExactly(0,1,2,3)
    }
    private fun item(section: CvSection, action: String = "KEEP_UNCHANGED", ids: List<String> = emptyList(), indexes: List<Int> = emptyList()) =
        mapOf("reviewedParagraphIndexes" to section.paragraphIndexes,"sectionId" to section.id,"action" to action,"priority" to "HIGH","reason" to "Explains relevance and limitations","claimIds" to ids,"requirementIndexes" to indexes)
    @Test fun `every section gets an explicit outcome and missing invalid conflicting or duplicate plans cannot imply completion`() {
        val parts = listOf("Profile\nProfile text", "Skills\nListed skills", "Education\nCourse")
        val sections = CvSections.identify(parts.joinToString("\n\n"),parts); val claim = UUID.randomUUID()
        val proposal = CvTextProposal(1,parts[1],"Supported skill wording","Specific improvement",listOf(claim),listOf(0))
        val root = mapper.valueToTree<com.fasterxml.jackson.databind.JsonNode>(mapOf("sectionPlans" to listOf(item(sections[0]),
            item(sections[1],"KEEP_UNCHANGED"), item(sections[2]),item(sections[2]))))
        val plans = CvSections.plans(root,sections,listOf(proposal),setOf(claim),1,"nb")
        assertThat(plans.map { it.action }).containsExactly(CvSectionAction.KEEP_UNCHANGED,CvSectionAction.NEEDS_REVIEW,CvSectionAction.NEEDS_REVIEW)
        assertThat(plans.map { it.assessed }).containsExactly(true,false,false)
        val invalid = mapper.valueToTree<com.fasterxml.jackson.databind.JsonNode>(mapOf("sectionPlans" to listOf(item(sections[1],"PROPOSE_CHANGES",listOf(UUID.randomUUID().toString()),listOf(0)))))
        assertThat(CvSections.plans(invalid,sections,listOf(proposal),setOf(claim),1,"en")).allMatch { !it.assessed }
        val valid = mapper.valueToTree<com.fasterxml.jackson.databind.JsonNode>(mapOf("sectionPlans" to listOf(item(sections[1],"PROPOSE_CHANGES",listOf(claim.toString()),listOf(0)))))
        assertThat(CvSections.plans(valid,sections,listOf(proposal),setOf(claim),1,"en")[1].action).isEqualTo(CvSectionAction.PROPOSE_CHANGES)
        assertThat(CvSections.plans(mapper.readTree("{}"),sections,emptyList(),setOf(claim),1,"en")).allMatch { !it.assessed && it.action == CvSectionAction.NEEDS_REVIEW }
    }

    @Test fun `three profile paragraphs and six competency groups cannot be marked reviewed by sampling indexes`() {
        val parts=listOf("Profil", "Candidate profile", "Supported delivery examples", "Other confirmed strengths", "Kjernekompetanse") + (1..6).map {"Competency group $it"}
        val sections=CvSections.identify(parts.joinToString("\n\n"),parts)
        assertThat(sections[0].paragraphIndexes).containsExactly(0,1,2,3)
        assertThat(sections[1].paragraphIndexes).containsExactly(4,5,6,7,8,9,10)
        val complete=mapper.valueToTree<com.fasterxml.jackson.databind.JsonNode>(mapOf("sectionPlans" to sections.map {item(it)}))
        assertThat(CvSections.plans(complete,sections,emptyList(),emptySet(),1,"nb")).allMatch {it.assessed}
        for (indexes in listOf(listOf(0,1),listOf(0,1,2,2),listOf(3,2,1,0))) {
            val partial=mapper.valueToTree<com.fasterxml.jackson.databind.JsonNode>(mapOf("sectionPlans" to listOf(item(sections[0])+("reviewedParagraphIndexes" to indexes))))
            assertThat(CvSections.plans(partial,sections,emptyList(),emptySet(),1,"nb")).allMatch {!it.assessed && it.action==CvSectionAction.NEEDS_REVIEW}
        }
    }
}
