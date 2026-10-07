package com.careeragent.jobs.api

import com.careeragent.jobs.application.*
import com.careeragent.jobs.domain.*
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
@RequestMapping("/api/profile/me/jobs")
class SavedJobsController(private val services: ObjectProvider<SavedJobService>, private val mapper: ObjectMapper) {
    private fun service() = services.ifAvailable ?: throw SavedJobFailure("PROFILE_DISABLED", 503)
    private fun identity(principal: OidcUser?): VerifiedIdentity {
        val token = principal?.idToken ?: throw SavedJobFailure("AUTH_REQUIRED", 401)
        return VerifiedIdentity(token.issuer.toString(), token.subject)
    }
    private fun id(value: String): UUID = try { UUID.fromString(value).also { require(it.toString() == value.lowercase()) } } catch (_: Exception) { throw SavedJobFailure("SAVED_JOB_INVALID", 400) }
    private fun <T> response(value: T) = ResponseEntity.ok().header("Cache-Control", "no-store").body(value)
    @GetMapping fun list(@AuthenticationPrincipal principal: OidcUser?) = response(service().list(identity(principal)))
    @GetMapping("/{jobId}") fun get(@AuthenticationPrincipal principal: OidcUser?, @PathVariable jobId: String) = response(service().get(identity(principal), id(jobId)))
    @PostMapping(consumes = ["application/json"])
    fun save(@AuthenticationPrincipal principal: OidcUser?, @RequestBody input: Map<String, Any?>): ResponseEntity<SavedJob> {
        if (input.keys != setOf("title", "sourceUrl", "sourceType", "text", "locale", "requirements", "facts", "omittedItems", "retrievedAt")) throw SavedJobFailure("SAVED_JOB_INVALID", 400)
        val content = try { mapper.convertValue(input, SavedJobContent::class.java) } catch (_: Exception) { throw SavedJobFailure("SAVED_JOB_INVALID", 400) }
        return response(service().save(identity(principal), content))
    }
    @DeleteMapping("/{jobId}") fun delete(@AuthenticationPrincipal principal: OidcUser?, @PathVariable jobId: String): ResponseEntity<Void> {
        service().delete(identity(principal), id(jobId))
        return ResponseEntity.noContent().header("Cache-Control", "no-store").build()
    }
    @ExceptionHandler(SavedJobFailure::class) fun rejected(error: SavedJobFailure) = ResponseEntity.status(error.status).header("Cache-Control", "no-store").body(mapOf("code" to error.code))
    @ExceptionHandler(HttpMessageNotReadableException::class) fun malformed() = ResponseEntity.badRequest().header("Cache-Control", "no-store").body(mapOf("code" to "SAVED_JOB_INVALID"))
}
