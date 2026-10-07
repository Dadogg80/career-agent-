package com.careeragent.profile.application

import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import java.util.UUID

data class VerifiedIdentity(val issuer: String, val subject: String)
data class CareerProfileView(val id: UUID, val displayName: String, val preferredLanguage: String, val revision: Long)
class ProfileFailure(val code: String, val status: Int) : RuntimeException(code)

interface ProfileRepository {
    fun read(identity: VerifiedIdentity): CareerProfileView?
    fun save(identity: VerifiedIdentity, displayName: String, language: String, revision: Long): CareerProfileView
}

@Service
@Profile("persistence")
class ProfileService(private val profiles: ProfileRepository) {
    fun read(identity: VerifiedIdentity): CareerProfileView? = profiles.read(identity)
    fun save(identity: VerifiedIdentity, displayName: String, language: String, revision: Long): CareerProfileView {
        if (displayName.trim().length !in 1..200 || language !in setOf("nb", "en") || revision < 0 || displayName.any { it.isISOControl() }) throw ProfileFailure("PROFILE_INVALID", 400)
        return profiles.save(identity, displayName.trim(), language, revision)
    }
}
