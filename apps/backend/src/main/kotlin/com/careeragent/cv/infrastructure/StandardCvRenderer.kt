package com.careeragent.cv.infrastructure

import com.careeragent.cv.application.CvFailure
import com.careeragent.cv.domain.*
import com.careeragent.profile.domain.EntryKind
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.pdmodel.PDPage
import org.apache.pdfbox.pdmodel.PDPageContentStream
import org.apache.pdfbox.pdmodel.common.PDRectangle
import org.apache.pdfbox.pdmodel.font.PDType0Font
import org.springframework.stereotype.Component
import java.io.ByteArrayOutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
import javax.xml.stream.XMLOutputFactory

@Component
class StandardCvRenderer : CvRenderer {
    private data class Paragraph(val text: String, val style: String = "Normal")
    private fun paragraphs(content: CvContent): List<Paragraph> {
        val nb=content.locale=="nb";val h=content.identity
        val result=mutableListOf(Paragraph(h.name,"Title"))
        if(h.headline.isNotBlank()) result.add(Paragraph(h.headline,"Subtitle"))
        val contact=listOf(h.email,h.phone,h.location).filter { it.isNotBlank() }.joinToString(" · ")
        if(contact.isNotBlank()) result.add(Paragraph(contact))
        if(h.summary.isNotBlank()) {result.add(Paragraph(if(nb) "Profil" else "Profile","Heading1"));result.add(Paragraph(h.summary))}
        for(kind in EntryKind.entries) {
            val selected=content.entries.filter { it.content.kind==kind }
            if(selected.isEmpty()) continue
            val section=when(kind) { EntryKind.EMPLOYMENT -> if(nb) "Arbeidserfaring" else "Employment";EntryKind.PROJECT -> if(nb) "Prosjekter" else "Projects";EntryKind.EDUCATION -> if(nb) "Utdanning" else "Education";EntryKind.CERTIFICATION -> if(nb) "Sertifiseringer og kurs" else "Certifications and courses" }
            result.add(Paragraph(section,"Heading1"))
            selected.forEach { entry ->
                val e=entry.content
                result.add(Paragraph("${e.title} · ${e.organization}","Heading2"))
                val unknown=if(nb) "Ikke oppgitt" else "Not provided"
                result.add(Paragraph("${e.startMonth ?: unknown} – ${if(e.ongoing) (if(nb) "Nå" else "Present") else (e.endMonth ?: unknown)}"))
                if(e.client.isNotBlank()) result.add(Paragraph("${if(nb) "Kunde" else "Client"}: ${e.client}"))
                if(e.deliveryRole.isNotBlank()) result.add(Paragraph("${if(nb) "Leveranserolle" else "Delivery role"}: ${e.deliveryRole}"))
                if(e.description.isNotBlank()) result.add(Paragraph(e.description))
            }
        }
        if(content.claims.isNotEmpty()) {
            result.add(Paragraph(if(nb) "Kompetanse og bidrag" else "Competencies and contributions","Heading1"))
            content.claims.forEach { claim -> result.add(Paragraph(claim.skill,"Heading2"));result.add(Paragraph(claim.statement));result.add(Paragraph(claim.context)) }
        }
        return result.flatMap { paragraph -> paragraph.text.replace('\t',' ').replace("\r\n","\n").replace('\r','\n').split('\n').map { paragraph.copy(text=it) } }
    }
    override fun generate(content: CvContent): List<CvFile> {
        val paragraphs=paragraphs(content)
        return listOf(CvFile(CvFormat.DOCX,docx(paragraphs)),CvFile(CvFormat.PDF,pdf(paragraphs)))
    }
    private fun xml(block: (javax.xml.stream.XMLStreamWriter) -> Unit): ByteArray {
        val out=ByteArrayOutputStream();val writer=XMLOutputFactory.newFactory().createXMLStreamWriter(out,"UTF-8")
        writer.writeStartDocument("UTF-8","1.0");block(writer);writer.writeEndDocument();writer.close();return out.toByteArray()
    }
    private fun docx(paragraphs: List<Paragraph>): ByteArray {
        val ns="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
        val document=xml { x ->
            x.writeStartElement("w","document",ns);x.writeNamespace("w",ns);x.writeStartElement("w","body",ns)
            paragraphs.forEach { p ->
                x.writeStartElement("w","p",ns);x.writeStartElement("w","pPr",ns);x.writeEmptyElement("w","pStyle",ns);x.writeAttribute("w",ns,"val",p.style);x.writeEndElement()
                x.writeStartElement("w","r",ns);x.writeStartElement("w","t",ns);x.writeAttribute("xml","http://www.w3.org/XML/1998/namespace","space","preserve");x.writeCharacters(p.text);x.writeEndElement();x.writeEndElement();x.writeEndElement()
            }
            x.writeStartElement("w","sectPr",ns);x.writeEmptyElement("w","pgSz",ns);x.writeAttribute("w",ns,"w","11906");x.writeAttribute("w",ns,"h","16838");x.writeEmptyElement("w","pgMar",ns)
            listOf("top","right","bottom","left").forEach { x.writeAttribute("w",ns,it,"1134") };x.writeEndElement();x.writeEndElement();x.writeEndElement()
        }
        val styles=xml { x ->
            x.writeStartElement("w","styles",ns);x.writeNamespace("w",ns)
            listOf("Normal" to 22,"Title" to 48,"Subtitle" to 26,"Heading1" to 27,"Heading2" to 23).forEach { (name,size) ->
                x.writeStartElement("w","style",ns);x.writeAttribute("w",ns,"type","paragraph");x.writeAttribute("w",ns,"styleId",name);if(name=="Normal")x.writeAttribute("w",ns,"default","1")
                x.writeEmptyElement("w","name",ns);x.writeAttribute("w",ns,"val",name)
                x.writeStartElement("w","pPr",ns);x.writeEmptyElement("w","spacing",ns);x.writeAttribute("w",ns,"after",if(name=="Normal")"100" else "160");if(name!="Normal")x.writeEmptyElement("w","keepNext",ns);x.writeEndElement()
                x.writeStartElement("w","rPr",ns);x.writeEmptyElement("w","rFonts",ns);x.writeAttribute("w",ns,"ascii","Arial");x.writeAttribute("w",ns,"hAnsi","Arial");x.writeEmptyElement("w","sz",ns);x.writeAttribute("w",ns,"val",size.toString());if(name in listOf("Title","Heading1","Heading2"))x.writeEmptyElement("w","b",ns)
                x.writeEndElement();x.writeEndElement()
            };x.writeEndElement()
        }
        val out=ByteArrayOutputStream()
        ZipOutputStream(out).use { zip ->
            fun add(name:String,bytes:ByteArray){zip.putNextEntry(ZipEntry(name));zip.write(bytes);zip.closeEntry()}
            add("[Content_Types].xml","""<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>""".toByteArray())
            add("_rels/.rels","""<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>""".toByteArray())
            add("word/_rels/document.xml.rels","""<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>""".toByteArray())
            add("word/document.xml",document);add("word/styles.xml",styles)
        };return out.toByteArray()
    }
    private fun pdf(paragraphs: List<Paragraph>): ByteArray {
        try {
            PDDocument().use { document ->
                fun font(name:String)=javaClass.getResourceAsStream("/cv-fonts/$name").use { stream -> requireNotNull(stream);PDType0Font.load(document,stream,true) }
                val regular=font("DejaVuSans.ttf");val bold=font("DejaVuSans-Bold.ttf")
                var stream:PDPageContentStream?=null;var y=0f
                fun page(){stream?.close();if(document.numberOfPages>=20)throw CvFailure("CV_CONTENT_LIMIT",400);val p=PDPage(PDRectangle.A4);document.addPage(p);stream=PDPageContentStream(document,p);y=785f}
                fun write(line:String,font:PDType0Font,size:Float){if(y<size*1.5f+50)page();stream!!.beginText();stream!!.setFont(font,size);stream!!.setNonStrokingColor(32/255f,59/255f,48/255f);stream!!.newLineAtOffset(52f,y);stream!!.showText(line);stream!!.endText();y-=size*1.55f}
                page()
                try {
                    paragraphs.forEach { p ->
                        val size=when(p.style){"Title"->24f;"Subtitle"->13f;"Heading1"->13f;"Heading2"->11f;else->10.5f};val f=if(p.style in listOf("Title","Heading1","Heading2"))bold else regular
                        if(p.style=="Heading1"){y-=14;if(y<95)page()};if(p.style=="Heading2" && y<90)page()
                        var line=""
                        p.text.codePoints().toArray().forEach { code -> val ch=String(Character.toChars(code));if(f.getStringWidth(line+ch)*size/1000f>490f && line.isNotEmpty()){val boundary=line.lastIndexOf(' ');if(boundary>0){write(line.substring(0,boundary),f,size);line=line.substring(boundary+1)}else{write(line,f,size);line=""}};line+=ch }
                        write(line,f,size);y-=if(p.style=="Normal")4f else 6f
                    }
                } finally {stream?.close()}
                val out=ByteArrayOutputStream();document.save(out);return out.toByteArray()
            }
        } catch (error:CvFailure){throw error} catch (_:IllegalArgumentException){throw CvFailure("CV_CHARACTER_UNSUPPORTED",400)}
    }
}
