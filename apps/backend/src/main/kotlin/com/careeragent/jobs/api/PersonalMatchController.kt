package com.careeragent.jobs.api

import com.careeragent.ai.application.AiFailure
import com.careeragent.jobs.application.*
import com.careeragent.jobs.domain.MatchRequest
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
@RequestMapping("/api/profile/me/jobs/{jobId}/match")
class PersonalMatchController(private val services: ObjectProvider<PersonalMatchService>, private val mapper: ObjectMapper) {
 private fun service() = services.ifAvailable ?: throw SavedJobFailure("PROFILE_DISABLED", 503)
 private fun identity(principal: OidcUser?): VerifiedIdentity { val token = principal?.idToken ?: throw SavedJobFailure("AUTH_REQUIRED", 401); return VerifiedIdentity(token.issuer.toString(), token.subject) }
 private fun id(value: String) = try { UUID.fromString(value).also { require(it.toString() == value.lowercase()) } } catch (_: Exception) { throw SavedJobFailure("MATCH_INPUT_INVALID", 400) }
 @GetMapping fun load(@AuthenticationPrincipal principal: OidcUser?, @PathVariable jobId: String) = ResponseEntity.ok().header("Cache-Control", "no-store").body(mapOf("analysis" to service().load(identity(principal), id(jobId))))
 @PostMapping(consumes = ["application/json"]) fun analyze(@AuthenticationPrincipal principal: OidcUser?, @PathVariable jobId: String, @RequestBody input: Map<String, Any?>): ResponseEntity<*> {
  if (input.filterKeys { it!="aiApproval" }.keys != setOf("text", "claims", "locale", "consent")) throw SavedJobFailure("MATCH_INPUT_INVALID", 400)
  if(input.containsKey("aiApproval") && input["aiApproval"] !is String)throw SavedJobFailure("MATCH_INPUT_INVALID",400)
  val selections = input["claims"] as? List<*> ?: throw SavedJobFailure("MATCH_INPUT_INVALID", 400)
  if (selections.any { it !is Map<*, *> || it.keys != setOf("id", "revision") }) throw SavedJobFailure("MATCH_INPUT_INVALID", 400)
  val request = try { mapper.convertValue(input, MatchRequest::class.java) } catch (_: Exception) { throw SavedJobFailure("MATCH_INPUT_INVALID", 400) }
  return ResponseEntity.ok().header("Cache-Control", "no-store").body(service().analyze(identity(principal), id(jobId), request))
 }
 @ExceptionHandler(SavedJobFailure::class) fun rejected(error: SavedJobFailure) = ResponseEntity.status(error.status).header("Cache-Control", "no-store").body(mapOf("code" to error.code))
 @ExceptionHandler(AiFailure::class) fun failed(error: AiFailure): ResponseEntity<*> { val response = ResponseEntity.status(error.httpStatus).header("Cache-Control", "no-store"); error.retryAfterSeconds?.let { response.header("Retry-After", it.toString()) }; return response.body(mapOf("code" to error.code)) }
 @ExceptionHandler(HttpMessageNotReadableException::class) fun malformed() = ResponseEntity.badRequest().header("Cache-Control", "no-store").body(mapOf("code" to "MATCH_INPUT_INVALID"))
}
