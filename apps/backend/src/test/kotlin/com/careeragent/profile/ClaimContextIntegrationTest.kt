package com.careeragent.profile

import com.careeragent.ai.application.AiModel
import com.careeragent.profile.application.*
import com.careeragent.profile.domain.*
import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.Mockito.verifyNoInteractions
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
import java.time.Instant
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("persistence")
@Testcontainers
class ClaimContextIntegrationTest {
    @Autowired lateinit var mvc: MockMvc
    @Autowired lateinit var json: ObjectMapper
    @Autowired lateinit var jdbc: JdbcTemplate
    @Autowired lateinit var claims: ClaimService
    @Autowired lateinit var entries: CareerEntryService
    @Autowired lateinit var contexts: ClaimContextService
    @MockitoBean lateinit var ai: AiModel
    private val source="## Example AS\nDeveloper 2023 – 2024\nBuilt APIs using Kotlin."
    private fun caller(user: String, issuer: String="https://example.test")=oidcLogin().idToken { it.issuer(issuer).subject(user).audience(listOf("career-agent")).issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(600)) }
    private fun identity(user: String)=VerifiedIdentity("https://example.test",user)
    private fun profile(user: String=UUID.randomUUID().toString(), issuer: String="https://example.test"): String {
        mvc.perform(put("/api/profile/me").with(caller(user,issuer)).with(csrf()).contentType("application/json").content("""{"displayName":"Synthetic Pilot","preferredLanguage":"nb","revision":0}""")).andExpect(status().isOk)
        return user
    }
    private fun upload(user: String, text: String=source): UUID=UUID.fromString(json.readTree(mvc.perform(multipart("/api/profile/me/documents")
        .file(MockMultipartFile("file","synthetic.md","text/markdown",text.toByteArray())).param("language","nb").with(caller(user)).with(csrf()))
        .andExpect(status().isOk).andReturn().response.contentAsString)["id"].asText())
    private fun claim(user: String, document: UUID?=null)=if(document==null) claims.create(identity(user),ClaimContent("Kotlin","Built APIs using Kotlin.","Example AS","Personal recollection"))
        else claims.importDocumentFact(identity(user),ClaimContent("Kotlin","Built APIs using Kotlin.","Example AS","Synthetic document",document,"Built APIs using Kotlin."))
    private fun entry(user: String, document: UUID?=null, title: String="Developer", quote: String=source): CareerEntry {
        val entry=entries.create(identity(user),CareerEntryContent(EntryKind.EMPLOYMENT,title,"Example AS","","","2023-01","2024-01",false,"Built APIs.","Synthetic source"))
        if(document!=null) {
            val owner=jdbc.queryForObject("SELECT owner_id FROM career_document WHERE id=?",UUID::class.java,document)!!
            jdbc.update("INSERT INTO career_entry_evidence(entry_id,owner_id,revision,document_id,original_name,quote,period_text) VALUES(?,?,1,?,'synthetic.md',?,'2023 – 2024')",entry.id,owner,document,quote)
        }
        return entry
    }
    private fun path(claim: CompetencyClaim)="/api/profile/me/claims/${claim.id}/contexts"
    private fun command(claim: CompetencyClaim, entry: CareerEntry, version: Long=0, decision: String="LINK")=mapOf("entryId" to entry.id,"claimRevision" to claim.revision,"entryRevision" to entry.revision,"version" to version,"decision" to decision)
    private fun decide(user: String, claim: CompetencyClaim, entry: CareerEntry, version: Long=0, decision: String="LINK") = mvc.perform(post(path(claim)).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(command(claim,entry,version,decision))))

    @Test fun `manual relationships preserve review states survive status reviews and become stale after semantic edits`() {
        val user=profile();val claim=claim(user);val entry=entry(user)
        decide(user,claim,entry).andExpect(status().isOk).andExpect(header().string("Cache-Control","no-store"))
            .andExpect(jsonPath("$.links[0].state").value("CURRENT")).andExpect(jsonPath("$.links[0].basis").value("USER"))
        decide(user,claim,entry).andExpect(status().isOk).andExpect(jsonPath("$.links[0].version").value(1))
        assertThat(claims.list(identity(user)).single().status).isEqualTo(ClaimStatus.UNVERIFIED)
        assertThat(entries.list(identity(user)).single().status).isEqualTo(ClaimStatus.UNVERIFIED)
        val confirmed=entries.review(identity(user),entry.id,1,ReviewDecision.CONFIRM)
        val attested=claims.review(identity(user),claim.id,ReviewDecision.CONFIRM,1)
        assertThat(contexts.overview(identity(user),claim.id).links.single().state).isEqualTo(ContextState.CURRENT)
        val edited=entries.edit(identity(user),entry.id,confirmed.content.copy(client="Reviewed Client"),2)
        assertThat(contexts.overview(identity(user),claim.id).links.single().state).isEqualTo(ContextState.STALE)
        decide(user,claim,entry,1).andExpect(status().isConflict)
        decide(user,attested,edited,1).andExpect(status().isOk).andExpect(jsonPath("$.links[0].state").value("CURRENT"))
        val changed=claims.edit(identity(user),claim.id,ClaimContent("Kotlin","Reviewed API contribution.","Example AS","Own review"),2)
        assertThat(contexts.overview(identity(user),claim.id).links.single().state).isEqualTo(ContextState.STALE)
        decide(user,changed,edited,2,"UNLINK").andExpect(status().isOk).andExpect(jsonPath("$.links[0].state").value("REMOVED"))
        decide(user,changed,edited,2).andExpect(status().isConflict)
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM claim_career_context WHERE claim_id=?",Long::class.java,claim.id)).isEqualTo(3)
        verifyNoInteractions(ai)
    }
    @Test fun `only unique exact shared document evidence creates automatic relationships and unlink is durable`() {
        val user=profile();val doc=upload(user);val claim=claim(user,doc);val entry=entry(user,doc)
        contexts.linkDocumentFacts(identity(user),setOf(claim.id))
        val link=contexts.overview(identity(user),claim.id).links.single()
        assertThat(link.basis).isEqualTo(ConfirmationBasis.DOCUMENT);assertThat(link.sourceQuote).isEqualTo(source)
        assertThat(link.entry.status).isEqualTo(ClaimStatus.UNVERIFIED)
        contexts.linkDocumentFacts(identity(user),setOf(claim.id))
        assertThat(contexts.overview(identity(user),claim.id).links.single().version).isEqualTo(1)
        decide(user,claim,entry,1,"UNLINK").andExpect(status().isOk)
        contexts.linkDocumentFacts(identity(user),setOf(claim.id))
        assertThat(contexts.overview(identity(user),claim.id).links.single().state).isEqualTo(ContextState.REMOVED)
        verifyNoInteractions(ai)
    }
    @Test fun `same company ambiguous entries and separate documents cannot establish automatic context`() {
        val user=profile();val doc=upload(user);val claim=claim(user,doc)
        entry(user,doc);val other=entry(user,doc,"Developer project")
        entries.review(identity(user),other.id,1,ReviewDecision.CONFIRM)
        contexts.linkDocumentFacts(identity(user),setOf(claim.id))
        assertThat(contexts.overview(identity(user),claim.id).links).isEmpty()
        val second=profile();val own=upload(second);val ownClaim=claim(second,own)
        entry(second,upload(second))
        contexts.linkDocumentFacts(identity(second),setOf(ownClaim.id))
        assertThat(contexts.overview(identity(second),ownClaim.id).links).isEmpty()
        val third=profile();val thirdDoc=upload(third);val thirdClaim=claim(third,thirdDoc)
        entry(third,thirdDoc,quote="Example AS\nInvented Kotlin contribution.")
        contexts.linkDocumentFacts(identity(third),setOf(thirdClaim.id))
        assertThat(contexts.overview(identity(third),thirdClaim.id).links).isEmpty()
        val fourth=profile();val partial=source.replace("Example AS","OtherExample ASomething");val fourthDoc=upload(fourth,partial)
        val fourthClaim=claim(fourth,fourthDoc);entry(fourth,fourthDoc,quote=partial)
        contexts.linkDocumentFacts(identity(fourth),setOf(fourthClaim.id))
        assertThat(contexts.overview(identity(fourth),fourthClaim.id).links).isEmpty()
        verifyNoInteractions(ai)
    }
    @Test fun `deleting originals retains quoted relationship proof while deleting targets cascades events`() {
        val user=profile();val doc=upload(user);val claim=claim(user,doc);val entry=entry(user,doc)
        contexts.linkDocumentFacts(identity(user),setOf(claim.id))
        mvc.perform(delete("/api/profile/me/documents/$doc").with(caller(user)).with(csrf())).andExpect(status().isNoContent)
        val retained=contexts.overview(identity(user),claim.id).links.single()
        assertThat(retained.sourceDocumentId).isNull();assertThat(retained.sourceQuote).isEqualTo(source)
        assertThat(retained.state).isEqualTo(ContextState.CURRENT)
        entries.delete(identity(user),entry.id,1)
        assertThat(contexts.overview(identity(user),claim.id).links).isEmpty()
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM claim_career_context WHERE claim_id=?",Long::class.java,claim.id)).isZero()
    }
    @Test fun `rejected facts are inactive and cannot be linked as active experience`() {
        val user=profile();val claim=claim(user);val entry=entry(user)
        decide(user,claim,entry).andExpect(status().isOk)
        val rejected=claims.review(identity(user),claim.id,ReviewDecision.REJECT,1)
        assertThat(contexts.overview(identity(user),claim.id).links.single().state).isEqualTo(ContextState.INACTIVE)
        decide(user,rejected,entry,1).andExpect(status().isBadRequest)
        decide(user,rejected,entry,1,"UNLINK").andExpect(status().isOk)
    }
    @Test fun `context ownership issuer CSRF strict inputs and stale revisions are enforced`() {
        val user=profile();val other=profile();profile(user,"https://other.example.test")
        val claim=claim(user);val entry=entry(user);val foreign=entry(other)
        mvc.perform(get(path(claim))).andExpect(status().isUnauthorized)
        mvc.perform(post(path(claim)).with(caller(user)).contentType("application/json").content(json.writeValueAsString(command(claim,entry)))).andExpect(status().isForbidden)
        for((subject,issuer) in listOf(other to "https://example.test",user to "https://other.example.test")) {
            mvc.perform(get(path(claim)).with(caller(subject,issuer))).andExpect(status().isNotFound)
            mvc.perform(post(path(claim)).with(caller(subject,issuer)).with(csrf()).contentType("application/json").content(json.writeValueAsString(command(claim,entry)))).andExpect(status().isNotFound)
        }
        decide(user,claim,foreign).andExpect(status().isNotFound)
        for(body in listOf(command(claim,entry)+("basis" to "DOCUMENT"), command(claim,entry)+("claimRevision" to 1.2),command(claim,entry)+("version" to -1),command(claim,entry)+("version" to 1001)))
            mvc.perform(post(path(claim)).with(caller(user)).with(csrf()).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isBadRequest)
        decide(user,claim.copy(revision=2),entry).andExpect(status().isConflict)
        mvc.perform(get("/api/profile/me/claims/not-a-uuid/contexts").with(caller(user))).andExpect(status().isBadRequest)
        assertThat(contexts.overview(identity(user),claim.id).links).isEmpty()
        verifyNoInteractions(ai)
    }
    companion object {
        @Container @JvmStatic val postgres=PostgreSQLContainer<Nothing>("postgres@sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826")
        @DynamicPropertySource @JvmStatic fun database(r: DynamicPropertyRegistry) { r.add("spring.datasource.url",postgres::getJdbcUrl);r.add("spring.datasource.username",postgres::getUsername);r.add("spring.datasource.password",postgres::getPassword) }
    }
}
