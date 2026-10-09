package com.careeragent.profile.api

import com.careeragent.profile.application.ProfileService
import com.careeragent.profile.application.ProfileFailure
import com.careeragent.profile.application.VerifiedIdentity
import org.springframework.beans.factory.ObjectProvider
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MaxUploadSizeExceededException
import org.springframework.web.multipart.MultipartFile

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
    @GetMapping("/avatar")
    fun avatar(@AuthenticationPrincipal principal: OidcUser?): ResponseEntity<ByteArray> {
        val image = (profiles.ifAvailable ?: throw ProfileFailure("PROFILE_DISABLED", 503))
            .avatar(identity(principal)) ?: throw ProfileFailure("PROFILE_AVATAR_NOT_FOUND", 404)
        return ResponseEntity.ok().header("Cache-Control", "no-store").header("X-Content-Type-Options", "nosniff")
            .contentType(MediaType.parseMediaType(image.mediaType)).body(image.bytes)
    }
    @PutMapping("/avatar", consumes = ["multipart/form-data"])
    fun saveAvatar(@AuthenticationPrincipal principal: OidcUser?, @RequestParam("file") file: MultipartFile): ResponseEntity<Any> {
        (profiles.ifAvailable ?: throw ProfileFailure("PROFILE_DISABLED", 503))
            .saveAvatar(identity(principal), file.bytes, file.contentType)
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(mapOf("updated" to true))
    }
    @DeleteMapping("/avatar")
    fun deleteAvatar(@AuthenticationPrincipal principal: OidcUser?): ResponseEntity<Void> {
        (profiles.ifAvailable ?: throw ProfileFailure("PROFILE_DISABLED", 503)).deleteAvatar(identity(principal))
        return ResponseEntity.noContent().header("Cache-Control", "no-store").build()
    }
    @ExceptionHandler(ProfileFailure::class)
    fun rejected(error: ProfileFailure): ResponseEntity<Map<String, String>> = ResponseEntity.status(error.status).header("Cache-Control", "no-store").body(mapOf("code" to error.code))
    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun malformed(): ResponseEntity<Map<String, String>> = ResponseEntity.badRequest().header("Cache-Control", "no-store").body(mapOf("code" to "PROFILE_INVALID"))
    @ExceptionHandler(MaxUploadSizeExceededException::class)
    fun tooLarge(): ResponseEntity<Map<String, String>> = ResponseEntity.status(413).header("Cache-Control", "no-store").body(mapOf("code" to "PROFILE_AVATAR_TOO_LARGE"))
}
