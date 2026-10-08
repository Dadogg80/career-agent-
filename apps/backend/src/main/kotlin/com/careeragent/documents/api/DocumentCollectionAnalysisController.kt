package com.careeragent.documents.api

import com.careeragent.documents.application.DocumentFailure
import com.careeragent.documents.application.DocumentAnalysisService
import com.careeragent.documents.domain.DocumentExcerpt
import org.springframework.beans.factory.ObjectProvider
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/profile/me/documents/analysis")
class DocumentCollectionAnalysisController(services: ObjectProvider<DocumentAnalysisService>) : DocumentAnalysisController(services) {
    @GetMapping override fun load(@AuthenticationPrincipal principal: OidcUser?, @PathVariable(required = false) documentId: String?) = response(mapOf("analysis" to service().loadCollection(identity(principal))))
    @PostMapping(consumes = ["application/json"])
    override fun analyze(@AuthenticationPrincipal principal: OidcUser?, @PathVariable(required = false) documentId: String?, @RequestBody input: Map<String, Any?>): ResponseEntity<*> {
        if (input.filterKeys { it!="aiApproval" }.keys != setOf("documents", "locale", "consent") || input["documents"] !is List<*> || input["locale"] !is String || input["consent"] !is Boolean) throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID", 400)
        val documents = (input["documents"] as List<*>).map { item ->
            if (item !is Map<*, *> || item.keys != setOf("documentId", "text") || item["documentId"] !is String || item["text"] !is String) throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID", 400)
            DocumentExcerpt(id(item["documentId"] as String), item["text"] as String)
        }
        if(input.containsKey("aiApproval") && input["aiApproval"] !is String)throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID",400)
        return response(service().analyzeCollection(identity(principal), documents, input["locale"] as String, input["consent"] as Boolean,input["aiApproval"] as? String))
    }
}
