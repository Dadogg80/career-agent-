package com.careeragent.cv

import com.careeragent.ai.application.*
import com.careeragent.cv.application.*
import com.careeragent.documents.application.*
import com.careeragent.documents.domain.*
import com.careeragent.jobs.application.*
import com.careeragent.jobs.domain.*
import com.careeragent.profile.application.VerifiedIdentity
import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.springframework.mock.env.MockEnvironment
import java.time.OffsetDateTime
import java.util.UUID

/** Exercises extraction/source units, the complete confirmed snapshot and proposal validation; no provider calls. */
class CvCareerQualityTest {
    private val mapper=ObjectMapper()
    private val cases=CvCareerQualityFixtures.cases()
    private val identity=VerifiedIdentity("https://identity.example.test","fictional-quality-user")
    private fun proposal(case: CvCareerQualityFixtures.Case,index: Int,contextOnly: Boolean=false) = mapOf(
        "paragraphIndex" to index,"newText" to if(contextOnly)case.unsupportedWording else case.supportedWording,
        "reason" to "Make the documented contribution visible without changing its scope.",
        "claimIds" to case.claims.map {it.id.toString()},"requirementIndexes" to listOf(0),
        "sourceEvidence" to case.claims.map {mapOf("claimId" to it.id.toString(),"quote" to if(contextOnly)it.context else it.statement)})
    private fun service(ai: AiModel=mock(AiModel::class.java)) = CvTailoringService(mock(SavedJobRepository::class.java),
        mock(DocumentRepository::class.java),mock(PersonalMatchService::class.java),AiRouting(MockEnvironment()),ai,mapper,5)

    @Test fun `three professions and original formats preserve each source statement and reviewable source ranges`() {
        assertThat(cases.map {it.profession}).doesNotHaveDuplicates().hasSize(3)
        assertThat(cases.map {it.format}).containsExactly("txt","docx","pdf")
        cases.forEach { case ->
            case.statements.forEach { assertThat(case.text).describedAs(case.id).contains(it) }
            assertThat(case.text).contains(case.organization)
            val units=CvSourceUnits.create(case.text)
            val passages=CvSourceUnits.passages(case.text,units)
            assertThat(passages.joinToString("").filterNot(Char::isWhitespace))
                .isEqualTo(case.text.filterNot(Char::isWhitespace))
            assertThat(units).anyMatch {it.editable}
            if(case.format=="pdf") {
                val contributionUnits=units.filter { unit -> case.statements.any {case.text.substring(unit.start,unit.end).contains(it)} }
                assertThat(contributionUnits.map {it.contextIndex}).doesNotContainNull().containsOnly(contributionUnits.first().contextIndex)
                assertThat(passages[contributionUnits.first().contextIndex!!]).contains(case.organization)
            }
        }
    }

    @Test fun `context-only proposals are omitted while fully cited siblings survive across professions`() {
        cases.forEach { case ->
            val units=CvSourceUnits.create(case.text);val paragraphs=CvSourceUnits.passages(case.text,units)
            val index=paragraphs.indexOfFirst {it.contains(case.statements.first())}
            assertThat(index).isGreaterThanOrEqualTo(0)
            val result=service().parse(mapper.writeValueAsString(mapOf("proposals" to listOf(
                proposal(case,index,true),proposal(case,index)))),paragraphs,case.claims,1)
            assertThat(result.second).describedAs(case.id).isEqualTo(1)
            assertThat(result.first.single().newText).isEqualTo(case.supportedWording)
            assertThat(result.first.single().sourceEvidence!!.map {it.quote}).containsExactlyElementsOf(case.statements)
        }
    }

    @Test fun `every referenced claim needs its own statement excerpt and context may supplement it`() {
        cases.forEach { case ->
            val paragraphs=listOf(case.statements.first())
            val proof=case.claims.mapIndexed {index,claim -> mapOf("claimId" to claim.id.toString(),"quote" to if(index==0)claim.statement else claim.context)}
            val mixed=proposal(case,0)+("sourceEvidence" to proof)
            assertThat(service().parse(mapper.writeValueAsString(mapOf("proposals" to listOf(mixed))),paragraphs,case.claims,1).first).isEmpty()
            val complete=proposal(case,0)+("sourceEvidence" to (case.claims.map {mapOf("claimId" to it.id.toString(),"quote" to it.statement)}+
                mapOf("claimId" to case.claims.first().id.toString(),"quote" to case.organization)))
            assertThat(service().parse(mapper.writeValueAsString(mapOf("proposals" to listOf(complete))),paragraphs,case.claims,1).first).hasSize(1)
        }
    }

