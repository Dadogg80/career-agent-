package com.careeragent.documents.api

import com.careeragent.documents.application.*
import com.careeragent.profile.application.ClaimFailure
import com.careeragent.profile.application.VerifiedIdentity
import org.springframework.beans.factory.ObjectProvider
import org.springframework.http.ContentDisposition
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.multipart.MaxUploadSizeExceededException
import java.util.UUID

@RestController
@RequestMapping("/api/profile/me/documents")
class DocumentsController(private val services: ObjectProvider<DocumentService>) {
    private fun service() = services.ifAvailable ?: throw DocumentFailure("PROFILE_DISABLED", 503)
    private fun identity(principal: OidcUser?): VerifiedIdentity { val token = principal?.idToken ?: throw DocumentFailure("AUTH_REQUIRED", 401); return VerifiedIdentity(token.issuer.toString(), token.subject) }
    private fun id(value: String) = try { UUID.fromString(value).also { if (it.toString() != value.lowercase()) throw IllegalArgumentException() } } catch (_: IllegalArgumentException) { throw DocumentFailure("DOCUMENT_INVALID", 400) }
    private fun <T> response(value: T) = ResponseEntity.ok().header("Cache-Control", "no-store").body(value)
    @GetMapping fun list(@AuthenticationPrincipal principal: OidcUser?) = response(service().list(identity(principal)))
    @PostMapping(consumes = ["multipart/form-data"])
    fun upload(@AuthenticationPrincipal principal: OidcUser?, @RequestParam file: MultipartFile, @RequestParam language: String) = response(service().upload(identity(principal), file.originalFilename ?: "", language, file.bytes))
    @GetMapping("/{documentId}") fun detail(@AuthenticationPrincipal principal: OidcUser?, @PathVariable documentId: String) = response(service().detail(identity(principal), id(documentId)))
    @GetMapping("/{documentId}/original") fun original(@AuthenticationPrincipal principal: OidcUser?, @PathVariable documentId: String): ResponseEntity<ByteArray> {
        val (document, bytes) = service().original(identity(principal), id(documentId))
        return ResponseEntity.ok().header("Cache-Control", "no-store").header("X-Content-Type-Options", "nosniff").header("Content-Type", "application/octet-stream").header("Content-Disposition", ContentDisposition.attachment().filename(document.originalName, Charsets.UTF_8).build().toString()).body(bytes)
    }
    @PostMapping("/{documentId}/master") fun master(@AuthenticationPrincipal principal: OidcUser?, @PathVariable documentId: String) = response(service().selectMaster(identity(principal), id(documentId)))
    @PostMapping("/{documentId}/claims", consumes = ["application/json"])
    fun claim(@AuthenticationPrincipal principal: OidcUser?, @PathVariable documentId: String, @RequestBody input: Map<String, Any?>): ResponseEntity<*> {
        val fields = setOf("skill", "statement", "context", "quote")
        if (input.keys !in setOf(fields, fields + "analysisId") || input.values.any { it !is String }) throw DocumentFailure("DOCUMENT_INVALID", 400)
        return response(service().claim(identity(principal), id(documentId), input["skill"] as String, input["statement"] as String, input["context"] as String, input["quote"] as String, (input["analysisId"] as String?)?.let(::id)))
    }
    @DeleteMapping("/{documentId}") fun delete(@AuthenticationPrincipal principal: OidcUser?, @PathVariable documentId: String): ResponseEntity<Void> { service().delete(identity(principal), id(documentId)); return ResponseEntity.noContent().header("Cache-Control", "no-store").build() }
    @ExceptionHandler(DocumentFailure::class) fun rejected(error: DocumentFailure) = ResponseEntity.status(error.status).header("Cache-Control", "no-store").body(mapOf("code" to error.code))
    @ExceptionHandler(ClaimFailure::class) fun claimRejected(error: ClaimFailure) = ResponseEntity.status(error.status).header("Cache-Control", "no-store").body(mapOf("code" to error.code))
    @ExceptionHandler(MaxUploadSizeExceededException::class) fun tooLarge() = ResponseEntity.status(413).header("Cache-Control", "no-store").body(mapOf("code" to "DOCUMENT_TOO_LARGE"))
}
