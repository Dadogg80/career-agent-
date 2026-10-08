package com.careeragent.profile.infrastructure

import com.careeragent.profile.application.*
import com.careeragent.profile.domain.*
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.context.annotation.Profile
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.util.UUID

@Repository
@Profile("persistence")
class JdbcCareerEntryRepository(private val jdbc: JdbcTemplate,private val json: ObjectMapper) : CareerEntryRepository {
 private fun owner(identity: VerifiedIdentity, lock: Boolean = false) = jdbc.query("SELECT u.id FROM app_user u JOIN career_profile p ON p.owner_id = u.id WHERE u.oidc_issuer = ? AND u.oidc_subject = ?" + if(lock) " FOR UPDATE OF u" else "", {row,_ -> row.getObject(1,UUID::class.java)},identity.issuer,identity.subject).singleOrNull() ?: throw EntryFailure("PROFILE_NOT_CREATED",404)
 private val mapper = org.springframework.jdbc.core.RowMapper { row,_ -> CareerEntry(row.getObject("id",UUID::class.java),json.readValue(row.getString("content"),CareerEntryContent::class.java),ClaimStatus.valueOf(row.getString("status")),row.getLong("revision"),row.getObject("created_at",OffsetDateTime::class.java),row.getObject("updated_at",OffsetDateTime::class.java)) }
 private fun current(owner: UUID,id: UUID) = jdbc.query("SELECT * FROM career_entry WHERE owner_id = ? AND id = ?",mapper,owner,id).singleOrNull() ?: throw EntryFailure("ENTRY_NOT_FOUND",404)
 private fun expected(entry: CareerEntry,revision: Long) { if(entry.revision != revision) throw EntryFailure("ENTRY_CONFLICT",409) }
 private fun record(owner: UUID,entry: CareerEntry) { jdbc.update("INSERT INTO career_entry_revision(entry_id,owner_id,revision,snapshot) VALUES(?,?,?,?::jsonb)",entry.id,owner,entry.revision,json.writeValueAsString(entry)) }
 @Transactional(readOnly=true) override fun evidence(identity:VerifiedIdentity,id:UUID):List<CareerEntryEvidence> {
  val owner=owner(identity);current(owner,id)
  return jdbc.query("SELECT revision,document_id,original_name,quote,period_text FROM career_entry_evidence WHERE owner_id=? AND entry_id=? ORDER BY revision DESC,id LIMIT 100",{r,_->CareerEntryEvidence(r.getLong("revision"),r.getObject("document_id",UUID::class.java),r.getString("original_name"),r.getString("quote"),r.getString("period_text"))},owner,id)
 }
 @Transactional(readOnly=true) override fun list(identity: VerifiedIdentity) = jdbc.query("SELECT * FROM career_entry WHERE owner_id = ? ORDER BY created_at DESC,id LIMIT 50",mapper,owner(identity))
 @Transactional override fun create(identity: VerifiedIdentity,content: CareerEntryContent): CareerEntry {
  val owner=owner(identity,true)
  if(jdbc.queryForObject("SELECT COUNT(*) FROM career_entry WHERE owner_id = ?",Long::class.java,owner)!! >= 50) throw EntryFailure("ENTRY_LIMIT",409)
  val id=UUID.randomUUID();jdbc.update("INSERT INTO career_entry(id,owner_id,content,status,revision) VALUES(?,?,?::jsonb,'UNVERIFIED',1)",id,owner,json.writeValueAsString(content))
  return current(owner,id).also {record(owner,it)}
 }
 @Transactional override fun edit(identity: VerifiedIdentity,id: UUID,content: CareerEntryContent,revision: Long): CareerEntry {
  val owner=owner(identity,true);expected(current(owner,id),revision)
  jdbc.update("UPDATE career_entry SET content=?::jsonb,status='UNVERIFIED',revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE owner_id=? AND id=?",json.writeValueAsString(content),owner,id)
  return current(owner,id).also {record(owner,it)}
 }
 @Transactional override fun review(identity: VerifiedIdentity,id: UUID,revision: Long,decision: ReviewDecision): CareerEntry {
  val owner=owner(identity,true);val entry=current(owner,id);expected(entry,revision)
  val status=if(decision==ReviewDecision.CONFIRM) ClaimStatus.CONFIRMED else ClaimStatus.REJECTED
  if(entry.status==status) throw EntryFailure("ENTRY_INVALID",400)
  jdbc.update("UPDATE career_entry SET status=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE owner_id=? AND id=?",status.name,owner,id)
  return current(owner,id).also {record(owner,it)}
 }
 @Transactional(readOnly=true) override fun history(identity: VerifiedIdentity,id: UUID): List<CareerEntry> { val owner=owner(identity);current(owner,id);return jdbc.query("SELECT snapshot FROM career_entry_revision WHERE owner_id=? AND entry_id=? ORDER BY revision DESC LIMIT 20",{row,_ -> json.readValue(row.getString(1),CareerEntry::class.java)},owner,id) }
 @Transactional override fun delete(identity: VerifiedIdentity,id: UUID,revision: Long) {val owner=owner(identity,true);expected(current(owner,id),revision);jdbc.update("DELETE FROM career_entry WHERE owner_id=? AND id=?",owner,id)}
}
