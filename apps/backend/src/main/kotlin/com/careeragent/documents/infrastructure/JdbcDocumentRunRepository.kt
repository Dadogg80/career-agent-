package com.careeragent.documents.infrastructure

import com.careeragent.documents.application.*
import com.careeragent.documents.domain.*
import com.careeragent.profile.application.VerifiedIdentity
import com.careeragent.profile.domain.CareerEntry
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.context.annotation.Profile
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Repository
@Profile("persistence")
class JdbcDocumentRunRepository(private val jdbc: JdbcTemplate, private val json: ObjectMapper, private val analyses: DocumentAnalysisRepository): DocumentRunRepository {
    internal fun encoded(state: DocumentRunState): String {
        // Allow headroom for PostgreSQL's JSONB spacing; bounds are bytes, not Kotlin characters.
        val result=json.writeValueAsString(state)
        if(result.toByteArray(Charsets.UTF_8).size>11_000_000 || json.writeValueAsBytes(state.analysis).size>900_000)
            throw DocumentFailure("DOCUMENT_AI_OUTPUT_TOO_LARGE",413)
        return result
    }
    private fun owner(i:VerifiedIdentity,lock:Boolean=false)=jdbc.query("SELECT u.id FROM app_user u JOIN career_profile p ON p.owner_id=u.id WHERE u.oidc_issuer=? AND u.oidc_subject=?"+(if(lock) " FOR UPDATE OF u" else ""),{r,_->r.getObject(1,UUID::class.java)},i.issuer,i.subject).singleOrNull() ?: throw DocumentFailure("PROFILE_NOT_CREATED",404)
    override fun latest(identity:VerifiedIdentity,scope:String)=jdbc.query("SELECT state::text FROM document_analysis_run WHERE owner_id=? AND scope=?",{r,_->json.readValue(r.getString(1),DocumentRunState::class.java)},owner(identity),scope).singleOrNull()
    override fun load(identity:VerifiedIdentity,id:UUID)=jdbc.query("SELECT state::text FROM document_analysis_run WHERE owner_id=? AND id=?",{r,_->json.readValue(r.getString(1),DocumentRunState::class.java)},owner(identity),id).singleOrNull() ?: throw DocumentFailure("DOCUMENT_NOT_FOUND",404)
    @Transactional override fun start(identity:VerifiedIdentity,state:DocumentRunState):DocumentRunState {
        val owner=owner(identity,true)
        val busy=jdbc.queryForObject("SELECT COUNT(*) FROM document_analysis_run WHERE owner_id=? AND scope=? AND lease_until>CURRENT_TIMESTAMP",Long::class.java,owner,state.scope)!! > 0
        if(busy) throw DocumentFailure("DOCUMENT_BUSY",429)
        jdbc.update("INSERT INTO document_analysis_run(owner_id,scope,id,revision,state) VALUES(?,?,?,?,?::jsonb) ON CONFLICT(owner_id,scope) DO UPDATE SET id=EXCLUDED.id,revision=EXCLUDED.revision,state=EXCLUDED.state,lease_until=NULL",owner,state.scope,state.id,state.revision,encoded(state))
        return state
    }
    @Transactional override fun claim(identity:VerifiedIdentity,id:UUID,revision:Long):DocumentRunState? {
        val count=jdbc.update("UPDATE document_analysis_run SET lease_until=CURRENT_TIMESTAMP+INTERVAL '60 seconds' WHERE owner_id=? AND id=? AND revision=? AND (lease_until IS NULL OR lease_until<CURRENT_TIMESTAMP)",owner(identity),id,revision)
        if(count==0) { val current=load(identity,id);if(current.revision==revision)throw DocumentFailure("DOCUMENT_BUSY",429);return null }
        return load(identity,id)
    }
    @Transactional override fun finish(identity:VerifiedIdentity,previous:DocumentRunState,next:DocumentRunState):DocumentRunState {
        val changed=jdbc.update("UPDATE document_analysis_run SET revision=?,state=?::jsonb,lease_until=NULL WHERE owner_id=? AND id=? AND revision=?",next.revision,encoded(next),owner(identity,true),previous.id,previous.revision)
        if(changed!=1) throw DocumentFailure("DOCUMENT_ANALYSIS_CONFLICT",409)
        if(next.completed>0) {
            if(next.scope=="collection")analyses.saveCollection(identity,next.analysis,next.sources)
            else analyses.save(identity,UUID.fromString(next.scope),next.analysis,next.sources.getValue(UUID.fromString(next.scope)))
        }
        return next
    }
    override fun lock(identity:VerifiedIdentity,id:UUID):DocumentRunState {
        val owner=owner(identity,true)
        return jdbc.query("SELECT state::text FROM document_analysis_run WHERE owner_id=? AND id=? FOR UPDATE",{r,_->json.readValue(r.getString(1),DocumentRunState::class.java)},owner,id).singleOrNull() ?: throw DocumentFailure("DOCUMENT_NOT_FOUND",404)
    }
    override fun attachEntry(identity:VerifiedIdentity,entry:CareerEntry,draft:CareerHistoryDraft) {
        val owner=owner(identity,true)
        val name=jdbc.queryForObject("SELECT original_name FROM career_document WHERE owner_id=? AND id=?",String::class.java,owner,draft.documentId) ?: throw DocumentFailure("DOCUMENT_NOT_FOUND",404)
        jdbc.update("INSERT INTO career_entry_evidence(entry_id,owner_id,revision,document_id,original_name,quote,period_text) VALUES(?,?,?,?,?,?,?) ON CONFLICT(entry_id,revision,document_id,quote) DO NOTHING",entry.id,owner,entry.revision,draft.documentId,name,draft.quote,draft.periodText)
    }
    override fun release(identity:VerifiedIdentity,id:UUID,revision:Long) { jdbc.update("UPDATE document_analysis_run SET lease_until=NULL WHERE owner_id=? AND id=? AND revision=?",owner(identity),id,revision) }
}
