package com.careeragent.cv

import com.careeragent.cv.application.*
import com.careeragent.jobs.domain.MatchClaim
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.Test
import java.util.UUID

class CvWordingGuardTest {
    private val id=UUID.randomUUID()
    private fun proposal(text:String)=CvTextProposal(0,"Worked on APIs in 2023.",text,"Specific wording",listOf(id),listOf(0))
    @Test fun `new quantities dates and percentages need literal support from referenced evidence`() {
        val claims=listOf(MatchClaim(id,2,"APIs","Improved latency by 25% and mentored 10 colleagues.","Example AS"))
        assertThat(CvWordingGuard.supported(proposal("Improved API latency by 25% in 2023."),claims)).isTrue()
        assertThat(CvWordingGuard.supported(proposal("Improved API latency by 95%."),claims)).isFalse()
        assertThat(CvWordingGuard.supported(proposal("Led 20 colleagues in 2026."),claims)).isFalse()
        assertThat(CvWordingGuard.supported(proposal("Worked on APIs."),claims)).isTrue()
    }
    @Test fun `unreferenced claims cannot support new numerical wording and absence of numbers is not semantic verification`() {
        val other=MatchClaim(UUID.randomUUID(),2,"Sales","Sold 100 contracts.","Other employer")
        assertThat(CvWordingGuard.supported(proposal("Sold 100 contracts."),listOf(other))).isFalse()
        // Deliberately demonstrates this guard's limit: prose still requires semantic/user/final review.
        assertThat(CvWordingGuard.supported(proposal("Led the entire company."),emptyList())).isTrue()
    }
    @Test fun `history year-shaped values are retained even when another referenced claim contains a different year`() {
        val claims=listOf(MatchClaim(id,2,"APIs","Worked on APIs in 2024.","Example AS"))
        assertThat(CvWordingGuard.supported(proposal("Worked on APIs in 2024."),claims,true)).isFalse()
        assertThat(CvWordingGuard.supported(proposal("Worked on APIs in 2023."),claims,true)).isTrue()
    }
    @Test fun `unsupported edited wording remains saveable as pending but cannot be accepted`() {
        val result=CvTailoringResult(UUID.randomUUID(),UUID.randomUUID(),"Gemini","fixture-model",listOf(proposal("Worked on APIs.")),0)
        val snapshot=TailoringSnapshot(result,"Worked on APIs in 2023.",emptyList(),listOf("API work"),"nb")
        TailoringReviewPolicy.validate(snapshot,listOf(WordingReview(0,"Led 100 staff.",WordingDecision.PENDING)))
        assertThatThrownBy {TailoringReviewPolicy.validate(snapshot,listOf(WordingReview(0,"Led 100 staff.",WordingDecision.ACCEPTED)))}
            .isInstanceOf(CvFailure::class.java).hasMessage("CV_WORDING_UNSUPPORTED")
        TailoringReviewPolicy.validate(snapshot,listOf(WordingReview(0,"Worked on APIs in 2023.",WordingDecision.ACCEPTED)))
    }
}
