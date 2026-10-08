package com.careeragent.applications.infrastructure

import com.careeragent.applications.application.*
import com.careeragent.applications.domain.*
import com.careeragent.profile.application.VerifiedIdentity
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.context.annotation.Profile
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.util.UUID

@Repository
@Profile("persistence")
class JdbcApplicationRepository(private val jdbc:JdbcTemplate,private val json:ObjectMapper):ApplicationRepository {
 private fun owner(identity:VerifiedIdentity,lock:Boolean=false)=jdbc.query("SELECT u.id FROM app_user u JOIN career_profile p ON p.owner_id=u.id WHERE u.oidc_issuer=? AND u.oidc_subject=?"+if(lock)" FOR UPDATE OF u" else "",{r,_->r.getObject(1,UUID::class.java)},identity.issuer,identity.subject).singleOrNull()?:throw ApplicationFailure("PROFILE_NOT_CREATED",404)
 private val map=org.springframework.jdbc.core.RowMapper {r,_->ApplicationCase(r.getObject("id",UUID::class.java),r.getObject("job_id",UUID::class.java),r.getString("job_title"),json.readValue(r.getString("content"),ApplicationContent::class.java),r.getLong("revision"),r.getObject("created_at",OffsetDateTime::class.java),r.getObject("updated_at",OffsetDateTime::class.java),json.readValue(r.getString("history"),Array<ApplicationHistory>::class.java).toList())}
 private fun read(owner:UUID,id:UUID)=jdbc.query("SELECT * FROM application_case WHERE owner_id=? AND id=?",map,owner,id).singleOrNull()?:throw ApplicationFailure("APPLICATION_NOT_FOUND",404)
 @Transactional(readOnly=true)override fun list(identity:VerifiedIdentity)=jdbc.query("SELECT * FROM application_case WHERE owner_id=? ORDER BY updated_at DESC LIMIT 100",map,owner(identity))
 @Transactional override fun create(identity:VerifiedIdentity,jobId:UUID):ApplicationCase {
  val owner=owner(identity,true)
  val snapshot=jdbc.query("SELECT snapshot FROM saved_job WHERE owner_id=? AND id=?",{r,_->r.getString(1)},owner,jobId).singleOrNull()?:throw ApplicationFailure("APPLICATION_SOURCE_CONFLICT",409)
  val existing=jdbc.query("SELECT id FROM application_case WHERE owner_id=? AND job_id=?",{r,_->r.getObject(1,UUID::class.java)},owner,jobId).singleOrNull();if(existing!=null)return read(owner,existing)
  if(jdbc.queryForObject("SELECT COUNT(*) FROM application_case WHERE owner_id=?",Long::class.java,owner)!!>=100)throw ApplicationFailure("APPLICATION_LIMIT",409)
  val id=UUID.randomUUID();val content=ApplicationContent(ApplicationStatus.CONSIDERING,null,null,null,"","","","","");val history=listOf(ApplicationHistory(content.status,OffsetDateTime.now(),null,null))
  jdbc.update("INSERT INTO application_case(id,owner_id,job_id,job_title,content,history,revision) VALUES(?,?,?,?,?::jsonb,?::jsonb,1)",id,owner,jobId,json.readTree(snapshot)["title"].asText(),json.writeValueAsString(content),json.writeValueAsString(history));return read(owner,id)
 }
 @Transactional override fun update(identity:VerifiedIdentity,id:UUID,revision:Long,content:ApplicationContent):ApplicationCase {
  val owner=owner(identity,true);val previous=read(owner,id)
  if(previous.revision!=revision)throw ApplicationFailure("APPLICATION_CONFLICT",409)
  if(previous.content.appliedOn!=null&&(previous.content.appliedOn!=content.appliedOn||previous.content.cvVersionId!=content.cvVersionId||previous.content.applicationText!=content.applicationText))throw ApplicationFailure("APPLICATION_MATERIALS_LOCKED",409)
  if(content.cvVersionId!=null){val row=jdbc.query("SELECT status,job_id FROM cv_version WHERE owner_id=? AND id=?",{r,_->r.getString(1) to r.getObject(2,UUID::class.java)},owner,content.cvVersionId).singleOrNull();if(row==null||row.first!="APPROVED"||row.second!=null&&row.second!=previous.jobId)throw ApplicationFailure("APPLICATION_SOURCE_CONFLICT",409)}
  val history=if(previous.content.status!=content.status)previous.history+ApplicationHistory(content.status,OffsetDateTime.now(),content.cvVersionId,content.appliedOn) else previous.history
  if(history.size>100)throw ApplicationFailure("APPLICATION_HISTORY_LIMIT",409)
  jdbc.update("UPDATE application_case SET content=?::jsonb,cv_version_id=?,history=?::jsonb,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE owner_id=? AND id=?",json.writeValueAsString(content),content.cvVersionId,json.writeValueAsString(history),owner,id)
  return read(owner,id)
 }
 @Transactional override fun delete(identity:VerifiedIdentity,id:UUID,revision:Long){val owner=owner(identity,true);if(read(owner,id).revision!=revision)throw ApplicationFailure("APPLICATION_CONFLICT",409);jdbc.update("DELETE FROM application_case WHERE owner_id=? AND id=?",owner,id)}
}
