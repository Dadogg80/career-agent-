package com.careeragent.documents.application

import com.careeragent.ai.application.AiFailure
import com.fasterxml.jackson.databind.ObjectMapper
import java.util.UUID

/** The model selects evidence IDs; application code supplies the original wording. */
internal class DocumentEvidenceSelection(texts: Map<UUID, String>, private val mapper: ObjectMapper) {
    private data class Passage(val documentId: UUID, val text: String)
    private val passages = texts.flatMap { (id, text) ->
        Regex("[^\\r\\n]+").findAll(text).flatMap { line ->
            val parts = mutableListOf<Passage>()
            var start = 0
            while (start < line.value.length) {
                var end = minOf(start + 260, line.value.length)
                if (end < line.value.length) {
                    val space = line.value.lastIndexOf(' ', end)
                    if (space > start) end = space + 1
                }
                val part = line.value.substring(start, end)
                if (part.isNotBlank()) parts.add(Passage(id, part))
                start = end
            }
            parts.asSequence()
        }.toList()
    }

    init { if (passages.size > 512) throw DocumentFailure("DOCUMENT_AI_INPUT_INVALID", 400) }

    fun input(): String {
        val documentNumbers = passages.map { it.documentId }.distinct().withIndex().associate { it.value to it.index }
        return mapper.writeValueAsString(mapOf("passages" to passages.mapIndexed { index, passage ->
            mapOf("id" to index, "document" to documentNumbers.getValue(passage.documentId), "text" to passage.text)
        }))
    }

    fun expand(output: String, collection: Boolean): String {
        try {
            val root = try { mapper.readTree(output) } catch (_: Exception) { throw AiFailure("AI_INVALID_RESULT", 502, reason = "MALFORMED_JSON") }
            require(root.isObject && root.fieldNames().asSequence().toSet() == setOf("summary", "suggestions"))
            require(root["summary"].isArray && root["suggestions"].isArray && root["summary"].size() <= 100 && root["suggestions"].size() <= 100)
            fun evidence(node: com.fasterxml.jackson.databind.JsonNode, key: String): Passage? =
                node[key]?.takeIf { it.isIntegralNumber && it.canConvertToInt() }?.intValue()?.let { passages.getOrNull(it) }
            val summary = root["summary"].map { node ->
                val passage = evidence(node, "evidenceId")?.takeIf { node.fieldNames().asSequence().toSet() == setOf("evidenceId") }
                mapOf("text" to (passage?.text ?: ""), "quote" to (passage?.text ?: "")) +
                    if (collection) mapOf("documentId" to passage?.documentId?.toString().orEmpty()) else emptyMap()
            }
            val suggestions = root["suggestions"].map { node ->
                val passage = evidence(node, "evidenceId")?.takeIf { node.fieldNames().asSequence().toSet() == setOf("skill", "evidenceId", "contextId", "context") }
                val context = evidence(node, "contextId")?.takeIf { it.documentId == passage?.documentId }
                mapOf("skill" to node.path("skill"), "statement" to (passage?.text ?: ""), "quote" to (passage?.text ?: ""),
                    "context" to node.path("context"), "contextQuote" to (context?.text ?: "")) +
                    if (collection) mapOf("documentId" to passage?.documentId?.toString().orEmpty()) else emptyMap()
            }
            return mapper.writeValueAsString(mapOf("summary" to summary, "suggestions" to suggestions))
        } catch (error: AiFailure) { throw error }
        catch (_: Exception) { throw AiFailure("AI_INVALID_RESULT", 502, reason = "INVALID_STRUCTURE") }
    }

    companion object {
        fun schema(): Map<String, Any> {
            fun array(properties: Map<String, Any>) = mapOf("type" to "array", "items" to mapOf("type" to "object",
                "additionalProperties" to false, "required" to properties.keys.toList(), "properties" to properties))
            val integer = mapOf("type" to "integer")
            val string = mapOf("type" to "string")
            return mapOf("type" to "object", "additionalProperties" to false, "required" to listOf("summary", "suggestions"),
                "properties" to mapOf("summary" to array(mapOf("evidenceId" to integer)),
                    "suggestions" to array(mapOf("skill" to string, "evidenceId" to integer, "contextId" to integer, "context" to string))))
        }
    }
}
