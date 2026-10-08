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
@RequestMapping("/api/profile/me/claims/{claimId}/contexts")
class ClaimContextsController(private val services: ObjectProvider<ClaimContextService>) {
    private fun service() = services.ifAvailable ?: throw ContextFailure("PROFILE_DISABLED",503)
    private fun identity(principal: OidcUser?): VerifiedIdentity {
        val token=principal?.idToken ?: throw ContextFailure("AUTH_REQUIRED",401)
        return VerifiedIdentity(token.issuer.toString(),token.subject)
    }
    private fun id(value: String): UUID = try { UUID.fromString(value).also { require(it.toString()==value.lowercase()) } }
        catch(_:IllegalArgumentException) { throw ContextFailure("CONTEXT_INVALID",400) }
    private fun <T> response(value: T)=ResponseEntity.ok().header("Cache-Control","no-store").body(value)
    @GetMapping fun overview(@AuthenticationPrincipal principal: OidcUser?, @PathVariable claimId: String) =
        response(service().overview(identity(principal),id(claimId)))
    @PostMapping(consumes=["application/json"])
    fun decide(@AuthenticationPrincipal principal: OidcUser?, @PathVariable claimId: String, @RequestBody input: Map<String,Any?>): ResponseEntity<ClaimContextOverview> {
        if(input.keys!=setOf("entryId","claimRevision","entryRevision","version","decision")) throw ContextFailure("CONTEXT_INVALID",400)
        fun number(key: String): Long { val v=input[key];if(v !is Int && v !is Long) throw ContextFailure("CONTEXT_INVALID",400);return (v as Number).toLong() }
        val decision=try { ContextDecision.valueOf(input["decision"] as? String ?: "") } catch(_:IllegalArgumentException) { throw ContextFailure("CONTEXT_INVALID",400) }
        return response(service().decide(identity(principal),id(claimId),ContextCommand(id(input["entryId"] as? String ?: ""),number("claimRevision"),number("entryRevision"),number("version"),decision)))
    }
    @ExceptionHandler(ContextFailure::class) fun failure(error: ContextFailure)=ResponseEntity.status(error.status).header("Cache-Control","no-store").body(mapOf("code" to error.code))
    @ExceptionHandler(HttpMessageNotReadableException::class) fun malformed()=ResponseEntity.badRequest().header("Cache-Control","no-store").body(mapOf("code" to "CONTEXT_INVALID"))
}
