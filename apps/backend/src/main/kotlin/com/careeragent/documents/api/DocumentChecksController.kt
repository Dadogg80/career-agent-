package com.careeragent.documents.api

import com.careeragent.documents.application.*
import com.careeragent.profile.application.VerifiedIdentity
import org.springframework.beans.factory.ObjectProvider
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/profile/me/documents/check")
class DocumentChecksController(private val services: ObjectProvider<DocumentCheckService>) {
    @PostMapping(consumes = ["application/json"]) fun check(@AuthenticationPrincipal user: OidcUser?, @RequestBody input: Map<String, Any?>): ResponseEntity<*> {
        if (input.isNotEmpty()) throw DocumentFailure("DOCUMENT_INVALID", 400)
        val token = user?.idToken ?: throw DocumentFailure("AUTH_REQUIRED", 401)
        val service = services.ifAvailable ?: throw DocumentFailure("PROFILE_DISABLED", 503)
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(service.check(VerifiedIdentity(token.issuer.toString(), token.subject)))
    }
    @ExceptionHandler(DocumentFailure::class) fun rejected(error: DocumentFailure) = ResponseEntity.status(error.status).header("Cache-Control", "no-store").body(mapOf("code" to error.code))
}
