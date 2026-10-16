package com.careeragent.cv

import com.careeragent.documents.DocumentFixture
import com.careeragent.documents.infrastructure.DocumentTextExtractor
import com.careeragent.jobs.domain.MatchClaim
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.pdmodel.PDPage
import org.apache.pdfbox.pdmodel.PDPageContentStream
import org.apache.pdfbox.pdmodel.font.PDType1Font
import org.apache.pdfbox.pdmodel.font.Standard14Fonts
import java.io.ByteArrayOutputStream
import java.util.UUID

/** Independently chosen fictional controls; expected scope is a human rubric, never a factual-status rule. */
internal object CvCareerQualityFixtures {
    data class Case(val id: String, val profession: String, val format: String, val organization: String,
        val statements: List<String>, val supportedWording: String, val unsupportedWording: String,
        val scopeProblem: String, val original: ByteArray) {
        val advertisement: String get() = when(id) {
            "care" -> "Welcome patients and record appointments. A first-aid course is useful; nursing authorization is not required."
            "retail" -> "Register customer orders and answer product questions. The role has no staff or budget responsibility."
            else -> "Assist with equipment inspection under supervision. Interest in learning electrical safety is sufficient."
        }
        val criterion: String get() = advertisement.substringBefore('.')
        val text: String by lazy { DocumentTextExtractor().extract(original, format) }
        val claims: List<MatchClaim> get() = statements.mapIndexed { index, statement ->
            MatchClaim(UUID.nameUUIDFromBytes("$id-$index".toByteArray()),1,"Contribution $index",statement,organization)
        }
    }
    fun cases(): List<Case> {
        val care = listOf("Welcomed patients and recorded appointments.", "Completed a first-aid course. No nursing authorization.")
        val retail = listOf("Registered customer orders and answered product questions.", "Had no staff or budget responsibility.")
        val trade = listOf("Assisted with equipment inspection.", "Worked under supervision; not a qualified electrician.")
        val retailXml = """<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
            <w:p><w:r><w:t>Fictional retail candidate</w:t></w:r></w:p>
            <w:p><w:r><w:t>Skills</w:t></w:r></w:p>
            <w:tbl><w:tr><w:tc><w:p><w:r><w:t>Customer service</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Order registration</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
            <w:p><w:r><w:t>Work experience</w:t></w:r></w:p>
            <w:p><w:r><w:t>2022 - 2024 Example Retail - Sales assistant</w:t></w:r></w:p>
            ${retail.joinToString("") { "<w:p><w:r><w:t>$it</w:t></w:r></w:p>" }}
            </w:body></w:document>""".trimIndent()
        return listOf(
            Case("care", "Healthcare", "txt", "Example Care", care,
                "Recorded appointments and welcomed patients.", "Worked as an authorized nurse.",
                "A first-aid course and reception work do not establish nursing authorization.",
                ("Fictional care candidate\n\nProfile\n\nPatient reception and appointment administration.\n\nWork experience\n\n2021 - 2023 Example Care - Care assistant\n\n"+care.joinToString("\n\n")).toByteArray()),
            Case("retail", "Retail", "docx", "Example Retail", retail,
                "Answered product questions and registered customer orders.", "Managed the sales team and its budget.",
                "Customer service does not establish staff or budget responsibility; the source explicitly limits it.",
                DocumentFixture.docx("", unsafeXml=retailXml)),
            Case("trade", "Trades", "pdf", "Example Workshop", trade,
                "Assisted with equipment inspection under supervision.", "Independently certified electrical installations.",
                "Supervised assistance is not independent qualified or certification work.",
                pdf(listOf(listOf("Fictional workshop candidate", "Work experience", "2020 - 2023 Example Workshop - Apprentice", trade[0]),listOf(trade[1])))),
        )
    }
    private fun pdf(pages: List<List<String>>): ByteArray {
        val output=ByteArrayOutputStream()
        PDDocument().use { doc ->
            pages.forEach { lines ->
                val page=PDPage();doc.addPage(page)
                PDPageContentStream(doc,page).use { stream ->
                    stream.beginText();stream.setFont(PDType1Font(Standard14Fonts.FontName.HELVETICA),11f)
                    stream.newLineAtOffset(40f,720f)
                    lines.forEachIndexed { index,line -> if(index>0)stream.newLineAtOffset(0f,-32f);stream.showText(line) }
                    stream.endText()
                }
            }
            doc.save(output)
        }
        return output.toByteArray()
    }
}
