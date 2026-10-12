package com.careeragent.profile.application

import com.careeragent.ai.application.AiSelection
import com.careeragent.documents.application.DocumentAnalysisWorkflow
import com.careeragent.documents.domain.ProfileSummaryDraft
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.context.annotation.Profile
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

data class SelectedPresentationSection(val runId: UUID, val runRevision: Long, val index: Int,
    val item: ProfileSummaryDraft, val sources: Map<UUID,String>, val selections: List<AiSelection>, val provider: String)
data class PresentationView(val locale: String, val revision: Long, val sections: List<SelectedPresentationSection>)

@Service
@Profile("persistence")
class PresentationService(private val jdbc: JdbcTemplate, private val mapper: ObjectMapper,
    private val workflows: DocumentAnalysisWorkflow) {
    private fun locale(value: String) { if(value !in setOf("nb","en"))throw ProfileFailure("PROFILE_INVALID",400) }
    @Transactional(readOnly=true)
    fun read(identity: VerifiedIdentity, language: String): PresentationView {
        locale(language)
        return jdbc.query("""SELECT p.content::text FROM career_presentation p JOIN app_user u ON u.id=p.owner_id
            WHERE u.oidc_issuer=? AND u.oidc_subject=? AND p.locale=?""",
            {row,_->mapper.readValue(row.getString(1),PresentationView::class.java)},identity.issuer,identity.subject,language)
            .singleOrNull() ?: PresentationView(language,0,emptyList())
    }
    @Transactional
    fun select(identity: VerifiedIdentity, runId: UUID, runRevision: Long, index: Int, revision: Long): PresentationView {
        if(revision<0 || runRevision<1 || index !in 0..79)throw ProfileFailure("PROFILE_INVALID",400)
        val owner=jdbc.query("""SELECT u.id FROM app_user u JOIN career_profile p ON p.owner_id=u.id
            WHERE u.oidc_issuer=? AND u.oidc_subject=? FOR UPDATE OF u""",
            {row,_->row.getObject(1,UUID::class.java)},identity.issuer,identity.subject).singleOrNull()
            ?: throw ProfileFailure("PROFILE_NOT_CREATED",404)
        val run=workflows.load(identity,runId)
        if(run.revision!=runRevision || run.status!="COMPLETED")throw ProfileFailure("PROFILE_CONFLICT",409)
        val item=run.analysis.profile.getOrNull(index) ?: throw ProfileFailure("PROFILE_INVALID",400)
        val current=read(identity,run.analysis.locale)
        if(current.revision!=revision)throw ProfileFailure("PROFILE_CONFLICT",409)
        val chosen=SelectedPresentationSection(run.id,run.revision,index,item,
            run.analysis.documents.associate {it.documentId to it.originalName},run.analysis.aiSelections,run.analysis.provider)
        val next=PresentationView(current.locale,current.revision+1,current.sections.filter {it.item.kind!=item.kind}+chosen)
        jdbc.update("""INSERT INTO career_presentation(owner_id,locale,revision,content) VALUES (?,?,?,?::jsonb)
            ON CONFLICT(owner_id,locale) DO UPDATE SET revision=EXCLUDED.revision,content=EXCLUDED.content,updated_at=CURRENT_TIMESTAMP""",
            owner,next.locale,next.revision,mapper.writeValueAsString(next))
        return next
    }
}
