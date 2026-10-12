package com.careeragent.documents.infrastructure

import com.careeragent.documents.application.*
import com.careeragent.documents.domain.*
import com.careeragent.profile.application.VerifiedIdentity
import org.springframework.context.annotation.Profile
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.RowMapper
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.util.UUID

@Repository
@Profile("persistence")
class JdbcDocumentRepository(private val jdbc: JdbcTemplate, private val json: com.fasterxml.jackson.databind.ObjectMapper) : DocumentRepository {
    private val mapper = RowMapper { row, _ -> CareerDocument(row.getObject("id", UUID::class.java), row.getString("original_name"), row.getString("media_type"), row.getLong("byte_size"), row.getString("sha256"), row.getString("language"), row.getBoolean("is_master"), row.getObject("created_at", OffsetDateTime::class.java), row.getString("extracted_text").length, row.getString("extraction_method")) }
    private fun owner(identity: VerifiedIdentity, lock: Boolean = false): UUID = jdbc.query("SELECT u.id FROM app_user u JOIN career_profile p ON p.owner_id = u.id WHERE u.oidc_issuer = ? AND u.oidc_subject = ?" + if (lock) " FOR UPDATE OF u" else "", { row, _ -> row.getObject("id", UUID::class.java) }, identity.issuer, identity.subject).singleOrNull() ?: throw DocumentFailure("PROFILE_NOT_CREATED", 404)
    private fun document(owner: UUID, id: UUID) = jdbc.query("SELECT * FROM career_document WHERE owner_id = ? AND id = ?", mapper, owner, id).singleOrNull() ?: throw DocumentFailure("DOCUMENT_NOT_FOUND", 404)
    @Transactional(readOnly = true)
    override fun list(identity: VerifiedIdentity): List<CareerDocument> = jdbc.query("""
        SELECT d.*, metadata.value::text AS analysis_metadata FROM career_document d
        LEFT JOIN LATERAL (
            SELECT jsonb_build_object(
                'status', CASE WHEN c.status='COMPLETED' AND NOT COALESCE((c.result->>'partial')::boolean,false)
                    THEN 'COMPLETED' ELSE 'PARTIAL' END,
                'createdAt', c.result->>'createdAt', 'collection', c.collection,
                'competencies', (SELECT count(*) FROM jsonb_array_elements(COALESCE(c.result->'suggestions','[]')) x
                    WHERE x->>'documentId'=d.id::text OR (x->>'documentId' IS NULL AND NOT c.collection)
                    OR EXISTS(SELECT 1 FROM jsonb_array_elements(COALESCE(x->'additionalSources','[]')) e WHERE e->>'documentId'=d.id::text)),
                'careerEntries', (SELECT count(*) FROM jsonb_array_elements(COALESCE(c.result->'careerEntries','[]')) x
                    WHERE x->>'documentId'=d.id::text OR EXISTS(SELECT 1 FROM jsonb_array_elements(COALESCE(x->'additionalSources','[]')) e WHERE e->>'documentId'=d.id::text)),
                'profileSections', (SELECT count(*) FROM jsonb_array_elements(COALESCE(c.result->'profile','[]')) x
                    WHERE x->>'documentId'=d.id::text OR EXISTS(SELECT 1 FROM jsonb_array_elements(COALESCE(x->'additionalSources','[]')) e WHERE e->>'documentId'=d.id::text)),
                'inputCharacters', COALESCE((SELECT (x->>'inputCharacters')::int FROM jsonb_array_elements(COALESCE(c.result->'documents','[]')) x WHERE x->>'documentId'=d.id::text LIMIT 1), (c.result->>'inputCharacters')::int),
                'sourceCharacters', length(d.extracted_text), 'selections', COALESCE(c.result->'aiSelections','[]')
            ) AS value FROM (
                SELECT r.state->'analysis' AS result, r.state->>'status' AS status, r.scope='collection' AS collection, 1 AS priority
                FROM document_analysis_run r WHERE r.owner_id=d.owner_id AND r.state->'sources'->>d.id::text=d.extracted_text
                AND (r.state->>'completed')::int>0
                UNION ALL
                SELECT a.result, CASE WHEN (a.result->>'partial')::boolean THEN 'PARTIAL' ELSE 'COMPLETED' END, false, 0
                FROM document_analysis a WHERE a.owner_id=d.owner_id AND a.document_id=d.id
                UNION ALL
                SELECT a.result, CASE WHEN (a.result->>'partial')::boolean THEN 'PARTIAL' ELSE 'COMPLETED' END, true, 0
                FROM document_collection_analysis a WHERE a.owner_id=d.owner_id
                    AND EXISTS(SELECT 1 FROM jsonb_array_elements(a.result->'documents') x WHERE x->>'documentId'=d.id::text)
            ) c ORDER BY (c.result->>'createdAt')::timestamptz DESC, c.priority DESC LIMIT 1
        ) metadata ON true WHERE d.owner_id=? ORDER BY d.created_at DESC,d.id LIMIT 20
    """, { row, index -> mapper.mapRow(row,index)!!.copy(analysis=row.getString("analysis_metadata")?.let { json.readValue(it,DocumentAnalysisMetadata::class.java) }) }, owner(identity))
    @Transactional(readOnly = true)
    override fun detail(identity: VerifiedIdentity, id: UUID): DocumentDetail {
        val owner = owner(identity); val document = document(owner, id)
        val text = jdbc.queryForObject("SELECT extracted_text FROM career_document WHERE owner_id = ? AND id = ?", String::class.java, owner, id)!!
        return DocumentDetail(document, text)
    }
    @Transactional
    override fun create(identity: VerifiedIdentity, id: UUID, name: String, mediaType: String, size: Long, hash: String, text: String, language: String): CareerDocument {
        val owner = owner(identity, true)
        if (jdbc.queryForObject("SELECT COUNT(*) FROM career_document WHERE owner_id = ?", Long::class.java, owner)!! >= 20) throw DocumentFailure("DOCUMENT_LIMIT", 409)
        jdbc.update("INSERT INTO career_document(id, owner_id, original_name, media_type, byte_size, sha256, extracted_text, language) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", id, owner, name, mediaType, size, hash, text, language)
        jdbc.update("DELETE FROM document_collection_analysis WHERE owner_id = ?", owner)
        return document(owner, id)
    }
    @Transactional
    override fun selectMaster(identity: VerifiedIdentity, id: UUID): CareerDocument {
        val owner = owner(identity, true); val source = document(owner, id)
        if(source.mediaType !in setOf("application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document")) throw DocumentFailure("DOCUMENT_TYPE",400)
        jdbc.update("UPDATE career_document SET is_master = FALSE WHERE owner_id = ? AND is_master", owner)
        jdbc.update("UPDATE career_document SET is_master = TRUE WHERE owner_id = ? AND id = ?", owner, id)
        return document(owner, id)
    }
    @Transactional
    override fun delete(identity: VerifiedIdentity, id: UUID) {
        val owner = owner(identity, true); document(owner, id)
        jdbc.update("DELETE FROM document_analysis_run WHERE owner_id=? AND jsonb_exists(state->'sources', ?)", owner, id.toString())
        jdbc.update("DELETE FROM career_document WHERE owner_id = ? AND id = ?", owner, id)
        jdbc.update("DELETE FROM document_collection_analysis WHERE owner_id = ?", owner)
    }
    @Transactional
    override fun replaceText(identity: VerifiedIdentity, id: UUID, text: String, method: String): DocumentDetail {
        val owner = owner(identity, true); document(owner, id)
        val previous = jdbc.queryForObject("SELECT extracted_text FROM career_document WHERE owner_id = ? AND id = ?", String::class.java, owner, id)
        jdbc.update("UPDATE career_document SET extracted_text = ?, extraction_method = ? WHERE owner_id = ? AND id = ?", text, method, owner, id)
        if (previous != text) {
            jdbc.update("DELETE FROM document_analysis_run WHERE owner_id=? AND jsonb_exists(state->'sources', ?)", owner, id.toString())
            jdbc.update("DELETE FROM document_analysis WHERE owner_id = ? AND document_id = ?", owner, id)
            jdbc.update("DELETE FROM document_collection_analysis WHERE owner_id = ?", owner)
        }
        return DocumentDetail(document(owner, id), text)
    }
}
