package com.careeragent.cv.api

import com.careeragent.ai.application.AiFailure
import com.careeragent.cv.application.*
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
@RequestMapping("/api/profile/me/jobs/{jobId}/tailoring/source-review")
class CvWordingSourceController(private val services: ObjectProvider<CvWordingSourceReview>, private val mapper: ObjectMapper) {
    @PostMapping(consumes=["application/json"])
    fun review(@AuthenticationPrincipal principal: OidcUser?, @PathVariable jobId: UUID, @RequestBody input: Map<String,Any?>): ResponseEntity<*> {
        val token=principal?.idToken ?: throw CvFailure("AUTH_REQUIRED",401)
        val revision=input["revision"] as? Number
        if(input.keys!=setOf("sessionId","revision","paragraphIndexes","locale","consent","aiApproval") ||
            input["sessionId"] !is String || revision==null || revision.toLong()<1 || revision.toDouble()!=revision.toLong().toDouble() ||
            input["consent"] !is Boolean || input["aiApproval"] !is String || input["locale"] !in setOf("nb","en") ||
            input["paragraphIndexes"] !is List<*> || (input["paragraphIndexes"] as List<*>).any {it !is Int}) throw CvFailure("CV_INVALID",400)
        val request=try {mapper.convertValue(input,WordingSourceRequest::class.java)} catch(_:Exception){throw CvFailure("CV_INVALID",400)}
        val result=(services.ifAvailable ?: throw CvFailure("PROFILE_DISABLED",503)).review(VerifiedIdentity(token.issuer.toString(),token.subject),jobId,request)
        return ResponseEntity.ok().header("Cache-Control","no-store").body(result)
    }
    @ExceptionHandler(CvFailure::class) fun cv(error: CvFailure) = ResponseEntity.status(error.status).header("Cache-Control","no-store").body(mapOf("code" to error.code))
    @ExceptionHandler(HttpMessageNotReadableException::class) fun invalid() = ResponseEntity.badRequest().header("Cache-Control","no-store").body(mapOf("code" to "CV_INVALID"))
    @ExceptionHandler(AiFailure::class) fun ai(error: AiFailure): ResponseEntity<*> {
        val response=ResponseEntity.status(error.httpStatus).header("Cache-Control","no-store")
        error.retryAfterSeconds?.let {response.header("Retry-After",it.toString())}
        return response.body(mapOf("code" to error.code))
    }
}
