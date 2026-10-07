package com.careeragent.profile.api

import com.careeragent.profile.application.*
import com.careeragent.profile.domain.*
import org.springframework.beans.factory.ObjectProvider
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/profile/me/claims")
class ClaimsController(private val services: ObjectProvider<ClaimService>) {
    private fun identity(principal: OidcUser?): VerifiedIdentity {
        val token = principal?.idToken ?: throw ClaimFailure("AUTH_REQUIRED", 401)
        return VerifiedIdentity(token.issuer.toString(), token.subject)
    }
    private fun service() = services.ifAvailable ?: throw ClaimFailure("PROFILE_DISABLED", 503)
    private fun id(value: String): UUID = try {
        UUID.fromString(value).also { if (it.toString() != value.lowercase()) throw IllegalArgumentException() }
    } catch (_: IllegalArgumentException) { throw ClaimFailure("CLAIM_INVALID", 400) }
    private fun keys(input: Map<String, Any?>, expected: Set<String>) { if (input.keys != expected) throw ClaimFailure("CLAIM_INVALID", 400) }
    private fun revision(input: Map<String, Any?>): Long {
        val value = input["revision"]
        if (value !is Int && value !is Long) throw ClaimFailure("CLAIM_INVALID", 400)
        return (value as Number).toLong()
    }
    private fun content(input: Map<String, Any?>): ClaimContent {
        fun text(key: String) = input[key] as? String ?: throw ClaimFailure("CLAIM_INVALID", 400)
        return ClaimContent(text("skill"), text("statement"), text("context"), text("sourceNote"))
    }
    private fun <T> response(value: T) = ResponseEntity.ok().header("Cache-Control", "no-store").body(value)
    @GetMapping fun list(@AuthenticationPrincipal principal: OidcUser?) = response(service().list(identity(principal)))
    @PostMapping(consumes = ["application/json"])
    fun create(@AuthenticationPrincipal principal: OidcUser?, @RequestBody input: Map<String, Any?>): ResponseEntity<CompetencyClaim> {
        keys(input, setOf("skill", "statement", "context", "sourceNote"))
        return response(service().create(identity(principal), content(input)))
    }
    @PutMapping("/{claimId}", consumes = ["application/json"])
    fun edit(@AuthenticationPrincipal principal: OidcUser?, @PathVariable claimId: String, @RequestBody input: Map<String, Any?>): ResponseEntity<CompetencyClaim> {
        keys(input, setOf("skill", "statement", "context", "sourceNote", "revision"))
        return response(service().edit(identity(principal), id(claimId), content(input), revision(input)))
    }
    @PostMapping("/{claimId}/review", consumes = ["application/json"])
    fun review(@AuthenticationPrincipal principal: OidcUser?, @PathVariable claimId: String, @RequestBody input: Map<String, Any?>): ResponseEntity<CompetencyClaim> {
        keys(input, setOf("revision", "decision"))
        val decision = try { ReviewDecision.valueOf(input["decision"] as? String ?: "") } catch (_: IllegalArgumentException) { throw ClaimFailure("CLAIM_INVALID", 400) }
        return response(service().review(identity(principal), id(claimId), decision, revision(input)))
    }
    @GetMapping("/{claimId}/history")
    fun history(@AuthenticationPrincipal principal: OidcUser?, @PathVariable claimId: String) = response(service().history(identity(principal), id(claimId)))
    @DeleteMapping("/{claimId}", consumes = ["application/json"])
    fun delete(@AuthenticationPrincipal principal: OidcUser?, @PathVariable claimId: String, @RequestBody input: Map<String, Any?>): ResponseEntity<Void> {
        keys(input, setOf("revision"))
        service().delete(identity(principal), id(claimId), revision(input))
        return ResponseEntity.noContent().header("Cache-Control", "no-store").build()
    }
    @ExceptionHandler(ClaimFailure::class)
    fun rejected(error: ClaimFailure) = ResponseEntity.status(error.status).header("Cache-Control", "no-store").body(mapOf("code" to error.code))
    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun malformed() = ResponseEntity.badRequest().header("Cache-Control", "no-store").body(mapOf("code" to "CLAIM_INVALID"))
}
