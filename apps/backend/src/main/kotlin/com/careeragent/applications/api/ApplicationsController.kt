package com.careeragent.applications.api

import com.careeragent.applications.application.*
import com.careeragent.applications.domain.ApplicationContent
import com.careeragent.profile.application.VerifiedIdentity
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.ObjectProvider
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/profile/me/applications")
class ApplicationsController(private val services:ObjectProvider<ApplicationService>,private val json:ObjectMapper) {
 private fun service()=services.ifAvailable?:throw ApplicationFailure("PROFILE_DISABLED",503)
 private fun identity(user:OidcUser?)=user?.idToken?.let{VerifiedIdentity(it.issuer.toString(),it.subject)}?:throw ApplicationFailure("AUTH_REQUIRED",401)
 private fun id(value:String)=try{UUID.fromString(value).also{require(it.toString()==value.lowercase())}}catch(_:Exception){throw ApplicationFailure("APPLICATION_INVALID",400)}
 private fun revision(input:Map<String,Any?>):Long{val n=input["revision"];if(n !is Int&&n !is Long)throw ApplicationFailure("APPLICATION_INVALID",400);return(n as Number).toLong()}
 private fun <T> response(value:T)=ResponseEntity.ok().header("Cache-Control","no-store").body(value)
 @GetMapping fun list(@AuthenticationPrincipal user:OidcUser?)=response(service().list(identity(user)))
 @PostMapping(consumes=["application/json"])fun create(@AuthenticationPrincipal user:OidcUser?,@RequestBody input:Map<String,Any?>):ResponseEntity<*> {if(input.keys!=setOf("jobId")||input["jobId"] !is String)throw ApplicationFailure("APPLICATION_INVALID",400);return response(service().create(identity(user),id(input["jobId"] as String)))}
 @PutMapping("/{caseId}",consumes=["application/json"])fun update(@AuthenticationPrincipal user:OidcUser?,@PathVariable caseId:String,@RequestBody input:Map<String,Any?>):ResponseEntity<*> {
  val c=input["content"] as? Map<*,*>?:throw ApplicationFailure("APPLICATION_INVALID",400)
  if(input.keys!=setOf("content","revision")||c.keys!=setOf("status","cvVersionId","appliedOn","nextFollowUpOn","contactName","contactEmail","contactPhone","notes","applicationText"))throw ApplicationFailure("APPLICATION_INVALID",400)
  val content=try{json.convertValue(c,ApplicationContent::class.java)}catch(_:Exception){throw ApplicationFailure("APPLICATION_INVALID",400)}
  return response(service().update(identity(user),id(caseId),revision(input),content))
 }
 @DeleteMapping("/{caseId}",consumes=["application/json"])fun delete(@AuthenticationPrincipal user:OidcUser?,@PathVariable caseId:String,@RequestBody input:Map<String,Any?>):ResponseEntity<Void>{if(input.keys!=setOf("revision"))throw ApplicationFailure("APPLICATION_INVALID",400);service().delete(identity(user),id(caseId),revision(input));return ResponseEntity.noContent().header("Cache-Control","no-store").build()}
 @ExceptionHandler(ApplicationFailure::class)fun error(e:ApplicationFailure)=ResponseEntity.status(e.status).header("Cache-Control","no-store").body(mapOf("code" to e.code))
 @ExceptionHandler(HttpMessageNotReadableException::class)fun malformed()=error(ApplicationFailure("APPLICATION_INVALID",400))
}
