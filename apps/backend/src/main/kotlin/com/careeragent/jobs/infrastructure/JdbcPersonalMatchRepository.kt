package com.careeragent.jobs.infrastructure

import com.careeragent.jobs.application.*
import com.careeragent.jobs.domain.*
import com.careeragent.profile.application.VerifiedIdentity
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.context.annotation.Profile
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Repository
@Profile("persistence")
class JdbcPersonalMatchRepository(private val jdbc: JdbcTemplate, private val mapper: ObjectMapper) : PersonalMatchRepository {
 @Transactional(readOnly = true)
 override fun load(identity: VerifiedIdentity, jobId: UUID): PersonalMatch? = jdbc.query("SELECT a.result FROM job_match_analysis a JOIN app_user u ON u.id = a.owner_id WHERE a.job_id = ? AND u.oidc_issuer = ? AND u.oidc_subject = ?", { row, _ -> mapper.readValue(row.getString(1), PersonalMatch::class.java) }, jobId, identity.issuer, identity.subject).singleOrNull()
 @Transactional
 override fun save(identity: VerifiedIdentity, jobId: UUID, result: PersonalMatch): PersonalMatch {
  val owner = jdbc.query("SELECT u.id FROM app_user u JOIN career_profile p ON p.owner_id = u.id WHERE u.oidc_issuer = ? AND u.oidc_subject = ? FOR UPDATE OF u", { row, _ -> row.getObject(1, UUID::class.java) }, identity.issuer, identity.subject).singleOrNull() ?: throw SavedJobFailure("PROFILE_NOT_CREATED", 404)
  if (jdbc.queryForObject("SELECT COUNT(*) FROM saved_job WHERE owner_id = ? AND id = ?", Long::class.java, owner, jobId) != 1L) throw SavedJobFailure("SAVED_JOB_NOT_FOUND", 404)
  val current = jdbc.query("SELECT id, revision FROM competency_claim WHERE owner_id = ? AND status = 'CONFIRMED'", { row, _ -> row.getObject(1, UUID::class.java) to row.getLong(2) }, owner).toMap()
  if ((result.automaticEvidence && current.keys != result.claims.map { it.id }.toSet()) || result.claims.any { current[it.id] != it.revision }) throw SavedJobFailure("MATCH_CONFLICT", 409)
  jdbc.update("INSERT INTO job_match_analysis(job_id, owner_id, result) VALUES (?, ?, ?::jsonb) ON CONFLICT(job_id) DO UPDATE SET result = EXCLUDED.result", jobId, owner, mapper.writeValueAsString(result))
  return result
 }
}
