package com.careeragent.documents

import com.careeragent.ai.application.AiModel
import com.careeragent.documents.application.DocumentDraftExtractor
import com.careeragent.documents.domain.*
import com.careeragent.profile.domain.*
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.util.UUID

class ProfileSynthesisTest {
    @Test fun `condensing a profile retains sourced education and interests when the model omits those sections`() {
        val id=UUID.randomUUID()
        val profile=listOf(ProfileSummaryDraft("EXPERIENCE","API-utvikling",id,"Built APIs."),
            ProfileSummaryDraft("EDUCATION","Utviklingskurs",id,"Software development course, 2020."),
            ProfileSummaryDraft("INTERESTS","Sykling",id,"Interests: cycling."))
        val model=object:AiModel { override fun generateJson(system:String,user:String,schema:Map<String,Any>)="""{"profile":[{"kind":"PROFILE","text":"Erfaring med API-er.","evidenceIds":[0]}]}""" }
        val summary=DocumentDraftExtractor(model,jacksonObjectMapper()).summarize(profile,emptyList(),"nb")
        assertThat(summary.map { it.kind }).contains("PROFILE","EDUCATION","INTERESTS")
        assertThat(summary.find { it.kind=="EDUCATION" }).isEqualTo(profile[1])
        assertThat(summary.find { it.kind=="INTERESTS" }).isEqualTo(profile[2])
    }

    @Test fun `education found in history is included in the summary evidence even without a profile draft`() {
        val id=UUID.randomUUID();val quote="Example University: software development course, 2020."
        val content=CareerEntryContent(EntryKind.EDUCATION,"software development course","Example University","","",null,null,false,"2020","")
        val history=CareerHistoryDraft(UUID.randomUUID(),content,"2020",id,quote)
        var sent=""
        val model=object:AiModel { override fun generateJson(system:String,user:String,schema:Map<String,Any>):String {sent=user;return """{"profile":[{"kind":"EDUCATION","text":"Utviklingskurs i 2020.","evidenceIds":[0]}]}"""} }
        val summary=DocumentDraftExtractor(model,jacksonObjectMapper()).summarize(emptyList(),emptyList(),"nb",listOf(history))
        assertThat(sent).contains(quote)
        assertThat(summary.single().quote).isEqualTo(quote)
        assertThat(summary.single().documentId).isEqualTo(id)
    }
}
