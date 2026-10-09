package com.careeragent.profile.application

import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import java.util.UUID

data class VerifiedIdentity(val issuer: String, val subject: String)
data class CareerProfileView(val id: UUID, val displayName: String, val preferredLanguage: String, val revision: Long, val avatarAvailable: Boolean)
class ProfileFailure(val code: String, val status: Int) : RuntimeException(code)

interface ProfileRepository {
    fun read(identity: VerifiedIdentity): CareerProfileView?
    fun save(identity: VerifiedIdentity, displayName: String, language: String, revision: Long): CareerProfileView
    fun readAvatar(identity: VerifiedIdentity): ProfileAvatar?
    fun saveAvatar(identity: VerifiedIdentity, avatar: ProfileAvatar)
    fun deleteAvatar(identity: VerifiedIdentity)
}

@Service
@Profile("persistence")
class ProfileService(private val profiles: ProfileRepository, private val avatars: ProfileAvatarProcessor) {
    fun read(identity: VerifiedIdentity): CareerProfileView? = profiles.read(identity)
    fun save(identity: VerifiedIdentity, displayName: String, language: String, revision: Long): CareerProfileView {
        if (displayName.trim().length !in 1..200 || language !in setOf("nb", "en") || revision < 0 || displayName.any { it.isISOControl() }) throw ProfileFailure("PROFILE_INVALID", 400)
        return profiles.save(identity, displayName.trim(), language, revision)
    }

    fun avatar(identity: VerifiedIdentity): ProfileAvatar? {
        if (profiles.read(identity) == null) throw ProfileFailure("PROFILE_NOT_CREATED", 404)
        return profiles.readAvatar(identity)
    }

    fun saveAvatar(identity: VerifiedIdentity, bytes: ByteArray, mediaType: String?) {
        if (profiles.read(identity) == null) throw ProfileFailure("PROFILE_NOT_CREATED", 404)
        profiles.saveAvatar(identity, avatars.process(bytes, mediaType))
    }

    fun deleteAvatar(identity: VerifiedIdentity) {
        if (profiles.read(identity) == null) throw ProfileFailure("PROFILE_NOT_CREATED", 404)
        profiles.deleteAvatar(identity)
    }
}
