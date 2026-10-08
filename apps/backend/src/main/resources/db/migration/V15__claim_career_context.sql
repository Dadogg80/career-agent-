ALTER TABLE competency_claim_revision ADD UNIQUE (claim_id, revision, recorded_by);
ALTER TABLE career_entry_revision ADD UNIQUE (entry_id, revision, owner_id);

-- Append-only owner decisions. Unlink events prevent document reanalysis restoring a link.
CREATE TABLE claim_career_context (
    owner_id UUID NOT NULL,
    claim_id UUID NOT NULL,
    entry_id UUID NOT NULL,
    version BIGINT NOT NULL CHECK (version BETWEEN 1 AND 1000),
    claim_revision BIGINT NOT NULL,
    entry_revision BIGINT NOT NULL,
    decision VARCHAR(8) NOT NULL CHECK (decision IN ('LINK', 'UNLINK')),
    basis VARCHAR(8) NOT NULL CHECK (basis IN ('DOCUMENT', 'USER')),
    document_id UUID,
    source_quote VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (owner_id, claim_id, entry_id, version),
    FOREIGN KEY (claim_id, claim_revision, owner_id) REFERENCES competency_claim_revision(claim_id, revision, recorded_by) ON DELETE CASCADE,
    FOREIGN KEY (entry_id, entry_revision, owner_id) REFERENCES career_entry_revision(entry_id, revision, owner_id) ON DELETE CASCADE,
    FOREIGN KEY (document_id, owner_id) REFERENCES career_document(id, owner_id) ON DELETE SET NULL (document_id),
    CHECK (basis <> 'DOCUMENT' OR source_quote IS NOT NULL)
);
