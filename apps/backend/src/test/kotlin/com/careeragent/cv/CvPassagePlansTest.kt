package com.careeragent.cv

import com.careeragent.cv.application.*
import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.util.UUID

class CvPassagePlansTest {
    private val mapper=ObjectMapper();private val claim=UUID.randomUUID()
    private val proposal=CvTextProposal(1,"Original","Supported wording","Relevant evidence",listOf(claim),listOf(0))
    private fun item(i:Int,action:String="KEEP_UNCHANGED",ids:List<String> = emptyList(),criteria:List<Int> = emptyList())=mapOf("paragraphIndex" to i,"action" to action,"reason" to "Specific passage reason $i","claimIds" to ids,"requirementIndexes" to criteria)
    private fun parse(items:Any,blocked:Set<Int> = emptySet(),invalid:Boolean=false)=CvPassagePlans.parse(mapper.valueToTree(mapOf("passagePlans" to items)),4,listOf(proposal),setOf(claim),2,"nb",blocked,invalid)
    @Test fun `every source unit has its own assessment and missing reasons never inherit section review`() {
        val plans=parse(listOf(item(0),item(1,"PROPOSE_CHANGES",listOf(claim.toString()),listOf(0)),item(2)))
        assertThat(plans.map {it.paragraphIndex}).containsExactly(0,1,2,3)
        assertThat(plans.map {it.assessed}).containsExactly(true,true,true,false)
        assertThat(plans[1].action).isEqualTo(CvSectionAction.PROPOSE_CHANGES)
        assertThat(plans[3].action).isEqualTo(CvSectionAction.NEEDS_REVIEW)
    }
    @Test fun `duplicate contradictory unsupported and foreign declarations fail closed`() {
        assertThat(parse(listOf(item(0),item(0)))[0].assessed).isFalse()
        assertThat(parse(listOf(item(1)))[1].assessed).isFalse()
        assertThat(parse(listOf(item(2,"PROPOSE_CHANGES",listOf(claim.toString()),listOf(0))))[2].assessed).isFalse()
        assertThat(parse(listOf(item(1,"PROPOSE_CHANGES",listOf(UUID.randomUUID().toString()),listOf(0))))[1].assessed).isFalse()
        assertThat(parse(listOf(item(1,"PROPOSE_CHANGES",listOf(claim.toString()),listOf(1))))[1].assessed).isFalse()
        assertThat(parse(listOf(item(0),item(500)))).allMatch {!it.assessed}
        assertThat(parse(listOf(item(0)),setOf(0))[0].assessed).isFalse()
        assertThat(parse(listOf(item(0)),invalid=true)).allMatch {!it.assessed}
    }
}
