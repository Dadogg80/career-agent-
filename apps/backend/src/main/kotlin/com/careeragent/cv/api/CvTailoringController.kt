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
class CvTailoringController(private val services: ObjectProvider<CvTailoringSessions>, private val mapper: ObjectMapper) {
    private fun identity(principal: OidcUser?): VerifiedIdentity {
        val token = principal?.idToken ?: throw CvFailure("AUTH_REQUIRED",401)
        return VerifiedIdentity(token.issuer.toString(),token.subject)
    }
    private fun id(value: String): UUID = try { UUID.fromString(value).also { require(it.toString() == value.lowercase()) } } catch (_: Exception) { throw CvFailure("CV_INVALID",400) }
    @GetMapping("/session")
    fun latest(@AuthenticationPrincipal principal: OidcUser?, @PathVariable jobId: String): ResponseEntity<*> =
        ResponseEntity.ok().header("Cache-Control","no-store").body((services.ifAvailable ?: throw CvFailure("PROFILE_DISABLED",503)).latest(identity(principal),id(jobId)) ?: mapper.nodeFactory.nullNode())
    @PutMapping("/session", consumes=["application/json"])
    fun review(@AuthenticationPrincipal principal: OidcUser?, @PathVariable jobId: String, @RequestBody input: Map<String,Any?>): ResponseEntity<*> {
        val identity = identity(principal)
        if (input.keys != setOf("sessionId","revision","reviews") || input["revision"] !is Number || input["reviews"] !is List<*>) throw CvFailure("CV_INVALID",400)
        val revision = input["revision"] as Number
        if (revision.toLong() < 1 || revision.toDouble() != revision.toLong().toDouble()) throw CvFailure("CV_INVALID",400)
        val reviews = input["reviews"] as List<*>
        if (reviews.size > 12 || reviews.any { it !is Map<*,*> || it.keys != setOf("paragraphIndex","text","decision") || it["paragraphIndex"] !is Int || it["text"] !is String || it["decision"] !in WordingDecision.entries.map { d -> d.name } }) throw CvFailure("CV_INVALID",400)
        val request = try { mapper.convertValue(input,TailoringReviewRequest::class.java) } catch (_: Exception) { throw CvFailure("CV_INVALID",400) }
        return ResponseEntity.ok().header("Cache-Control","no-store").body((services.ifAvailable ?: throw CvFailure("PROFILE_DISABLED",503)).review(identity,id(jobId),request))
    }
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
