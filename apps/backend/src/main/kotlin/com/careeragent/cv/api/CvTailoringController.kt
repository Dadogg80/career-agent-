package com.careeragent.cv.api

import com.careeragent.cv.application.*
import com.careeragent.ai.application.AiFailure
import com.careeragent.documents.application.DocumentFailure
import com.careeragent.jobs.application.SavedJobFailure
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
@RequestMapping("/api/profile/me/jobs/{jobId}/tailoring")
class CvTailoringController(private val services: ObjectProvider<CvTailoringService>, private val mapper: ObjectMapper) {
    @PostMapping(consumes=["application/json"])
    fun propose(@AuthenticationPrincipal principal: OidcUser?, @PathVariable jobId: String, @RequestBody input: Map<String,Any?>): ResponseEntity<*> {
        val token = principal?.idToken ?: throw CvFailure("AUTH_REQUIRED",401)
        if (input.keys != setOf("documentId","text","matchId","locale","consent","aiApproval") || input["consent"] !is Boolean || input["aiApproval"] !is String) throw CvFailure("CV_INVALID",400)
        val id = try { UUID.fromString(jobId).also { require(it.toString() == jobId.lowercase()) } } catch (_: Exception) { throw CvFailure("CV_INVALID",400) }
        val request = try { mapper.convertValue(input,TailoringRequest::class.java) } catch (_: Exception) { throw CvFailure("CV_INVALID",400) }
        return ResponseEntity.ok().header("Cache-Control","no-store").body((services.ifAvailable ?: throw CvFailure("PROFILE_DISABLED",503)).propose(VerifiedIdentity(token.issuer.toString(),token.subject),id,request))
    }
    private fun error(code: String,status: Int) = ResponseEntity.status(status).header("Cache-Control","no-store").body(mapOf("code" to code))
    @ExceptionHandler(CvFailure::class) fun cv(error: CvFailure) = error(error.code,error.status)
    @ExceptionHandler(SavedJobFailure::class) fun job(error: SavedJobFailure) = error(error.code,error.status)
    @ExceptionHandler(DocumentFailure::class) fun document(error: DocumentFailure) = error(error.code,error.status)
    @ExceptionHandler(HttpMessageNotReadableException::class) fun invalid() = error("CV_INVALID",400)
    @ExceptionHandler(AiFailure::class) fun ai(error: AiFailure): ResponseEntity<*> {
        val response=ResponseEntity.status(error.httpStatus).header("Cache-Control","no-store")
        error.retryAfterSeconds?.let { response.header("Retry-After",it.toString()) }
        return response.body(mapOf("code" to error.code))
    }
}
