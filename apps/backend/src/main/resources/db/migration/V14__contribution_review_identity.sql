-- Existing source keys may represent documentary imports or manual reviews.
-- Retain ambiguous tombstones as blockers rather than assign them to every contribution.
ALTER TABLE document_profile_import ADD COLUMN purpose VARCHAR(16) NOT NULL DEFAULT 'DOCUMENT'
    CHECK (purpose IN ('DOCUMENT','REVIEW','SOURCE_BLOCKER','LEGACY'));
UPDATE document_profile_import AS imported SET purpose='LEGACY'
WHERE kind='CLAIM' AND NOT EXISTS (
    SELECT 1 FROM competency_claim_revision AS revision
    WHERE revision.recorded_by=imported.owner_id AND revision.claim_id=imported.claim_id
    AND revision.action='DOCUMENT_IMPORT'
);
