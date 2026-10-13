package com.careeragent.cv.application

import com.fasterxml.jackson.databind.JsonNode
import java.util.UUID

data class CvPassagePlan(val paragraphIndex: Int, val action: CvSectionAction, val reason: String,
    val claimIds: List<UUID>, val requirementIndexes: List<Int>, val assessed: Boolean = true)

/** An independent source-unit declaration; a section coverage list never supplies missing individual reasons. */
object CvPassagePlans {
    fun parse(root: JsonNode, count: Int, proposals: List<CvTextProposal>, claims: Set<UUID>, requirements: Int,
              locale: String, blocked: Set<Int> = emptySet(), invalidProposals: Boolean = false): List<CvPassagePlan> {
        val items=root.path("passagePlans");val parsed=mutableMapOf<Int,CvPassagePlan>();val seen=mutableSetOf<Int>();val invalid=mutableSetOf<Int>()
        var foreign=false
        if(items.isArray && items.size()<=1000) for(item in items) {
            val index=item.path("paragraphIndex")
            if(!index.isInt || index.asInt() !in 0 until count){foreign=true;continue}
            val i=index.asInt()
            if(!seen.add(i)){invalid.add(i);continue}
            try {
                require(item.isObject && item.fieldNames().asSequence().toSet()==setOf("paragraphIndex","action","reason","claimIds","requirementIndexes"))
                val action=CvSectionAction.valueOf(item.path("action").asText())
                val reason=item.path("reason");require(reason.isTextual && reason.asText().isNotBlank() && reason.asText().length<=300 && reason.asText().none {it.isISOControl() && it !in "\n\r\t"})
                val ids=item.path("claimIds");require(ids.isArray && ids.size()<=10)
                val proof=ids.map {require(it.isTextual);UUID.fromString(it.asText()).also {id->require(id in claims)}}.distinct()
                val indexes=item.path("requirementIndexes");require(indexes.isArray && indexes.size()<=128)
                val criteria=indexes.map {require(it.isInt && it.asInt() in 0 until requirements);it.asInt()}.distinct()
                val proposal=proposals.singleOrNull {it.paragraphIndex==i}
                if(action==CvSectionAction.KEEP_UNCHANGED)require(proposal==null)
                if(action==CvSectionAction.PROPOSE_CHANGES)require(proposal!=null && proof.containsAll(proposal.claimIds) && criteria.containsAll(proposal.requirementIndexes))
                parsed[i]=CvPassagePlan(i,action,reason.asText(),proof,criteria)
            } catch(_:IllegalArgumentException){invalid.add(i)}
        }
        return (0 until count).map {i->parsed[i]?.takeUnless {invalidProposals || foreign || i in invalid || i in blocked} ?: CvPassagePlan(i,CvSectionAction.NEEDS_REVIEW,
            if(locale=="nb") "Ingen gyldig egen vurdering ble levert for dette avsnittet. Originalteksten er beholdt."
            else "No valid individual assessment was supplied for this passage. Original wording is retained.",emptyList(),emptyList(),false)}
    }
}
