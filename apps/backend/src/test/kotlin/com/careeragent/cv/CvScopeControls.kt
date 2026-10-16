package com.careeragent.cv

import com.careeragent.cv.application.*
import com.careeragent.jobs.domain.MatchClaim
import java.time.OffsetDateTime
import java.util.UUID

/** Human-selected expectations, withheld from the model; not a production semantic classifier. */
internal object CvScopeControls {
    data class Control(val id: String, val draft: String, val claims: List<MatchClaim>,
        val supported: Boolean, val rubric: String)

    fun controls(): List<Control> {
        val originals=CvCareerQualityFixtures.cases().flatMap { case -> listOf(
            Control("${case.id}-supported",case.supportedWording,case.claims,true,case.scopeProblem),
            Control("${case.id}-expanded",case.unsupportedWording,case.claims,false,case.scopeProblem),
            Control("${case.id}-compound","${case.supportedWording} ${case.unsupportedWording}",case.claims,false,
                "One supported sentence cannot establish support for the complete compound draft. ${case.scopeProblem}")) }
        fun pair(id: String, statement: String, positive: String, negative: String, rubric: String): List<Control> {
            val claim=MatchClaim(UUID.nameUUIDFromBytes(id.toByteArray()),1,"Navigation label",statement,"Fictional $id employer")
            return listOf(Control("$id-supported",positive,listOf(claim),true,rubric),
                Control("$id-expanded",negative,listOf(claim),false,rubric))
        }
        return originals + pair("logistics-team",
            "Our team redesigned the dispatch process. My own contribution was recording shipment data; I did not lead the redesign.",
            "Recorded shipment data for the dispatch team.","Led the redesign of the dispatch process.",
            "A team's result does not establish the candidate's personal leadership or ownership.") + pair("catering-course",
            "Practised menu planning in a training course. I have not planned menus in a commercial kitchen.",
            "Practised menu planning during training.","Planned menus for a commercial kitchen.",
            "Course practice must retain its training scope rather than become professional delivery.") + pair("finance-planned",
            "Proposed a new invoice reconciliation workflow. Implementation is planned; it has not been delivered.",
            "Proposed an invoice reconciliation workflow.","Delivered a new invoice reconciliation workflow.",
            "Proposed or planned work does not establish completed delivery.") + pair("operations-ownership",
            "Coordinated shift handovers with warehouse colleagues.",
            "Coordinated warehouse shift handovers.","Had personnel responsibility for warehouse staff.",
            "Coordination does not establish personnel responsibility. Missing evidence is not a proven lack of competence.") + pair("care-qualification",
            "Helped patients complete reception forms at the clinic.",
            "Assisted patients with reception forms.","Provided licensed clinical nursing care.",
            "Patient contact does not establish a regulated qualification. There is no explicit negative authorization fact.") + pair("retail-context",
            "Registered customer orders for Fictional retail-context employer.",
            "Registered customer orders for Fictional retail-context employer.","Registered customer orders for Unrelated Hospital.",
            "A documented activity cannot be transferred to another employer merely because the action matches.")
    }

    fun session(controls: List<Control>): CvTailoringSession {
        val proposals=controls.mapIndexed { index,c -> CvTextProposal(index,c.draft,c.draft,
            "Excluded generator judgment",c.claims.map {it.id},emptyList()) }
        val result=CvTailoringResult(UUID.randomUUID(),UUID.randomUUID(),"Fictional","scope-control",proposals,0)
        return CvTailoringSession(UUID.randomUUID(),UUID.randomUUID(),1,
            TailoringSnapshot(result,controls.joinToString("\n\n") {it.draft},controls.flatMap {it.claims}.distinctBy {it.id},
                emptyList(),"nb"),emptyList(),OffsetDateTime.now())
    }
}
