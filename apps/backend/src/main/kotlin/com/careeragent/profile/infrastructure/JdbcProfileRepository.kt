package com.careeragent.profile.infrastructure

import com.careeragent.profile.application.*

import org.springframework.context.annotation.Profile
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Repository
@Profile("persistence")
class JdbcProfileRepository(private val jdbc: JdbcTemplate) : ProfileRepository {
    @Transactional(readOnly = true)
    override fun read(identity: VerifiedIdentity): CareerProfileView? = jdbc.query(
        """SELECT p.id, p.display_name, p.preferred_language, p.revision FROM career_profile p
           JOIN app_user u ON u.id = p.owner_id WHERE u.oidc_issuer = ? AND u.oidc_subject = ?""",
        { row, _ -> CareerProfileView(row.getObject("id", UUID::class.java), row.getString("display_name"), row.getString("preferred_language"), row.getLong("revision")) },
        identity.issuer, identity.subject,
    ).singleOrNull()

    @Transactional
    override fun save(identity: VerifiedIdentity, displayName: String, language: String, revision: Long): CareerProfileView {
        // The upsert locks this user's binding for the transaction, serializing writes per owner.
        val owner = jdbc.queryForObject(
            """INSERT INTO app_user(id, oidc_issuer, oidc_subject) VALUES (?, ?, ?)
               ON CONFLICT (oidc_issuer, oidc_subject) DO UPDATE SET oidc_subject = EXCLUDED.oidc_subject RETURNING id""",
            UUID::class.java, UUID.randomUUID(), identity.issuer, identity.subject,
        )!!
        val current = read(identity)
        if (revision != (current?.revision ?: 0L)) throw ProfileFailure("PROFILE_CONFLICT", 409)
        if (current == null) {
            jdbc.update("INSERT INTO career_profile(id, owner_id, display_name, preferred_language, revision) VALUES (?, ?, ?, ?, 1)", UUID.randomUUID(), owner, displayName.trim(), language)
        } else {
            val changed = jdbc.update("UPDATE career_profile SET display_name = ?, preferred_language = ?, revision = revision + 1, updated_at = CURRENT_TIMESTAMP WHERE owner_id = ? AND revision = ?", displayName.trim(), language, owner, revision)
            if (changed != 1) throw ProfileFailure("PROFILE_CONFLICT", 409)
        }
        return read(identity)!!
    }
}
