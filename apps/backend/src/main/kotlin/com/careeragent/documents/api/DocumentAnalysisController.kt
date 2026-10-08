package com.careeragent.documents.api

import com.careeragent.ai.application.AiFailure
import com.careeragent.documents.application.*
import com.careeragent.profile.application.VerifiedIdentity
import org.springframework.beans.factory.ObjectProvider
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/profile/me/documents/{documentId}/analysis")
open class DocumentAnalysisController(private val services: ObjectProvider<DocumentAnalysisService>) {
    protected fun service() = services.ifAvailable ?: throw DocumentFailure("PROFILE_DISABLED", 503)
    protected fun identity(principal: OidcUser?): VerifiedIdentity {
        val token = principal?.idToken ?: throw DocumentFailure("AUTH_REQUIRED", 401)
        return VerifiedIdentity(token.issuer.toString(), token.subject)
    }
    protected fun id(value: String) = try { UUID.fromString(value).also { require(it.toString() == value.lowercase()) } }
        catch (_: IllegalArgumentException) { throw DocumentFailure("DOCUMENT_INVALID", 400) }
    protected fun <T> response(value: T) = ResponseEntity.ok().header("Cache-Control", "no-store").body(value)
    @GetMapping open fun load(@AuthenticationPrincipal principal: OidcUser?, @PathVariable documentId: String?) = response(mapOf("analysis" to service().load(identity(principal), id(documentId!!))))
    @PostMapping(consumes = ["application/json"])
    open fun analyze(@AuthenticationPrincipal principal: OidcUser?, @PathVariable documentId: String?, @RequestBody input: Map<String, Any?>): ResponseEntity<*> {
        if (input.filterKeys { it!="aiApproval" }.keys != setOf("text", "locale", "consent") || input["text"] !is String || input["locale"] !is String || input["consent"] !is Boolean) throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID", 400)
        if(input.containsKey("aiApproval") && input["aiApproval"] !is String)throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400)
        return response(service().analyze(identity(principal), id(documentId!!), input["text"] as String, input["locale"] as String, input["consent"] as Boolean,input["aiApproval"] as? String))
    }
    @ExceptionHandler(DocumentFailure::class) fun rejected(error: DocumentFailure) = ResponseEntity.status(error.status).header("Cache-Control", "no-store").body(mapOf("code" to error.code))
    @ExceptionHandler(AiFailure::class) fun failed(error: AiFailure): ResponseEntity<*> {
        val response = ResponseEntity.status(error.httpStatus).header("Cache-Control", "no-store")
        error.retryAfterSeconds?.let { response.header("Retry-After", it.toString()) }
        return response.body(mapOf("code" to error.code) + (error.reason?.let { mapOf("reason" to it) } ?: emptyMap()))
    }
    @ExceptionHandler(HttpMessageNotReadableException::class) fun malformed() = ResponseEntity.badRequest().header("Cache-Control", "no-store").body(mapOf("code" to "DOCUMENT_AI_INPUT_INVALID"))
}
