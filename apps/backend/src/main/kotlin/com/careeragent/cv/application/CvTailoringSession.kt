package com.careeragent.cv.application

import com.careeragent.jobs.application.PersonalMatchService
import com.careeragent.jobs.application.SavedJobRepository
import com.careeragent.jobs.domain.MatchClaim
import com.careeragent.profile.application.VerifiedIdentity
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import java.time.OffsetDateTime
import java.util.UUID

enum class WordingDecision { PENDING, ACCEPTED, REJECTED }
data class WordingReview(val paragraphIndex: Int, val text: String, val decision: WordingDecision)
data class TailoringSnapshot(val result: CvTailoringResult, val text: String, val claims: List<MatchClaim>,
    val quotes: List<String>, val locale: String, val promptVersion: String = "cv-wording-v1")
data class CvTailoringSession(val id: UUID, val jobId: UUID, val revision: Long, val snapshot: TailoringSnapshot,
    val reviews: List<WordingReview>, val createdAt: OffsetDateTime, val stale: Boolean = false)
data class TailoringReviewRequest(val sessionId: UUID, val revision: Long, val reviews: List<WordingReview>)
interface CvTailoringSessionRepository {
    fun checkCapacity(identity: VerifiedIdentity, jobId: UUID)
    fun create(identity: VerifiedIdentity, jobId: UUID, snapshot: TailoringSnapshot): CvTailoringSession
    fun latest(identity: VerifiedIdentity, jobId: UUID): CvTailoringSession?
    fun review(identity: VerifiedIdentity, jobId: UUID, request: TailoringReviewRequest): CvTailoringSession
}

/** Wording approval is never factual confirmation or final document approval. */
object TailoringReviewPolicy {
    fun validate(snapshot: TailoringSnapshot, reviews: List<WordingReview>) {
        if (reviews.size > snapshot.result.proposals.size || reviews.map { it.paragraphIndex }.distinct().size != reviews.size ||
            reviews.any { review -> snapshot.result.proposals.none { it.paragraphIndex == review.paragraphIndex } ||
                review.text.isBlank() || review.text.length > 4000 || review.text.any { it.isISOControl() && it !in "\n\r\t" } })
            throw CvFailure("CV_INVALID", 400)
    }
}

@Service
@Profile("persistence")
class CvTailoringSessions(private val repository: CvTailoringSessionRepository, private val tailoring: CvTailoringService,
    private val matching: PersonalMatchService, private val jobs: SavedJobRepository) {
    fun propose(identity: VerifiedIdentity, jobId: UUID, request: TailoringRequest): CvTailoringResult {
        repository.checkCapacity(identity, jobId)
        val match = matching.load(identity, jobId) ?: throw CvFailure("CV_SOURCE_CONFLICT", 409)
        val job = jobs.get(identity, jobId)
        val result = tailoring.propose(identity, jobId, request)
        val saved = repository.create(identity, jobId, TailoringSnapshot(result, request.text, match.claims,
            job.content.requirements.map { it.quote }, request.locale))
        return result.copy(sessionId = saved.id)
    }
    fun latest(identity: VerifiedIdentity, jobId: UUID) = repository.latest(identity, jobId)
    fun review(identity: VerifiedIdentity, jobId: UUID, request: TailoringReviewRequest) = repository.review(identity, jobId, request)
}
