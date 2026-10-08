package com.careeragent.applications.application

import com.careeragent.applications.domain.*
import com.careeragent.profile.application.VerifiedIdentity
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.util.UUID
class ApplicationFailure(val code:String,val status:Int):RuntimeException(code)
interface ApplicationRepository {
 fun list(identity:VerifiedIdentity):List<ApplicationCase>
 fun create(identity:VerifiedIdentity,jobId:UUID):ApplicationCase
 fun update(identity:VerifiedIdentity,id:UUID,revision:Long,content:ApplicationContent):ApplicationCase
 fun delete(identity:VerifiedIdentity,id:UUID,revision:Long)
}
@Service
@Profile("persistence")
class ApplicationService(private val cases:ApplicationRepository) {
 fun list(identity:VerifiedIdentity)=cases.list(identity)
 fun create(identity:VerifiedIdentity,jobId:UUID)=cases.create(identity,jobId)
 fun update(identity:VerifiedIdentity,id:UUID,revision:Long,content:ApplicationContent):ApplicationCase {
  fun valid(value:String,max:Int)=value.length<=max&&value.none {it.isISOControl()&&it !in "\n\r\t"}
  if(revision<1||!valid(content.contactName,200)||!valid(content.contactEmail,200)||!valid(content.contactPhone,100)||!valid(content.notes,5000)||!valid(content.applicationText,5000)||content.appliedOn?.let {it.isAfter(LocalDate.now())||it.year<1900}==true||content.nextFollowUpOn?.let {it.year !in 1900..2200}==true)throw ApplicationFailure("APPLICATION_INVALID",400)
  if(content.status in setOf(ApplicationStatus.APPLIED,ApplicationStatus.INTERVIEW_1,ApplicationStatus.INTERVIEW_2,ApplicationStatus.CASE,ApplicationStatus.OFFER) && (content.cvVersionId==null||content.appliedOn==null))throw ApplicationFailure("APPLICATION_MATERIALS_REQUIRED",400)
  if(content.appliedOn!=null&&content.status in setOf(ApplicationStatus.CONSIDERING,ApplicationStatus.PREPARING,ApplicationStatus.READY_TO_APPLY))throw ApplicationFailure("APPLICATION_INVALID",400)
  if(content.appliedOn!=null&&content.cvVersionId==null)throw ApplicationFailure("APPLICATION_MATERIALS_REQUIRED",400)
  return cases.update(identity,id,revision,content)
 }
 fun delete(identity:VerifiedIdentity,id:UUID,revision:Long){if(revision<1)throw ApplicationFailure("APPLICATION_INVALID",400);cases.delete(identity,id,revision)}
}
