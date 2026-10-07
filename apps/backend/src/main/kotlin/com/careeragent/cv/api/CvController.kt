package com.careeragent.cv.api

import com.careeragent.cv.application.*
import com.careeragent.cv.domain.*
import com.careeragent.profile.application.*
import com.careeragent.jobs.application.SavedJobFailure
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.ObjectProvider
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/profile/me/cvs")
class CvController(private val services: ObjectProvider<CvService>,private val json: ObjectMapper) {
    private fun service()=services.ifAvailable ?: throw CvFailure("PROFILE_DISABLED",503)
    private fun identity(user:OidcUser?)=user?.idToken?.let { VerifiedIdentity(it.issuer.toString(),it.subject) } ?: throw CvFailure("AUTH_REQUIRED",401)
    private fun id(value:String)=try { UUID.fromString(value).also { require(it.toString()==value.lowercase()) } } catch (_:Exception) {throw CvFailure("CV_INVALID",400)}
    private fun revision(input:Map<String,Any?>):Long {val value=input["revision"];if(value !is Int && value !is Long)throw CvFailure("CV_INVALID",400);return(value as Number).toLong()}
    private fun <T> response(value:T)=ResponseEntity.ok().header("Cache-Control","no-store").body(value)
    @GetMapping fun list(@AuthenticationPrincipal user:OidcUser?)=response(service().list(identity(user)))
    @GetMapping("/cleanup") fun cleanupStatus(@AuthenticationPrincipal user:OidcUser?)=response(mapOf("remaining" to service().cleanupStatus(identity(user))))
    @PostMapping("/cleanup") fun retryCleanup(@AuthenticationPrincipal user:OidcUser?)=response(mapOf("remaining" to service().cleanup(identity(user))))
    @GetMapping("/{versionId}") fun get(@AuthenticationPrincipal user:OidcUser?,@PathVariable versionId:String)=response(service().get(identity(user),id(versionId)))
    @PostMapping(consumes=["application/json"])
    fun create(@AuthenticationPrincipal user:OidcUser?,@RequestBody input:Map<String,Any?>):ResponseEntity<CvVersion> {
        if(input.keys!=setOf("title","locale","identity","claims","entries","jobId"))throw CvFailure("CV_INVALID",400)
        val h=input["identity"] as? Map<*,*> ?: throw CvFailure("CV_INVALID",400)
        if(h.keys!=setOf("name","headline","email","phone","location","summary"))throw CvFailure("CV_INVALID",400)
        listOf("claims","entries").forEach { key -> val selected=input[key] as? List<*> ?: throw CvFailure("CV_INVALID",400);if(selected.any { it !is Map<*,*> || it.keys!=setOf("id","revision") || it["revision"] !is Int && it["revision"] !is Long })throw CvFailure("CV_INVALID",400) }
        val request=try { json.convertValue(input,CvDraftRequest::class.java) } catch (_:Exception) {throw CvFailure("CV_INVALID",400)}
        return response(service().create(identity(user),request))
    }
    @PostMapping("/{versionId}/approve",consumes=["application/json"])
    fun approve(@AuthenticationPrincipal user:OidcUser?,@PathVariable versionId:String,@RequestBody input:Map<String,Any?>):ResponseEntity<CvVersion> {
        if(input.keys!=setOf("revision","approved") || input["approved"]!=true)throw CvFailure("CV_APPROVAL_REQUIRED",400)
        return response(service().approve(identity(user),id(versionId),revision(input),true))
    }
    @GetMapping("/{versionId}/download/{format}")
    fun download(@AuthenticationPrincipal user:OidcUser?,@PathVariable versionId:String,@PathVariable format:String):ResponseEntity<ByteArray> {
        val type=try { CvFormat.valueOf(format.uppercase()) } catch (_:Exception) {throw CvFailure("CV_INVALID",400)}
        val version=id(versionId);val bytes=service().download(identity(user),version,type)
        return ResponseEntity.ok().header("Cache-Control","no-store").header("X-Content-Type-Options","nosniff").header("Content-Disposition","attachment; filename=\"career-cv-$version.${type.name.lowercase()}\"")
            .header("Content-Type",if(type==CvFormat.PDF) "application/pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document").body(bytes)
    }
    @DeleteMapping("/{versionId}",consumes=["application/json"])
    fun delete(@AuthenticationPrincipal user:OidcUser?,@PathVariable versionId:String,@RequestBody input:Map<String,Any?>):ResponseEntity<Void> {
        if(input.keys!=setOf("revision"))throw CvFailure("CV_INVALID",400)
        service().delete(identity(user),id(versionId),revision(input));return ResponseEntity.noContent().header("Cache-Control","no-store").build()
    }
    @ExceptionHandler(CvFailure::class) fun failure(error:CvFailure)=ResponseEntity.status(error.status).header("Cache-Control","no-store").body(mapOf("code" to error.code))
    @ExceptionHandler(SavedJobFailure::class) fun source(error:SavedJobFailure)=failure(CvFailure(if(error.code=="PROFILE_NOT_CREATED")error.code else "CV_SOURCE_CONFLICT",if(error.code=="PROFILE_NOT_CREATED")404 else 409))
    @ExceptionHandler(ClaimFailure::class,EntryFailure::class) fun profile()=failure(CvFailure("PROFILE_NOT_CREATED",404))
    @ExceptionHandler(HttpMessageNotReadableException::class) fun malformed()=failure(CvFailure("CV_INVALID",400))
}
