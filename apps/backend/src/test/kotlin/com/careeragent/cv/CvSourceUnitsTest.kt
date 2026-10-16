package com.careeragent.cv

import com.careeragent.cv.application.*
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import java.util.UUID

class CvSourceUnitsTest {
    @Test fun `a newly recognized heading never reparses stored legacy ranges`() {
        val text="Ferdigheter\nKundeservice og timeavtaler"
        val stored=listOf(CvSourceUnit(0,0,text.length,CvSourceUnitKind.TEXT,true))
        assertThat(CvSourceUnits.passages(text,stored)).containsExactly(text)
        assertThat(CvSourceUnits.create(text)).hasSize(2)
        assertThat(CvSourceUnits.passages(text,stored)).containsExactly(text)
    }
    @Test fun `Bokmal skills headings remain protected and separate from editable skill text`() {
        for(heading in listOf("Ferdigheter","FERDIGHETER","Ferdigheter:","## Ferdigheter","**Ferdigheter**")) {
            val text="Fictional candidate\n\nProfil\nErfaring fra kundearbeid.\n\n$heading\nKundeservice og timeavtaler\n\nArbeidserfaring\n2021–2024 Fictional employer – Assistant\nRegistrerte henvendelser."
            val units=CvSourceUnits.create(text);val passages=CvSourceUnits.passages(text,units)
            val index=passages.indexOf(heading)
            assertThat(index).describedAs(heading).isGreaterThanOrEqualTo(0)
            assertThat(units[index].kind).isEqualTo(CvSourceUnitKind.SECTION_HEADING)
            assertThat(units[index].editable).isFalse()
            assertThat(CvSections.identify(text,passages)).anyMatch {it.kind==CvSectionKind.SKILLS && it.heading==heading}
            assertThat(passages.joinToString("").filterNot(Char::isWhitespace)).isEqualTo(text.filterNot(Char::isWhitespace))
        }
    }
    @Test fun `hyphenated history prose keeps its conjunction continuation while later paragraphs and employers stay separate`() {
        for((prefix,suffix) in listOf("Samarbeidet med produkt-" to "og prosjektorganisasjonen.","Worked with product-" to "and project teams.")) {
            val text="WORK EXPERIENCE\n2021 – 2023 Example Company – Developer\n$prefix\n\n$suffix\n\nA separate complete paragraph.\n\n2024 – present Other Company – Engineer\nAnother contribution."
            val units=CvSourceUnits.create(text);val passages=CvSourceUnits.passages(text,units)
            assertThat(passages).contains("$prefix\n\n$suffix","A separate complete paragraph.")
            assertThat(units.filter {it.kind==CvSourceUnitKind.ENTRY_HEADER}).hasSize(2)
            val joined=units.single {passages[it.paragraphIndex]=="$prefix\n\n$suffix"}
            assertThat(passages[joined.contextIndex!!]).contains("Example Company")
            assertThat(passages[units.last().contextIndex!!]).contains("Other Company")
        }
    }
    @Test fun `compound prose and wrapped bullet remain under the dated employer`() {
        val text="WORK EXPERIENCE\n2021 - 2024 First Company - Founder\n"+
            "Founder of a consulting - and product studio\nbuilding reliable services.\n"+
            "- Combined delivery, architecture,\n\nand operational support.\n\n"+
            "Second Company - Consultant\n- Supported teams."
        val units=CvSourceUnits.create(text);val passages=CvSourceUnits.passages(text,units)
        val headers=units.filter {it.kind==CvSourceUnitKind.ENTRY_HEADER}
        assertThat(headers).hasSize(2)
        val bullets=units.filter {it.kind==CvSourceUnitKind.BULLET}
        assertThat(passages[bullets[0].paragraphIndex]).contains("architecture,\n\nand operational support.")
        assertThat(bullets.map {it.contextIndex}).containsExactlyElementsOf(headers.map {it.paragraphIndex})
        assertThat(units.single {passages[it.paragraphIndex].startsWith("Founder of")}.editable).isTrue()
    }
    private val source="Fictional Pilot\nContact: pilot@example.test\nNØKKELKVALIFIKASJONER\n"+
        "First profile paragraph across\nwrapped lines.\n\nSecond profile paragraph.\n\nThird profile paragraph.\n"+
        "KJERNEKOMPETANSE\nClinical care\n\nAssessment, medication and clinical records\nCoordination\n"+
        "Scheduling, handovers and quality routines\nARBEIDSERFARING\n08.2023 – 01.2026 Example Hospital – Registered nurse\n"+
        "Provided clinical care across\nmultiple teams.\n- Reviewed records and\n  supported patient handovers.\n- Coordinated daily care.\n"+
        "2019 – 2023 Example Clinic – Nurse\nProvided outpatient care.\nUTDANNING\n2019 Example College – Nursing degree\nCompleted clinical placements."

