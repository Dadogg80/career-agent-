package com.careeragent.cv.application

import com.fasterxml.jackson.databind.JsonNode
import java.security.MessageDigest
import java.util.UUID

enum class CvSectionKind { PROFILE, SKILLS, EXPERIENCE, EDUCATION, ADDITIONAL, UNCLASSIFIED }
enum class CvSectionAction { KEEP_UNCHANGED, PROPOSE_CHANGES, NEEDS_REVIEW }
enum class CvSectionPriority { HIGH, MEDIUM, LOW }
data class CvSection(val id: String, val kind: CvSectionKind, val heading: String?, val paragraphIndexes: List<Int>)
data class CvSectionPlan(val sectionId: String, val action: CvSectionAction, val priority: CvSectionPriority,
    val reason: String, val claimIds: List<UUID>, val requirementIndexes: List<Int>, val assessed: Boolean = true)

/** Source-bound section identity; explicit headings only, never inferred candidate facts. */
object CvSections {
    private val headings = mapOf(
        CvSectionKind.PROFILE to listOf("profil", "profile", "sammendrag", "summary", "professional summary", "nøkkelkvalifikasjoner", "key qualifications", "om meg", "about me"),
        CvSectionKind.SKILLS to listOf("kjernekompetanse", "kompetanse", "core competencies", "core skills", "skills", "kompetanseoversikt"),
        CvSectionKind.EXPERIENCE to listOf("arbeidserfaring", "yrkeserfaring", "work experience", "employment", "experience", "professional experience", "prosjekter", "projects", "arbeid og prosjekter"),
        CvSectionKind.EDUCATION to listOf("utdanning", "education", "kurs", "courses", "sertifiseringer", "certifications", "utdanning og kurs"),
        CvSectionKind.ADDITIONAL to listOf("tilleggsinformasjon", "additional information", "språk", "languages", "interesser", "interests", "referanser", "references"))
    private fun kind(line: String): CvSectionKind? {
        val label = line.trim().removeSuffix(":").trim().lowercase(java.util.Locale.ROOT)
        return headings.entries.find { label in it.value }?.key
    }
    fun identify(text: String, paragraphs: List<String>): List<CvSection> {
        val source = MessageDigest.getInstance("SHA-256").digest(text.toByteArray(Charsets.UTF_8)).take(8).joinToString("") { "%02x".format(it) }
        val sections = mutableListOf<CvSection>()
        for ((index, paragraph) in paragraphs.withIndex()) {
            val lines = paragraph.lines().filter { it.isNotBlank() }
            val starts = lines.firstOrNull()?.let(::kind)
            // A literal passage spanning several sections must not be falsely assigned to one.
            val mixed = lines.drop(1).any { kind(it) != null }
            if (sections.isEmpty() || starts != null || mixed) {
                sections.add(CvSection("cv-$source-$index", if (mixed) CvSectionKind.UNCLASSIFIED else starts ?: CvSectionKind.UNCLASSIFIED,
                    if (!mixed && starts != null) lines.first().trim() else null, listOf(index)))
            } else {
                val last = sections.last()
                sections[sections.lastIndex] = last.copy(paragraphIndexes = last.paragraphIndexes + index)
            }
        }
        return sections
    }
    fun plans(root: JsonNode, sections: List<CvSection>, proposals: List<CvTextProposal>, claims: Set<UUID>, requirements: Int, locale: String): List<CvSectionPlan> {
        val items = root.path("sectionPlans")
        val parsed = mutableMapOf<String, CvSectionPlan>()
        val duplicates = mutableSetOf<String>()
        if (items.isArray && items.size() <= 1000) for (item in items) try {
            require(item.isObject && item.fieldNames().asSequence().toSet() == setOf("sectionId","action","priority","reason","claimIds","requirementIndexes"))
            val id = item.path("sectionId").asText(); val section = sections.find { it.id == id } ?: throw IllegalArgumentException()
            if (id in parsed) { duplicates.add(id); continue }
            val action = CvSectionAction.valueOf(item.path("action").asText())
            val priority = CvSectionPriority.valueOf(item.path("priority").asText())
            val reason = item.path("reason"); require(reason.isTextual && reason.asText().isNotBlank() && reason.asText().length <= 600 && reason.asText().none { it.isISOControl() && it !in "\n\r\t" })
            val ids = item.path("claimIds"); require(ids.isArray && ids.size() <= 10)
            val proof = ids.map { require(it.isTextual); UUID.fromString(it.asText()).also { id -> require(id in claims) } }.distinct()
            val indexes = item.path("requirementIndexes"); require(indexes.isArray && indexes.size() <= 128)
            val criteria = indexes.map { require(it.isInt && it.asInt() in 0 until requirements); it.asInt() }.distinct()
            val changes = proposals.filter { it.paragraphIndex in section.paragraphIndexes }
            if (action == CvSectionAction.KEEP_UNCHANGED) require(changes.isEmpty())
            if (action == CvSectionAction.PROPOSE_CHANGES) require(changes.isNotEmpty() && proof.isNotEmpty() && criteria.isNotEmpty())
            parsed[id] = CvSectionPlan(id, action, priority, reason.asText(), proof, criteria)
        } catch (_: IllegalArgumentException) { /* An invalid plan never establishes that a section was reviewed. */ }
        return sections.map { section -> parsed[section.id]?.takeUnless { section.id in duplicates } ?: CvSectionPlan(section.id,
            CvSectionAction.NEEDS_REVIEW, CvSectionPriority.LOW,
            if (locale == "nb") "Ingen gyldig seksjonsvurdering ble mottatt. Teksten beholdes; kontroller seksjonen."
            else "No valid section assessment was received. Original text is retained; review this section.", emptyList(), emptyList(), false) }
    }
}
