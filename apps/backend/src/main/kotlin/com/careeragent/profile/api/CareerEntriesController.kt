package com.careeragent.profile.api

import com.careeragent.profile.application.*
import com.careeragent.profile.domain.*
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.ObjectProvider
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/profile/me/entries")
class CareerEntriesController(private val services: ObjectProvider<CareerEntryService>,private val json: ObjectMapper) {
 private fun service()=services.ifAvailable ?: throw EntryFailure("PROFILE_DISABLED",503)
 private fun identity(principal: OidcUser?): VerifiedIdentity {val token=principal?.idToken ?: throw EntryFailure("AUTH_REQUIRED",401);return VerifiedIdentity(token.issuer.toString(),token.subject)}
 private fun id(value: String)=try {UUID.fromString(value).also {require(it.toString()==value.lowercase())}} catch(_:Exception){throw EntryFailure("ENTRY_INVALID",400)}
 private fun keys(input: Map<String,Any?>,expected: Set<String>){if(input.keys!=expected) throw EntryFailure("ENTRY_INVALID",400)}
 private fun revision(input: Map<String,Any?>): Long {val v=input["revision"];if(v !is Int && v !is Long) throw EntryFailure("ENTRY_INVALID",400);return (v as Number).toLong()}
 private fun content(value: Any?): CareerEntryContent {if(value !is Map<*,*> || value.keys!=setOf("kind","title","organization","client","deliveryRole","startMonth","endMonth","ongoing","description","sourceNote")) throw EntryFailure("ENTRY_INVALID",400);return try {json.convertValue(value,CareerEntryContent::class.java)} catch(_:Exception){throw EntryFailure("ENTRY_INVALID",400)}}
 private fun <T> response(value: T)=ResponseEntity.ok().header("Cache-Control","no-store").body(value)
 @GetMapping fun list(@AuthenticationPrincipal principal: OidcUser?)=response(service().list(identity(principal)))
 @PostMapping(consumes=["application/json"]) fun create(@AuthenticationPrincipal principal: OidcUser?,@RequestBody input: Map<String,Any?>): ResponseEntity<CareerEntry> {keys(input,setOf("content"));return response(service().create(identity(principal),content(input["content"])))}
 @PutMapping("/{entryId}",consumes=["application/json"]) fun edit(@AuthenticationPrincipal principal: OidcUser?,@PathVariable entryId: String,@RequestBody input: Map<String,Any?>): ResponseEntity<CareerEntry> {keys(input,setOf("content","revision"));return response(service().edit(identity(principal),id(entryId),content(input["content"]),revision(input)))}
 @PostMapping("/{entryId}/review",consumes=["application/json"]) fun review(@AuthenticationPrincipal principal: OidcUser?,@PathVariable entryId: String,@RequestBody input: Map<String,Any?>): ResponseEntity<CareerEntry> {keys(input,setOf("decision","revision"));val decision=try {ReviewDecision.valueOf(input["decision"] as? String ?: "")} catch(_:Exception){throw EntryFailure("ENTRY_INVALID",400)};return response(service().review(identity(principal),id(entryId),revision(input),decision))}
 @GetMapping("/{entryId}/evidence") fun evidence(@AuthenticationPrincipal principal:OidcUser?,@PathVariable entryId:String)=response(service().evidence(identity(principal),id(entryId)))
 @GetMapping("/{entryId}/history") fun history(@AuthenticationPrincipal principal: OidcUser?,@PathVariable entryId: String)=response(service().history(identity(principal),id(entryId)))
 @DeleteMapping("/{entryId}",consumes=["application/json"]) fun delete(@AuthenticationPrincipal principal: OidcUser?,@PathVariable entryId: String,@RequestBody input: Map<String,Any?>): ResponseEntity<Void> {keys(input,setOf("revision"));service().delete(identity(principal),id(entryId),revision(input));return ResponseEntity.noContent().header("Cache-Control","no-store").build()}
 @ExceptionHandler(EntryFailure::class) fun rejected(error: EntryFailure)=ResponseEntity.status(error.status).header("Cache-Control","no-store").body(mapOf("code" to error.code))
 @ExceptionHandler(HttpMessageNotReadableException::class) fun malformed()=ResponseEntity.badRequest().header("Cache-Control","no-store").body(mapOf("code" to "ENTRY_INVALID"))
}