    @Test fun `logical units separate headings profile paragraphs skills and sourced employment contributions`() {
        val units=CvSourceUnits.create(source);val passages=CvSourceUnits.passages(source,units)
        assertThat(CvSourceUnits.valid(source,units)).isTrue()
        assertThat(passages).contains("First profile paragraph across\nwrapped lines.","Second profile paragraph.","Third profile paragraph.")
        assertThat(units.filter {it.kind==CvSourceUnitKind.SKILL_GROUP}).hasSize(2)
        assertThat(passages[units.first {it.kind==CvSourceUnitKind.SKILL_GROUP}.paragraphIndex])
            .isEqualTo("Clinical care\n\nAssessment, medication and clinical records")
        val bullets=units.filter {it.kind==CvSourceUnitKind.BULLET}
        assertThat(bullets).hasSize(2)
        assertThat(bullets).allMatch {it.contextIndex!=null && passages[it.contextIndex!!].contains("Example Hospital")}
        assertThat(units.filter {it.kind in setOf(CvSourceUnitKind.IDENTITY,CvSourceUnitKind.SECTION_HEADING,CvSourceUnitKind.ENTRY_HEADER)})
            .allMatch {!it.editable}
        val sections=CvSections.identify(source,passages)
        assertThat(sections.map {it.kind}).contains(CvSectionKind.PROFILE,CvSectionKind.SKILLS,CvSectionKind.EXPERIENCE,CvSectionKind.EDUCATION)
        assertThat(sections.filter {it.kind==CvSectionKind.PROFILE}.single().paragraphIndexes).hasSize(4)
    }

    @Test fun `stored ranges change only the selected contribution and preserve all original separators`() {
        val units=CvSourceUnits.create(source);val index=units.first {it.kind==CvSourceUnitKind.BULLET}.paragraphIndex
        val old=source.substring(units[index].start,units[index].end)
        val result=CvTailoringResult(UUID.randomUUID(),UUID.randomUUID(),"Gemini","synthetic",listOf(
            CvTextProposal(index,old,"- Reviewed clinical records and supported handovers.","Source-based visibility",emptyList(),emptyList())),0,sourceUnits=units)
        val snapshot=TailoringSnapshot(result,source,emptyList(),emptyList(),"nb")
        val assembled=CvReviewedText.assemble(snapshot,listOf(WordingReview(index,result.proposals.single().newText,WordingDecision.ACCEPTED)))
        assertThat(assembled).isEqualTo(source.substring(0,units[index].start)+result.proposals.single().newText+source.substring(units[index].end))
        val header=units.first {it.kind==CvSourceUnitKind.ENTRY_HEADER}
        val protected=result.copy(proposals=listOf(CvTextProposal(header.paragraphIndex,source.substring(header.start,header.end),"Changed title","Invalid",emptyList(),emptyList())))
        assertThatThrownBy {CvReviewedText.assemble(snapshot.copy(result=protected),listOf(WordingReview(header.paragraphIndex,"Changed title",WordingDecision.ACCEPTED)))}
            .isInstanceOf(CvFailure::class.java)
    }

    @Test fun `invalid stored ranges fail closed while null metadata keeps legacy indexes and repeated text`() {
        val units=CvSourceUnits.create(source)
        assertThat(CvSourceUnits.valid(source,units.drop(1))).isFalse()
        assertThat(CvSourceUnits.valid(source,units.mapIndexed {i,u->if(i==1)u.copy(start=0) else u})).isFalse()
        assertThat(CvSourceUnits.valid(source,units.mapIndexed {i,u->if(i==0)u.copy(editable=true) else u})).isFalse()
        assertThatThrownBy {CvSourceUnits.passages(source,emptyList())}.isInstanceOf(CvFailure::class.java)
        val legacy="Repeated\n\nRepeated\n"
        assertThat(CvSourceUnits.passages(legacy,null)).containsExactlyElementsOf(CvReviewedText.paragraphs(legacy))
        val long="a".repeat(3999)+"😀"+"b".repeat(4200)
        val segmented=CvSourceUnits.create(long)
        assertThat(CvSourceUnits.passages(long,segmented).joinToString("")).isEqualTo(long)
        assertThat(segmented.first().end).isEqualTo(3999)
        assertThat(CvSourceUnits.valid(long,listOf(CvSourceUnit(0,0,4000,CvSourceUnitKind.TEXT,true),CvSourceUnit(1,4000,long.length,CvSourceUnitKind.TEXT,true)))).isFalse()
    }

    @Test fun `date-only title rows and ISO periods remain exact protected context without linking across sections`() {
        val text="WORK EXPERIENCE\n2022-01 – 2023-08\nExample Company – Coordinator\nCoordinated deliveries.\n- Supported teams.\nSKILLS\nPlanning\nSchedules, handovers"
        val units=CvSourceUnits.create(text)
        val header=units.single {it.kind==CvSourceUnitKind.ENTRY_HEADER}
        assertThat(text.substring(header.start,header.end)).isEqualTo("2022-01 – 2023-08\nExample Company – Coordinator")
        assertThat(units.first {it.kind==CvSourceUnitKind.BULLET}.contextIndex).isEqualTo(header.paragraphIndex)
        assertThat(units.last().contextIndex).isNull()
    }

    @Test fun `date-last split and undated entry headers cannot borrow the previous employer scope`() {
        val text="## WORK EXPERIENCE\n2020 – 2021 First Company – Coordinator\n- Supported teams.\n\n"+
            "Second Company – Engineer – 2021–2024\n- Built APIs.\n\nThird Company\nSenior Engineer\n2024 – present\n"+
            "- Operated services.\n\nFourth Company – Consultant\n- Advised clients."
        val units=CvSourceUnits.create(text);val passages=CvSourceUnits.passages(text,units)
        val headers=units.filter {it.kind==CvSourceUnitKind.ENTRY_HEADER}
        assertThat(headers).hasSize(4).allMatch {!it.editable && it.contextIndex==null}
        assertThat(passages[headers[2].paragraphIndex]).isEqualTo("Third Company\nSenior Engineer\n2024 – present")
        val bullets=units.filter {it.kind==CvSourceUnitKind.BULLET}
        assertThat(bullets.map {it.contextIndex}).containsExactlyElementsOf(headers.map {it.paragraphIndex})
    }
}