    @Test fun `the joined proposal call retains all confirmed scope caveats and incomplete review after rejected evidence`() {
        cases.forEach { case ->
            val jobs=mock(SavedJobRepository::class.java);val documents=mock(DocumentRepository::class.java)
            val matching=mock(PersonalMatchService::class.java);val ai=mock(AiModel::class.java)
            val routing=AiRouting(MockEnvironment());val now=OffsetDateTime.now()
            val jobId=UUID.randomUUID();val docId=UUID.randomUUID();val matchId=UUID.randomUUID()
            val ad=case.advertisement
            `when`(jobs.get(identity,jobId)).thenReturn(SavedJob(jobId,SavedJobContent("Fictional ${case.profession} role",null,"PASTED_TEXT",ad,"en",
                listOf(ExtractedRequirement(case.criterion,RequirementKind.UNCLEAR,case.criterion)),emptyList(),0,null),now))
            `when`(documents.detail(identity,docId)).thenReturn(DocumentDetail(CareerDocument(docId,"fictional.${case.format}","application/octet-stream",case.original.size.toLong(),"a".repeat(64),"en",true,now),case.text))
            `when`(matching.load(identity,jobId)).thenReturn(PersonalMatch(matchId,"en",now,emptyList(),case.claims,0,case.text.length,automaticEvidence=true))
            val paragraphs=CvSourceUnits.passages(case.text,CvSourceUnits.create(case.text))
            val index=paragraphs.indexOfFirst {it.contains(case.statements.first())}
            val sections=CvSections.identify(case.text,paragraphs)
            var rejected=false
            `when`(ai.generateJson(anyString(),anyString(),anyMap(),eq(AiTask.CV_TAILORING) ?: AiTask.CV_TAILORING)).thenAnswer { call ->
                val input=mapper.readTree(call.getArgument<String>(1))
                assertThat(input.path("confirmedEvidence").map {it.path("statement").asText()}).containsExactlyElementsOf(case.statements)
                assertThat(input.path("confirmedEvidence").map {it.path("context").asText()}).containsOnly(case.organization)
                assertThat(input.path("baseParagraphs").size()).isEqualTo(paragraphs.size)
                val ids=case.claims.map {it.id.toString()}
                val passagePlans=paragraphs.indices.map {i -> mapOf("paragraphIndex" to i,
                    "action" to if(i==index)"PROPOSE_CHANGES" else "KEEP_UNCHANGED", "reason" to "Retain the specific source scope.",
                    "claimIds" to if(i==index)ids else emptyList<String>(),"requirementIndexes" to if(i==index)listOf(0) else emptyList<Int>())}
                val sectionPlans=sections.map {section -> mapOf("sectionId" to section.id,
                    "action" to if(index in section.paragraphIndexes)"PROPOSE_CHANGES" else "KEEP_UNCHANGED", "priority" to "LOW",
                    "reason" to "Preserve the documented ${case.profession} contribution.","reviewedParagraphIndexes" to section.paragraphIndexes,
                    "claimIds" to if(index in section.paragraphIndexes)ids else emptyList<String>(),
                    "requirementIndexes" to if(index in section.paragraphIndexes)listOf(0) else emptyList<Int>())}
                mapper.writeValueAsString(mapOf("proposals" to
                    (if(rejected)listOf(proposal(case,index,true),proposal(case,index)) else listOf(proposal(case,index))),
                    "sectionPlans" to sectionPlans,"passagePlans" to passagePlans))
            }
            val generator=CvTailoringService(jobs,documents,matching,routing,ai,mapper,5)
            for(includeRejected in listOf(false,true)) {
                rejected=includeRejected
                val result=generator.propose(identity,jobId,
                    TailoringRequest(docId,case.text,matchId,"en",true,routing.preview(AiTask.CV_TAILORING).token))
                assertThat(result.proposals.single().newText).describedAs(case.id).isEqualTo(case.supportedWording)
                assertThat(result.omittedItems).isEqualTo(if(includeRejected)1 else 0)
                assertThat(result.sectionPlans).isNotEmpty().allMatch {it.assessed != includeRejected}
                assertThat(result.passagePlans).isNotEmpty().allMatch {it.assessed != includeRejected}
            }
            verify(ai,times(2)).generateJson(anyString(),anyString(),anyMap(),eq(AiTask.CV_TAILORING) ?: AiTask.CV_TAILORING)
        }
    }
}
