package com.careeragent.profile.api

import com.careeragent.profile.application.ProfileService
import com.careeragent.profile.application.ProfileFailure
import com.careeragent.profile.application.VerifiedIdentity
import org.springframework.beans.factory.ObjectProvider
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/profile/me")
class ProfileController(private val profiles: ObjectProvider<ProfileService>) {
    private fun identity(principal: OidcUser?): VerifiedIdentity {
        val token = principal?.idToken ?: throw ProfileFailure("AUTH_REQUIRED", 401)
        return VerifiedIdentity(token.issuer.toString(), token.subject)
    }
    @GetMapping
    fun read(@AuthenticationPrincipal principal: OidcUser?): ResponseEntity<Any> {
        val caller = identity(principal)
        val service = profiles.ifAvailable ?: throw ProfileFailure("PROFILE_DISABLED", 503)
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(service.read(caller) ?: throw ProfileFailure("PROFILE_NOT_CREATED", 404))
    }
    @PutMapping(consumes = ["application/json"])
    fun save(@AuthenticationPrincipal principal: OidcUser?, @RequestBody input: Map<String, Any?>): ResponseEntity<Any> {
        val caller = identity(principal)
        if (input.keys != setOf("displayName", "preferredLanguage", "revision")) throw ProfileFailure("PROFILE_INVALID", 400)
        val name = input["displayName"] as? String ?: throw ProfileFailure("PROFILE_INVALID", 400)
        val language = input["preferredLanguage"] as? String ?: throw ProfileFailure("PROFILE_INVALID", 400)
        val revision = input["revision"]
        if (revision !is Int && revision !is Long) throw ProfileFailure("PROFILE_INVALID", 400)
        val service = profiles.ifAvailable ?: throw ProfileFailure("PROFILE_DISABLED", 503)
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(service.save(caller, name, language, (revision as Number).toLong()))
    }
    @ExceptionHandler(ProfileFailure::class)
    fun rejected(error: ProfileFailure): ResponseEntity<Map<String, String>> = ResponseEntity.status(error.status).header("Cache-Control", "no-store").body(mapOf("code" to error.code))
    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun malformed(): ResponseEntity<Map<String, String>> = ResponseEntity.badRequest().header("Cache-Control", "no-store").body(mapOf("code" to "PROFILE_INVALID"))
}
