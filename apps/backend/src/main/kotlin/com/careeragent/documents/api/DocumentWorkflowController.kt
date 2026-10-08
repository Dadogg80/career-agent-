package com.careeragent.documents.api

import com.careeragent.documents.application.*
import com.careeragent.documents.domain.DocumentExcerpt
import com.careeragent.profile.application.EntryFailure
import com.careeragent.profile.domain.CareerEntryContent
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.ObjectProvider
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/profile/me/documents/workflow")
class DocumentWorkflowController(private val workflows:ObjectProvider<DocumentAnalysisWorkflow>,private val json:ObjectMapper) {
    private fun identity(principal:OidcUser?):com.careeragent.profile.application.VerifiedIdentity { val token=principal?.idToken ?: throw DocumentFailure("AUTH_REQUIRED",401); return com.careeragent.profile.application.VerifiedIdentity(token.issuer.toString(),token.subject) }
    private fun id(value:String)=try {java.util.UUID.fromString(value).also { require(it.toString()==value.lowercase()) }} catch(_:IllegalArgumentException){throw DocumentFailure("DOCUMENT_INVALID",400)}
    private fun <T> response(value:T)=org.springframework.http.ResponseEntity.ok().header("Cache-Control","no-store").body(value)
    private fun workflow()=workflows.ifAvailable ?: throw DocumentFailure("PROFILE_DISABLED",503)
    private fun scope(value:String)=if(value=="collection")value else id(value).toString()
    private fun keys(input:Map<String,Any?>,keys:Set<String>) {if(input.keys!=keys)throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400)}
    private fun revision(input:Map<String,Any?>):Long {val r=input["revision"];if(r !is Int && r !is Long)throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400);return (r as Number).toLong()}
    @GetMapping fun latest(@AuthenticationPrincipal principal:OidcUser?,@RequestParam scope:String)=response(mapOf("run" to workflow().latest(identity(principal),(if(scope=="profile")scope else scope(scope)))))
    @PostMapping(consumes=["application/json"]) fun start(@AuthenticationPrincipal principal:OidcUser?,@RequestBody input:Map<String,Any?>):Any {
        keys(input.filterKeys { it!="aiApproval" && it!="populateProfile" },setOf("scope","documents","locale","consent"))
        if(input.containsKey("populateProfile") && input["populateProfile"] !is Boolean)throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400)
        if(input.containsKey("aiApproval") && input["aiApproval"] !is String)throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400)
        if(input["scope"] !is String || input["locale"] !is String || input["consent"] !is Boolean || input["documents"] !is List<*>)throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400)
        val documents=(input["documents"] as List<*>).map { item -> if(item !is Map<*,*> || item.keys!=setOf("documentId","text") || item["documentId"] !is String || item["text"] !is String)throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400);DocumentExcerpt(id(item["documentId"] as String),item["text"] as String) }
        return response(workflow().start(identity(principal),scope(input["scope"] as String),documents,input["locale"] as String,input["consent"] as Boolean,input["aiApproval"] as? String,input["populateProfile"] as? Boolean ?: false))
    }
    @PostMapping("/{runId}/provider",consumes=["application/json"])
    fun provider(@AuthenticationPrincipal principal:OidcUser?,@PathVariable runId:String,@RequestBody input:Map<String,Any?>):Any {
        keys(input,setOf("revision","consent","aiApproval"))
        if(input["consent"] !is Boolean || input["aiApproval"] !is String) throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400)
        return response(workflow().switchProvider(identity(principal),id(runId),revision(input),input["consent"] as Boolean,input["aiApproval"] as String))
    }
    @GetMapping("/{runId}") fun progress(@AuthenticationPrincipal principal:OidcUser?,@PathVariable runId:String)=response(workflow().load(identity(principal),id(runId)))
    @PostMapping("/{runId}/next",consumes=["application/json"]) fun next(@AuthenticationPrincipal principal:OidcUser?,@PathVariable runId:String,@RequestBody input:Map<String,Any?>):Any {keys(input,setOf("revision"));return response(workflow().next(identity(principal),id(runId),revision(input)))}
    @PostMapping("/{runId}/entries",consumes=["application/json"]) fun importEntry(@AuthenticationPrincipal principal:OidcUser?,@PathVariable runId:String,@RequestBody input:Map<String,Any?>):Any {
        keys(input,setOf("key","content","confirm"));if(input["confirm"] !is Boolean)throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400);val key=input["key"] as? String ?: throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400)
        val raw=input["content"] as? Map<*,*> ?: throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400)
        if(raw.keys!=setOf("kind","title","organization","client","deliveryRole","startMonth","endMonth","ongoing","description","sourceNote"))throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400)
        val content=try {json.convertValue(raw,CareerEntryContent::class.java)}catch(_:Exception){throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400)}
        return response(workflow().importEntry(identity(principal),id(runId),id(key),content,input["confirm"] as Boolean))
    }
    @PostMapping("/{runId}/claims",consumes=["application/json"]) fun importClaim(@AuthenticationPrincipal principal:OidcUser?,@PathVariable runId:String,@RequestBody input:Map<String,Any?>):Any {
        keys(input.filterKeys {it!="reject"},setOf("revision","index","skill","statement","context","confirm"))
        if(input.containsKey("reject") && input["reject"] !is Boolean || input["reject"]==true && input["confirm"]==true)throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400)
        if(input["index"] !is Int || input["skill"] !is String || input["statement"] !is String || input["context"] !is String || input["confirm"] !is Boolean)throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400)
        return response(workflow().importClaim(identity(principal),id(runId),revision(input),input["index"] as Int,input["skill"] as String,input["statement"] as String,input["context"] as String,input["confirm"] as Boolean,input["reject"] as? Boolean ?: false))
    }
    @ExceptionHandler(com.careeragent.profile.application.ClaimFailure::class) fun claimFailure(error:com.careeragent.profile.application.ClaimFailure)=org.springframework.http.ResponseEntity.status(error.status).header("Cache-Control","no-store").body(mapOf("code" to error.code))
    @PutMapping("/{runId}/summary",consumes=["application/json"]) fun summary(@AuthenticationPrincipal principal:OidcUser?,@PathVariable runId:String,@RequestBody input:Map<String,Any?>):Any {
        keys(input,setOf("revision","index","text"));val index=input["index"] as? Int ?: throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400);val text=input["text"] as? String ?: throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400)
        return response(workflow().editSummary(identity(principal),id(runId),index,revision(input),text))
    }
    @ExceptionHandler(DocumentFailure::class) fun rejected(error:DocumentFailure)=org.springframework.http.ResponseEntity.status(error.status).header("Cache-Control","no-store").body(mapOf("code" to error.code))
    @ExceptionHandler(com.careeragent.ai.application.AiFailure::class) fun failed(error:com.careeragent.ai.application.AiFailure):org.springframework.http.ResponseEntity<*> {
        val response=org.springframework.http.ResponseEntity.status(error.httpStatus).header("Cache-Control","no-store")
        error.retryAfterSeconds?.let { response.header("Retry-After",it.toString()) }; return response.body(mapOf("code" to error.code))
    }
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException::class) fun malformed()=org.springframework.http.ResponseEntity.badRequest().header("Cache-Control","no-store").body(mapOf("code" to "DOCUMENT_AI_INPUT_INVALID"))
    @ExceptionHandler(EntryFailure::class) fun entryFailure(error:EntryFailure)=org.springframework.http.ResponseEntity.status(error.status).header("Cache-Control","no-store").body(mapOf("code" to error.code))
}
