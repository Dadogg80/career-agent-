package com.careeragent.cv

import com.careeragent.cv.domain.*
import com.careeragent.cv.infrastructure.StandardCvRenderer
import com.careeragent.cv.application.CvFailure
import com.careeragent.profile.domain.*
import org.apache.pdfbox.Loader
import org.apache.pdfbox.text.PDFTextStripper
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import java.time.OffsetDateTime
import java.util.UUID
import java.io.ByteArrayInputStream
import java.util.zip.ZipInputStream

class StandardCvRendererTest {
    private fun content(description:String="Bygget API-er i Norge."): CvContent {
        val now=OffsetDateTime.now();val entry=CareerEntry(UUID.randomUUID(),CareerEntryContent(EntryKind.EMPLOYMENT,"Utvikler","Eksempel AS","Kunde AS","API-utvikler",null,null,false,description,"PRIVATE SOURCE NOTE"),ClaimStatus.CONFIRMED,2,now,now)
        val claim=CompetencyClaim(UUID.randomUUID(),"Kotlin","Utviklet løsninger med Kotlin.","Betalingsprosjekt","PRIVATE EVIDENCE",ClaimStatus.CONFIRMED,2,now,now)
        return CvContent("nb",CvIdentity("Åse Ødegård","Seniorutvikler","ase@example.test","","Bærum","Min egen profiltekst."),listOf(claim),listOf(entry),null,null)
    }
    @Test fun `standard artifacts preserve Norwegian text role distinctions XML characters and multipage content without evidence notes`() {
        val files=StandardCvRenderer().generate(content("Arbeidet med XML <tag> & API-er.\n"+"Utviklet programvare i Norge. ".repeat(140)))
        assertEquals(setOf(CvFormat.DOCX,CvFormat.PDF),files.map {it.format}.toSet())
        val zipped=mutableMapOf<String,String>();ZipInputStream(ByteArrayInputStream(files.single {it.format==CvFormat.DOCX}.bytes)).use { z -> while(true){val e=z.nextEntry ?: break;zipped[e.name]=String(z.readBytes(),Charsets.UTF_8)} }
        val xml=zipped.getValue("word/document.xml");assertTrue(xml.contains("Åse Ødegård"));assertTrue(xml.contains("&lt;tag&gt; &amp; API-er."));assertTrue(xml.contains("Kunde: Kunde AS"));assertTrue(xml.contains("Leveranserolle: API-utvikler"));assertTrue(xml.contains("Ikke oppgitt"));assertFalse(xml.contains("PRIVATE"));assertFalse(zipped.values.any {it.contains("TargetMode=\"External\"")})
        Loader.loadPDF(files.single {it.format==CvFormat.PDF}.bytes).use { pdf -> val text=PDFTextStripper().getText(pdf);assertTrue(pdf.numberOfPages>1);assertTrue(text.contains("Åse Ødegård"));assertTrue(text.contains("Kunde AS"));assertTrue(text.contains("<tag> & API-er."));assertFalse(text.contains("PRIVATE"));assertTrue(text.contains("Utviklet løsninger med Kotlin.")) }
    }
    @Test fun `unsupported characters are reported rather than silently removed from candidate text`() {
        val error=assertThrows(CvFailure::class.java){StandardCvRenderer().generate(content().copy(identity=content().identity.copy(name="Fictional Pilot 🧬")))}
        assertEquals("CV_CHARACTER_UNSUPPORTED",error.code)
    }
}
