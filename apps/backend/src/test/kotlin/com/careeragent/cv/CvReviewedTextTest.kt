package com.careeragent.cv

import com.careeragent.cv.application.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.assertEquals
import java.util.UUID

class CvReviewedTextTest {
    @Test fun `only accepted exact occurrences change while rejected wording and whitespace stay original`() {
        val source="Identity\n\nRepeated work\n \nRepeated work\n\nUnchanged education\n"
        val proposals=listOf(CvTextProposal(1,"Repeated work","First rewrite","Reason",emptyList(),emptyList()),CvTextProposal(2,"Repeated work","Second rewrite","Reason",emptyList(),emptyList()))
        val snapshot=TailoringSnapshot(CvTailoringResult(UUID.randomUUID(),UUID.randomUUID(),"Gemini","synthetic",proposals,0),source,emptyList(),emptyList(),"nb")
        val text=CvReviewedText.assemble(snapshot,listOf(WordingReview(1,"First rewrite",WordingDecision.REJECTED),WordingReview(2,"Reviewed second rewrite",WordingDecision.ACCEPTED)))
        assertEquals("Identity\n\nRepeated work\n \nReviewed second rewrite\n\nUnchanged education\n",text)
    }
}
