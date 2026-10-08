package com.careeragent.documents

import com.careeragent.ai.application.*
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.mock.web.MockMultipartFile
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.nio.file.Files
import java.time.Instant
import java.util.UUID

@SpringBootTest(properties=["DOCUMENT_AI_BATCH_DELAY_SECONDS=0","DOCUMENT_AI_MAX_REQUESTS=100"])
@AutoConfigureMockMvc
@ActiveProfiles("persistence")
@Testcontainers
class DocumentWorkflowIntegrationTest {
    @MockitoBean lateinit var model:AiModel
    @Autowired lateinit var mvc:MockMvc
    @Autowired lateinit var json:ObjectMapper
    @Autowired lateinit var jdbc:JdbcTemplate
    @Autowired lateinit var routing:AiRouting
    @Autowired lateinit var environment:org.springframework.core.env.ConfigurableEnvironment
    @Autowired lateinit var runs:com.careeragent.documents.infrastructure.JdbcDocumentRunRepository
    private val path="/api/profile/me/documents/workflow"
    private val text="## Example AS\nSenior Developer 2021 – 2024\nBuilt APIs using Kotlin and PostgreSQL."
    private fun caller(user:String)=oidcLogin().idToken { it.issuer("https://example.test").subject(user).audience(listOf("career-agent")).issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(600)) }
    private fun profile():String {
        val user=UUID.randomUUID().toString()
        mvc.perform(put("/api/profile/me").with(caller(user)).with(csrf()).contentType("application/json").content("""{"displayName":"Synthetic Pilot","preferredLanguage":"nb","revision":0}""")).andExpect(status().isOk)
        return user
    }
    private fun upload(user:String,content:String=text):String= json.readTree(mvc.perform(multipart("/api/profile/me/documents").file(MockMultipartFile("file","synthetic.md","text/markdown",content.toByteArray())).param("language","nb").with(caller(user)).with(csrf())).andExpect(status().isOk).andReturn().response.contentAsString)["id"].asText()
    private fun body(ids:List<String>,consent:Boolean=true)=mapOf("scope" to "collection","locale" to "nb","consent" to consent,"documents" to ids.map {mapOf("documentId" to it,"text" to text)})
    private fun post(user:String,url:String,body:Any):JsonNode=json.readTree(mvc.perform(post(url).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isOk).andExpect(header().string("Cache-Control","no-store")).andReturn().response.contentAsString)
    private fun next(user:String,run:JsonNode)=post(user,"$path/${run["id"].asText()}/next",mapOf("revision" to run["revision"].asLong()))
    private fun output()=json.writeValueAsString(mapOf("competencies" to listOf(mapOf("skills" to listOf("Kotlin","PostgreSQL","InventedSkill"),"description" to "Utviklet API-er med Kotlin og PostgreSQL.","category" to "TECHNOLOGY","evidenceIds" to listOf(2),"contextId" to 0,"context" to "Example AS")),"profile" to listOf(mapOf("kind" to "EXPERIENCE","text" to "Utvikling av API-er.","evidenceIds" to listOf(2))),"history" to listOf(mapOf("kind" to "EMPLOYMENT","title" to "Senior Developer","organization" to "Example AS","client" to "","deliveryRole" to "","periodText" to "2021 – 2024","description" to "Utviklet API-er.","evidenceIds" to listOf(0,1,2)))))
    private fun stub(){`when`(model.generateJson(anyString(),anyString(),anyMap(),(any(AiTask::class.java) ?: AiTask.DOCUMENT_EXTRACTION))).thenAnswer { call -> if(call.getArgument<AiTask>(3)==AiTask.PROFILE_SUMMARY)"""{"profile":[{"kind":"PROFILE","text":"Erfaring med API-er, Kotlin og PostgreSQL.","evidenceIds":[0]}]}""" else output() }}
    @Test fun `Gemini requires recipient approval and removing its availability prevents saved continuation`() {
        val user=profile();val doc=upload(user);val name="gemini-approval-test"
        environment.propertySources.addFirst(org.springframework.core.env.MapPropertySource(name,mapOf("AI_PROVIDER" to "gemini")))
        try {
            val config=json.readTree(mvc.perform(get("/api/ai/config")).andExpect(status().isOk).andExpect(header().string("Cache-Control","no-store")).andReturn().response.contentAsString)
            assertThat(config["documents"]["selections"][0]["provider"].asText()).isEqualTo("Gemini")
            assertThat(config.toString()).doesNotContain("API_KEY")
            for(approval in listOf(null,"a".repeat(64))) {
                val input=body(listOf(doc)) + (approval?.let {mapOf("aiApproval" to it)} ?: emptyMap())
                mvc.perform(post(path).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(input)))
                    .andExpect(status().isConflict).andExpect(jsonPath("$.code").value("AI_APPROVAL_CHANGED"))
            }
            verifyNoInteractions(model)
            val initial=post(user,path,body(listOf(doc))+mapOf("aiApproval" to config["documents"]["token"].asText()))
            assertThat(initial["analysis"]["provider"].asText()).isEqualTo("Gemini")
            assertThat(initial["aiApproval"].asText()).isEqualTo(config["documents"]["token"].asText())
            stub();val first=next(user,initial)
            environment.propertySources.remove(name)
            environment.propertySources.addFirst(org.springframework.core.env.MapPropertySource(name,mapOf("GEMINI_API_KEY" to "")))
            mvc.perform(post("$path/${first["id"].asText()}/next").with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(mapOf("revision" to first["revision"].asLong()))))
                .andExpect(status().isConflict).andExpect(jsonPath("$.code").value("AI_APPROVAL_CHANGED"))
            verify(model,times(1)).generateJson(anyString(),anyString(),anyMap(),(any(AiTask::class.java) ?: AiTask.DOCUMENT_EXTRACTION))
            mvc.perform(get("$path/${first["id"].asText()}").with(caller(user))).andExpect(status().isOk).andExpect(jsonPath("$.completedBatches").value(1)).andExpect(jsonPath("$.analysis.provider").value("Gemini"))
        } finally {environment.propertySources.remove(name)}
    }
    @Test fun `explicit Gemini switch keeps completed evidence and rejects missing consent stale revision and another owner`() {
        val user=profile();val ids=listOf(upload(user),upload(user));stub()
        val initial=post(user,path,body(ids));val first=next(user,initial)
        `when`(model.generateJson(anyString(),anyString(),anyMap(),(any(AiTask::class.java) ?: AiTask.DOCUMENT_EXTRACTION))).thenThrow(AiFailure("AI_RATE_LIMITED",429,968))
        val paused=next(user,first)
        val name="explicit-provider-switch"
        environment.propertySources.addFirst(org.springframework.core.env.MapPropertySource(name,mapOf("GEMINI_API_KEY" to "fictional-test-key")))
        try {
            val config=json.readTree(mvc.perform(get("/api/ai/config")).andExpect(status().isOk).andReturn().response.contentAsString)
            val alternative=config["options"]["documents"].first { it["approval"]["selections"].all { selection -> selection["provider"].asText()=="Gemini" } }
            assertThat(alternative["available"].asBoolean()).isTrue()
            assertThat(config.toString()).doesNotContain("fictional-test-key")
            val endpoint="$path/${paused["id"].asText()}/provider"
            val input=mapOf("revision" to paused["revision"].asLong(),"consent" to true,"aiApproval" to alternative["approval"]["token"].asText())
            for((who,changes,expected) in listOf(Triple(user,mapOf("consent" to false),400),Triple(user,mapOf("revision" to 1),409),Triple(profile(),emptyMap(),404))) {
                mvc.perform(post(endpoint).with(caller(who)).with(csrf()).contentType("application/json").content(json.writeValueAsString(input+changes))).andExpect(status().`is`(expected))
            }
            mvc.perform(post(endpoint).with(caller(user)).contentType("application/json").content(json.writeValueAsString(input))).andExpect(status().isForbidden)
            val switched=post(user,endpoint,input)
            assertThat(switched["completedBatches"]).isEqualTo(paused["completedBatches"])
            assertThat(switched["analysis"]).isEqualTo(paused["analysis"])
            assertThat(switched["approvedDocuments"]).isEqualTo(paused["approvedDocuments"])
            assertThat(switched["approvedDocuments"][0]["text"].asText()).isEqualTo(text)
            assertThat(switched["nextAt"].isNull).isTrue()
            assertThat(switched["plannedSelections"][0]["provider"].asText()).isEqualTo("Gemini")
            `when`(model.generateJson(anyString(),anyString(),anyMap(),(any(AiTask::class.java) ?: AiTask.DOCUMENT_EXTRACTION),(any(AiSelection::class.java) ?: AiSelection("Gemini","gemini-3.5-flash")))).thenReturn(output())
            val continued=next(user,switched)
            assertThat(continued["completedBatches"].asInt()).isEqualTo(2)
            assertThat(continued["analysis"]["suggestions"].size()).isEqualTo(2)
            assertThat(continued["analysis"]["provider"].asText()).isEqualTo("Groq + Gemini")
            assertThat(continued["analysis"]["aiSelections"].map { it["provider"].asText() }).containsExactly("Groq","Gemini")
            verify(model,times(1)).generateJson(anyString(),anyString(),anyMap(),(eq(AiTask.DOCUMENT_EXTRACTION) ?: AiTask.DOCUMENT_EXTRACTION),(eq(AiSelection("Gemini","gemini-3.5-flash")) ?: AiSelection("Gemini","gemini-3.5-flash")))
        } finally {environment.propertySources.remove(name)}
    }
    @Test fun `whole-document planning covers every source character without requiring manual portions`() {
        val document=UUID.randomUUID();val source=(1..120).joinToString("\n") { "Line $it: explicit evidence with Kotlin and PostgreSQL, preserving each word." }
        val batches=com.careeragent.documents.application.DocumentAnalysisPlanner.batches(mapOf(document to source))
        assertThat(batches.sumOf { it.characters }).isEqualTo(source.length)
        assertThat(batches.joinToString("") { it.text }).isEqualTo(source)
        assertThat(batches.size).isGreaterThan(1)
    }
    @Test fun `oversized serialized progress is rejected before replacing retained data`() {
        val user=profile(); val id=upload(user); val initial=post(user,path,body(listOf(id)))
        val identity=com.careeragent.profile.application.VerifiedIdentity("https://example.test",user)
        val state=runs.load(identity,UUID.fromString(initial["id"].asText()))
        assertThat(runs.encoded(state)).isNotBlank()
        assertThatThrownBy { runs.encoded(state.copy(sources=mapOf(UUID.fromString(id) to "字".repeat(3_700_000)))) }
            .isInstanceOf(com.careeragent.documents.application.DocumentFailure::class.java)
        assertThat(runs.load(identity,state.id)).isEqualTo(state)
        verifyNoInteractions(model)
    }
    @Test fun `owned workflow is opt-in resumable deduplicated and imports edited drafts with explicit confirmation`() {
        val user=profile();val ids=listOf(upload(user),upload(user));stub()
        val initial=post(user,path,body(ids));assertThat(initial["completedBatches"].asInt()).isZero();verifyNoInteractions(model)
        val first=next(user,initial);val replay=next(user,initial);assertThat(replay).isEqualTo(first)
        verify(model,times(1)).generateJson(anyString(),anyString(),anyMap(),(eq(AiTask.DOCUMENT_EXTRACTION) ?: AiTask.DOCUMENT_EXTRACTION))
        val second=next(user,first);val finished=next(user,second)
        assertThat(finished["status"].asText()).isEqualTo("COMPLETED")
        assertThat(finished["analysis"]["partial"].asBoolean()).isFalse()
        assertThat(finished["analysis"]["inputCharacters"].asInt()).isEqualTo(text.length*2)
        assertThat(finished["analysis"]["suggestions"].size()).isEqualTo(2)
        assertThat(finished["analysis"]["suggestions"][0]["additionalSources"].size()).isEqualTo(1)
        mvc.perform(get("/api/profile/me/entries").with(caller(user))).andExpect(jsonPath("$.length()").value(0))
        val draft=finished["analysis"]["careerEntries"][0]
        val entryBody=mapOf("key" to draft["key"].asText(),"content" to json.convertValue(draft["content"],Map::class.java),"confirm" to true)
        val entry=post(user,"$path/${initial["id"].asText()}/entries",entryBody)
        assertThat(entry["status"].asText()).isEqualTo("CONFIRMED");assertThat(entry["content"]["startMonth"].isNull).isTrue()
        assertThat(post(user,"$path/${initial["id"].asText()}/entries",entryBody)["id"]).isEqualTo(entry["id"])
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM career_entry_evidence WHERE entry_id=?::uuid",Long::class.java,entry["id"].asText())).isEqualTo(4L)
        mvc.perform(get("/api/profile/me/entries/${entry["id"].asText()}/evidence").with(caller(user))).andExpect(jsonPath("$.length()").value(4))
        mvc.perform(get("/api/profile/me/entries/${entry["id"].asText()}/evidence").with(caller(profile()))).andExpect(status().isNotFound)
        val claimBody=mapOf("revision" to finished["revision"].asLong(),"index" to 0,"skill" to "Kotlin","statement" to "Jeg utviklet API-er med Kotlin.","context" to "Example AS","confirm" to true)
        val claim=post(user,"$path/${initial["id"].asText()}/claims",claimBody)
        assertThat(claim["status"].asText()).isEqualTo("CONFIRMED")
        mvc.perform(get("/api/profile/me/claims/${claim["id"].asText()}/evidence").with(caller(user))).andExpect(jsonPath("$.length()").value(2))
        mvc.perform(get("$path/${initial["id"].asText()}").with(caller(user))).andExpect(jsonPath("$.analysis.suggestions[0].statement").value("Utviklet API-er med Kotlin og PostgreSQL."))
        mvc.perform(delete("/api/profile/me/documents/${ids[0]}").with(caller(user)).with(csrf())).andExpect(status().isNoContent)
        mvc.perform(get("$path?scope=collection").with(caller(user))).andExpect(jsonPath("$.run").isEmpty)
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM document_analysis_run WHERE id=?::uuid",Long::class.java,initial["id"].asText())).isZero()
        mvc.perform(get("/api/profile/me/entries").with(caller(user))).andExpect(jsonPath("$.length()").value(1))
    }
    @Test fun `quota pause preserves drafts and long delay and blocks an immediate repeated model call`() {
        val user=profile();val ids=listOf(upload(user),upload(user));stub();val initial=post(user,path,body(ids));val first=next(user,initial)
        `when`(model.generateJson(anyString(),anyString(),anyMap(),(any(AiTask::class.java) ?: AiTask.DOCUMENT_EXTRACTION))).thenThrow(AiFailure("AI_RATE_LIMITED",429,968))
        val paused=next(user,first);assertThat(paused["status"].asText()).isEqualTo("PAUSED");assertThat(paused["analysis"]["suggestions"].size()).isEqualTo(2)
        assertThat(next(user,paused)).isEqualTo(paused)
        verify(model,times(2)).generateJson(anyString(),anyString(),anyMap(),(eq(AiTask.DOCUMENT_EXTRACTION) ?: AiTask.DOCUMENT_EXTRACTION))
    }
    @Test fun `workflow source ownership consent CSRF invalidation and payload spoofing are enforced before AI`() {
        val user=profile();val other=profile();val id=upload(user)
        mvc.perform(get("$path?scope=collection")).andExpect(status().isUnauthorized)
        mvc.perform(post(path).with(caller(user)).contentType("application/json").content(json.writeValueAsString(body(listOf(id))))).andExpect(status().isForbidden)
        mvc.perform(post(path).with(caller(other)).with(csrf()).contentType("application/json").content(json.writeValueAsString(body(listOf(id))))).andExpect(status().isNotFound)
        mvc.perform(post(path).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(body(listOf(id),false)))).andExpect(status().isBadRequest)
        val run=post(user,path,body(listOf(id)))
        mvc.perform(get("$path/${run["id"].asText()}").with(caller(other))).andExpect(status().isNotFound)
        mvc.perform(post("$path/${run["id"].asText()}/next").with(caller(user)).with(csrf()).contentType("application/json").content("""{"revision":1,"ownerId":"spoofed"}""")).andExpect(status().isBadRequest)
        // A reread changes the source snapshot and discards the full-text run copies.
        jdbc.update("UPDATE career_document SET extracted_text='old reading' WHERE id=?::uuid",id)
        post(user,"/api/profile/me/documents/$id/reread",mapOf("ocr" to false))
        mvc.perform(get("$path/${run["id"].asText()}").with(caller(user))).andExpect(status().isNotFound)
        verifyNoInteractions(model)
    }
    @Test fun `automatic population preserves literal documentary basis and fills editable history without replay writes`() {
        val user=profile();val ids=listOf(upload(user),upload(user));stub()
        val initial=post(user,path,body(ids)+mapOf("populateProfile" to true))
        val first=next(user,initial)
        assertThat(first["populateProfile"].asBoolean()).isTrue()
        val list=json.readTree(mvc.perform(get("/api/profile/me/claims").with(caller(user))).andExpect(status().isOk).andReturn().response.contentAsString)
        assertThat(list.size()).isEqualTo(2)
        assertThat(list.map { it["confirmationBasis"].asText() }).containsOnly("DOCUMENT")
        assertThat(list.map { it["status"].asText() }).containsOnly("CONFIRMED")
        assertThat(list.map { it["statement"].asText() }).containsOnly("Built APIs using Kotlin and PostgreSQL.")
        assertThat(list.toString()).doesNotContain("Utviklet API-er")
        val history=json.readTree(mvc.perform(get("/api/profile/me/entries").with(caller(user))).andReturn().response.contentAsString)
        assertThat(history.size()).isEqualTo(1)
        assertThat(history[0]["status"].asText()).isEqualTo("UNVERIFIED")
        assertThat(history[0]["content"]["startMonth"].isNull).isTrue()
        assertThat(next(user,initial)).isEqualTo(first)
        val complete=next(user,next(user,first))
        assertThat(complete["status"].asText()).isEqualTo("COMPLETED")
        assertThat(complete["analysis"]["suggestions"].all { it["profileClaimId"].isTextual }).isTrue()
        mvc.perform(get("$path?scope=profile").with(caller(user))).andExpect(status().isOk).andExpect(jsonPath("$.run.id").value(initial["id"].asText()))
        mvc.perform(get("$path?scope=profile").with(caller(profile()))).andExpect(jsonPath("$.run").isEmpty)
        val kotlin=list.first { it["skill"].asText()=="Kotlin" }
        mvc.perform(get("/api/profile/me/claims/${kotlin["id"].asText()}/evidence").with(caller(user))).andExpect(jsonPath("$.length()").value(2))
        val kotlinIndex=complete["analysis"]["suggestions"].indexOfFirst { it["skill"].asText()=="Kotlin" }
        val attested=post(user,"$path/${complete["id"].asText()}/claims",mapOf("revision" to complete["revision"].asLong(),"index" to kotlinIndex,"skill" to "Kotlin","statement" to kotlin["statement"].asText(),"context" to kotlin["context"].asText(),"confirm" to true))
        assertThat(attested["id"]).isEqualTo(kotlin["id"])
        assertThat(attested["confirmationBasis"].asText()).isEqualTo("USER")
        val fresh=post(user,path,body(ids)+mapOf("populateProfile" to true));next(user,fresh)
        mvc.perform(get("/api/profile/me/claims/${kotlin["id"].asText()}/history").with(caller(user))).andExpect(jsonPath("$.total").value(2))
        mvc.perform(get("/api/profile/me/claims").with(caller(user))).andExpect(jsonPath("$.length()").value(2))
        mvc.perform(get("/api/profile/me/entries").with(caller(user))).andExpect(jsonPath("$.length()").value(1))
    }
    @Test fun `another automatic analysis does not restore deleted rejected or edited profile information`() {
        val user=profile();val doc=upload(user);stub()
        val first=next(user,post(user,path,body(listOf(doc))+mapOf("populateProfile" to true)))
        val suggestions=first["analysis"]["suggestions"]
        val rejected=suggestions[0]["profileClaimId"].asText();val deleted=suggestions[1]["profileClaimId"].asText()
        post(user,"/api/profile/me/claims/$rejected/review",mapOf("decision" to "REJECT","revision" to 1))
        mvc.perform(delete("/api/profile/me/claims/$deleted").with(caller(user)).with(csrf()).contentType("application/json").content("""{"revision":1}""")).andExpect(status().isNoContent)
        val entry=first["analysis"]["careerEntries"][0]["profileEntryId"].asText()
        val content=json.convertValue(first["analysis"]["careerEntries"][0]["content"],Map::class.java)+mapOf("description" to "My reviewed contribution","sourceNote" to "Personal review")
        mvc.perform(put("/api/profile/me/entries/$entry").with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(mapOf("revision" to 1,"content" to content)))).andExpect(status().isOk)
        val repeated=next(user,post(user,path,body(listOf(doc))+mapOf("populateProfile" to true)))
        mvc.perform(get("/api/profile/me/claims").with(caller(user))).andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].status").value("REJECTED"))
        mvc.perform(get("/api/profile/me/entries").with(caller(user))).andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].content.description").value("My reviewed contribution"))
        assertThat(repeated["analysis"]["suggestions"][1]["profileClaimId"].isNull).isTrue()
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM document_profile_import WHERE claim_id IS NULL AND kind='CLAIM'",Long::class.java)).isGreaterThanOrEqualTo(1L)
    }
    @Test fun `invalid structured response recovers explicit list items without inventing AI history or another call`() {
        val user=profile();val source="## Example AS\nSenior Developer\nTeknologi: Kotlin, PostgreSQL, React Native"
        val doc=upload(user,source)
        `when`(model.generateJson(anyString(),anyString(),anyMap(),(any(AiTask::class.java) ?: AiTask.DOCUMENT_EXTRACTION))).thenReturn("{\"unexpected\":true}")
        val initial=post(user,path,mapOf("scope" to "collection","documents" to listOf(mapOf("documentId" to doc,"text" to source)),"locale" to "nb","consent" to true,"populateProfile" to true))
        val first=next(user,initial)
        assertThat(first["status"].asText()).isEqualTo("RUNNING")
        assertThat(first["analysis"]["suggestions"].map { it["skill"].asText() }).containsExactly("Kotlin","PostgreSQL","React Native")
        assertThat(first["analysis"]["suggestions"].all { it["recovered"].asBoolean() }).isTrue()
        assertThat(first["analysis"]["careerEntries"].size()).isZero()
        verify(model,times(1)).generateJson(anyString(),anyString(),anyMap(),(eq(AiTask.DOCUMENT_EXTRACTION) ?: AiTask.DOCUMENT_EXTRACTION))
    }
    @Test fun `review decisions stay outside pending proposals after reopening and another analysis`() {
        val user=profile();val doc=upload(user);stub()
        val first=next(user,post(user,path,body(listOf(doc))))
        val endpoint="$path/${first["id"].asText()}"
        fun input(index:Int,confirm:Boolean,reject:Boolean=false)=mapOf("revision" to first["revision"].asLong(),"index" to index,
            "skill" to first["analysis"]["suggestions"][index]["skill"].asText(),"statement" to first["analysis"]["suggestions"][index]["statement"].asText(),"context" to "Example AS","confirm" to confirm,"reject" to reject)
        val confirmed=post(user,"$endpoint/claims",input(0,true))
        post(user,"$endpoint/claims",input(1,false,true))
        val reloaded=json.readTree(mvc.perform(get(endpoint).with(caller(user))).andExpect(status().isOk).andReturn().response.contentAsString)
        assertThat(reloaded["analysis"]["suggestions"].map { it["reviewState"].asText() }).containsExactly("CONFIRMED","REJECTED")
        assertThat(reloaded["revision"]).isEqualTo(first["revision"])
        verify(model,times(1)).generateJson(anyString(),anyString(),anyMap(),(eq(AiTask.DOCUMENT_EXTRACTION) ?: AiTask.DOCUMENT_EXTRACTION))
        val fresh=next(user,post(user,path,body(listOf(doc))))
        assertThat(fresh["analysis"]["suggestions"].map { it["reviewState"].asText() }).containsExactly("CONFIRMED","REJECTED")
        val changed=mapOf("revision" to confirmed["revision"].asLong(),"skill" to "Kotlin","statement" to "My corrected contribution","context" to "Example AS","sourceNote" to "Reviewed by me")
        mvc.perform(put("/api/profile/me/claims/${confirmed["id"].asText()}").with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(changed))).andExpect(status().isOk)
        mvc.perform(get("$path/${fresh["id"].asText()}").with(caller(user))).andExpect(jsonPath("$.analysis.suggestions[0].reviewState").value("DRAFT"))
        mvc.perform(post("$path/${fresh["id"].asText()}/claims").with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(input(0,true,true)))).andExpect(status().isBadRequest)
        mvc.perform(get("$path/${fresh["id"].asText()}").with(caller(profile()))).andExpect(status().isNotFound)
    }
    @Test fun `automatic documentary import does not treat C as an explicit mention inside C plus plus or C sharp`() {
        val user=profile();val source="## Example AS\nTeknologi: C++, C#\nAdditional source text.";val doc=upload(user,source)
        `when`(model.generateJson(anyString(),anyString(),anyMap(),(any(AiTask::class.java) ?: AiTask.DOCUMENT_EXTRACTION)))
            .thenReturn("""{"competencies":[{"skills":["C","C++"],"description":"Listed technologies","category":"TECHNOLOGY","evidenceIds":[1],"contextId":0,"context":"Example AS"}],"profile":[],"history":[]}""")
        val state=next(user,post(user,path,mapOf("scope" to "collection","documents" to listOf(mapOf("documentId" to doc,"text" to source)),"locale" to "nb","consent" to true,"populateProfile" to true)))
        assertThat(state["analysis"]["suggestions"].map { it["skill"].asText() }).doesNotContain("C").contains("C++","C#")
        mvc.perform(get("/api/profile/me/claims").with(caller(user))).andExpect(jsonPath("$.length()").value(2))
    }
    companion object {
        private val storage=Files.createTempDirectory("career-workflow-test-")
        @Container @JvmStatic val postgres=PostgreSQLContainer<Nothing>("postgres@sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826")
        @DynamicPropertySource @JvmStatic fun database(r:DynamicPropertyRegistry){r.add("spring.datasource.url",postgres::getJdbcUrl);r.add("spring.datasource.username",postgres::getUsername);r.add("spring.datasource.password",postgres::getPassword);r.add("DOCUMENT_STORAGE_PATH"){storage.toString()}}
    }
}
