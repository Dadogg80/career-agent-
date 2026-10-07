package com.careeragent.documents.infrastructure

import com.careeragent.documents.application.*
import com.careeragent.documents.domain.DocumentAnalysis
import com.careeragent.profile.application.VerifiedIdentity
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.context.annotation.Profile
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Repository
@Profile("persistence")
class JdbcDocumentAnalysisRepository(private val jdbc: JdbcTemplate, private val mapper: ObjectMapper) : DocumentAnalysisRepository {
    @Transactional(readOnly = true)
    override fun load(identity: VerifiedIdentity, documentId: UUID): DocumentAnalysis? = jdbc.query("""
        SELECT a.result::text FROM document_analysis a JOIN app_user u ON u.id = a.owner_id
        WHERE a.document_id = ? AND u.oidc_issuer = ? AND u.oidc_subject = ?
    """, { row, _ -> mapper.readValue(row.getString(1), DocumentAnalysis::class.java) }, documentId, identity.issuer, identity.subject).singleOrNull()

    @Transactional
    override fun save(identity: VerifiedIdentity, documentId: UUID, analysis: DocumentAnalysis, expectedText: String): DocumentAnalysis {
        // Lock/check the source again after the model call; never recreate a deleted document.
        val owner = jdbc.query("""SELECT d.owner_id FROM career_document d JOIN app_user u ON u.id = d.owner_id
            WHERE d.id = ? AND u.oidc_issuer = ? AND u.oidc_subject = ? FOR UPDATE OF d""",
            { row, _ -> row.getObject(1, UUID::class.java) }, documentId, identity.issuer, identity.subject).singleOrNull()
            ?: throw DocumentFailure("DOCUMENT_NOT_FOUND", 404)
        val current = jdbc.queryForObject("SELECT extracted_text FROM career_document WHERE owner_id = ? AND id = ?", String::class.java, owner, documentId)
        if (current != expectedText) throw DocumentFailure("DOCUMENT_ANALYSIS_CONFLICT", 409)
        jdbc.update("""INSERT INTO document_analysis(document_id, owner_id, result) VALUES (?, ?, ?::jsonb)
            ON CONFLICT (document_id) DO UPDATE SET result = EXCLUDED.result""", documentId, owner, mapper.writeValueAsString(analysis))
        return analysis
    }

    @Transactional(readOnly = true)
    override fun loadCollection(identity: VerifiedIdentity): DocumentAnalysis? = jdbc.query("""
        SELECT a.result::text FROM document_collection_analysis a JOIN app_user u ON u.id = a.owner_id
        WHERE u.oidc_issuer = ? AND u.oidc_subject = ?
    """, { row, _ -> mapper.readValue(row.getString(1), DocumentAnalysis::class.java) }, identity.issuer, identity.subject).singleOrNull()

    @Transactional
    override fun saveCollection(identity: VerifiedIdentity, analysis: DocumentAnalysis, expectedText: Map<UUID, String>): DocumentAnalysis {
        val owner = jdbc.query("""SELECT u.id FROM app_user u JOIN career_profile p ON p.owner_id = u.id
            WHERE u.oidc_issuer = ? AND u.oidc_subject = ? FOR UPDATE OF u""",
            { row, _ -> row.getObject(1, UUID::class.java) }, identity.issuer, identity.subject).singleOrNull() ?: throw DocumentFailure("PROFILE_NOT_CREATED", 404)
        val existing = jdbc.query("SELECT id FROM career_document WHERE owner_id = ?", { row, _ -> row.getObject(1, UUID::class.java) }, owner).toSet()
        if (analysis.documents.any { it.documentId !in existing }) throw DocumentFailure("DOCUMENT_NOT_FOUND", 404)
        val current = jdbc.query("SELECT id, extracted_text FROM career_document WHERE owner_id = ?", { row, _ -> row.getObject(1, UUID::class.java) to row.getString(2) }, owner).toMap()
        if (expectedText.any { (id, text) -> current[id] != text }) throw DocumentFailure("DOCUMENT_ANALYSIS_CONFLICT", 409)
        jdbc.update("""INSERT INTO document_collection_analysis(owner_id, result) VALUES (?, ?::jsonb)
            ON CONFLICT (owner_id) DO UPDATE SET result = EXCLUDED.result""", owner, mapper.writeValueAsString(analysis))
        return analysis
    }
}
