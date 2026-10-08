package com.careeragent.applications.domain

import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.UUID

enum class ApplicationStatus { CONSIDERING, PREPARING, READY_TO_APPLY, APPLIED, INTERVIEW_1, INTERVIEW_2, CASE, OFFER, REJECTED, WITHDRAWN }
data class ApplicationContent(val status:ApplicationStatus,val cvVersionId:UUID?,val appliedOn:LocalDate?,val nextFollowUpOn:LocalDate?,val contactName:String,val contactEmail:String,val contactPhone:String,val notes:String,val applicationText:String)
data class ApplicationHistory(val status:ApplicationStatus,val recordedAt:OffsetDateTime,val cvVersionId:UUID?,val appliedOn:LocalDate?)
data class ApplicationCase(val id:UUID,val jobId:UUID,val jobTitle:String,val content:ApplicationContent,val revision:Long,val createdAt:OffsetDateTime,val updatedAt:OffsetDateTime,val history:List<ApplicationHistory>)
