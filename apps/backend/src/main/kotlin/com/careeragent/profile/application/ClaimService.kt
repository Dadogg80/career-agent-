package com.careeragent.profile.application

import com.careeragent.profile.domain.*
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import java.util.UUID

class ClaimFailure(val code: String, val status: Int) : RuntimeException(code)
interface ClaimRepository {
    fun list(identity: VerifiedIdentity): List<CompetencyClaim>
    fun evidence(identity: VerifiedIdentity, id: UUID): List<ClaimEvidence>
    fun create(identity: VerifiedIdentity, content: ClaimContent): CompetencyClaim
    fun importDocumentFact(identity: VerifiedIdentity, content: ClaimContent): CompetencyClaim
    fun edit(identity: VerifiedIdentity, id: UUID, content: ClaimContent, revision: Long): CompetencyClaim
    fun review(identity: VerifiedIdentity, id: UUID, decision: ReviewDecision, revision: Long): CompetencyClaim
    fun history(identity: VerifiedIdentity, id: UUID): ClaimHistory
    fun delete(identity: VerifiedIdentity, id: UUID, revision: Long)
}

@Service
@Profile("persistence")
class ClaimService(private val claims: ClaimRepository) {
    fun evidence(identity: VerifiedIdentity, id: UUID) = claims.evidence(identity, id)
    fun list(identity: VerifiedIdentity) = claims.list(identity)
    fun create(identity: VerifiedIdentity, content: ClaimContent) = claims.create(identity, validated(content))
    /** Internal import: documentary confirmation applies to the literal source, never generated wording. */
    fun importDocumentFact(identity: VerifiedIdentity, content: ClaimContent): CompetencyClaim {
        val checked = validated(content)
        val quote = checked.sourceQuote
        if (checked.sourceDocumentId == null || quote == null || checked.statement != quote.trim() ||
            !Regex("(?<![\\p{L}\\p{N}_+#])" + Regex.escape(checked.skill) + "(?![\\p{L}\\p{N}_+#])", RegexOption.IGNORE_CASE).containsMatchIn(quote))
            throw ClaimFailure("CLAIM_INVALID", 400)
        return claims.importDocumentFact(identity, checked)
    }
    fun edit(identity: VerifiedIdentity, id: UUID, content: ClaimContent, revision: Long): CompetencyClaim {
        checkRevision(revision)
        return claims.edit(identity, id, validated(content), revision)
    }
    fun review(identity: VerifiedIdentity, id: UUID, decision: ReviewDecision, revision: Long): CompetencyClaim {
        checkRevision(revision)
        return claims.review(identity, id, decision, revision)
    }
    fun history(identity: VerifiedIdentity, id: UUID) = claims.history(identity, id)
    fun delete(identity: VerifiedIdentity, id: UUID, revision: Long) { checkRevision(revision); claims.delete(identity, id, revision) }
    private fun checkRevision(revision: Long) { if (revision < 1) throw ClaimFailure("CLAIM_INVALID", 400) }
    private fun validated(content: ClaimContent): ClaimContent {
        fun text(value: String, max: Int): String {
            val normalized = value.trim()
            if (normalized.length !in 1..max || normalized.any { it.isISOControl() && it != '\n' && it != '\r' && it != '\t' }) throw ClaimFailure("CLAIM_INVALID", 400)
            return normalized
        }
        return ClaimContent(text(content.skill, 120), text(content.statement, 1000), text(content.context, 500), text(content.sourceNote, 500), content.sourceDocumentId, content.sourceQuote)
    }
}
