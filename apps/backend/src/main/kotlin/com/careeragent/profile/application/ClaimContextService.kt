package com.careeragent.profile.application

import com.careeragent.profile.domain.*
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import java.util.UUID

class ContextFailure(val code: String, val status: Int) : RuntimeException(code)
interface ClaimContextRepository {
    fun overview(identity: VerifiedIdentity, claimId: UUID): ClaimContextOverview
    fun decide(identity: VerifiedIdentity, claimId: UUID, command: ContextCommand): ClaimContextOverview
    fun linkDocumentFacts(identity: VerifiedIdentity, claimIds: Set<UUID>)
}
@Service
@Profile("persistence")
class ClaimContextService(private val contexts: ClaimContextRepository) {
    fun overview(identity: VerifiedIdentity, claimId: UUID) = contexts.overview(identity, claimId)
    fun decide(identity: VerifiedIdentity, claimId: UUID, command: ContextCommand): ClaimContextOverview {
        if (command.claimRevision < 1 || command.entryRevision < 1 || command.version !in 0..1000)
            throw ContextFailure("CONTEXT_INVALID", 400)
        return contexts.decide(identity, claimId, command)
    }
    fun linkDocumentFacts(identity: VerifiedIdentity, claimIds: Set<UUID>) = contexts.linkDocumentFacts(identity, claimIds)
}
