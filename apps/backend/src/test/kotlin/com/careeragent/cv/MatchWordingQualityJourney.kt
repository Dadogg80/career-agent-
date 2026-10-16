package com.careeragent.cv

import com.careeragent.ai.application.*
import com.careeragent.cv.application.*
import com.careeragent.documents.application.*
import com.careeragent.documents.domain.*
import com.careeragent.jobs.application.*
import com.careeragent.jobs.domain.*
import com.careeragent.profile.application.*
import com.careeragent.profile.domain.*
import com.fasterxml.jackson.databind.ObjectMapper
import org.mockito.Mockito.*
import java.time.OffsetDateTime
import java.util.UUID

/** Real matching -> saved result -> source-unit wording services; repositories/identity are controlled fixtures. */
internal object MatchWordingQualityJourney {
    data class Result(val match: PersonalMatch,val wording: CvTailoringResult)
    fun run(case: MatchWordingQualityFixtures.Case,routing: AiRouting,ai: AiModel,mapper: ObjectMapper): Result {
        val identity=VerifiedIdentity("https://identity.example.test","fictional-joined-quality")
        val now=OffsetDateTime.now();val jobId=UUID.nameUUIDFromBytes(case.id.toByteArray());val documentId=UUID.randomUUID()
        val jobs=mock(SavedJobRepository::class.java);val documents=mock(DocumentRepository::class.java)
        val claims=mock(ClaimRepository::class.java)
        val requirements=case.criteria.map {ExtractedRequirement(it.text,RequirementKind.REQUIRED,it.text)}
        val job=SavedJob(jobId,SavedJobContent("Fictional ${case.id} role",null,"PASTED_TEXT",case.advertisement,"nb",
            requirements,emptyList(),0,null),now)
        `when`(jobs.get(identity,jobId)).thenReturn(job)
        `when`(claims.list(identity)).thenReturn(case.claims.map {c -> CompetencyClaim(c.id,c.skill,c.statement,c.context,
            "Fictional independently supplied evidence",ClaimStatus.CONFIRMED,c.revision,now,now,confirmationBasis=ConfirmationBasis.USER) })
        `when`(documents.detail(identity,documentId)).thenReturn(DocumentDetail(CareerDocument(documentId,"fictional.txt",
            "text/plain",case.cv.toByteArray().size.toLong(),"a".repeat(64),"nb",true,now),case.cv))
        val saved=object:PersonalMatchRepository {
            var value:PersonalMatch?=null
            override fun load(identity:VerifiedIdentity,jobId:UUID)=value
            override fun save(identity:VerifiedIdentity,jobId:UUID,result:PersonalMatch):PersonalMatch {
                value=result;return result
            }
        }
        val matcher=PersonalMatchService(jobs,claims,saved,ai,mapper,1,routing)
        val match=matcher.analyze(identity,jobId,MatchRequest(case.advertisement,case.claims.map {MatchSelection(it.id,it.revision)},
            "nb",true,routing.preview(AiTask.PERSONAL_MATCH).token))
        val wording=CvTailoringService(jobs,documents,matcher,routing,ai,mapper,1).propose(identity,jobId,
            TailoringRequest(documentId,case.cv,match.id,"nb",true,routing.preview(AiTask.CV_TAILORING).token))
        return Result(match,wording)
    }
}
