CREATE TABLE career_document (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    original_name VARCHAR(120) NOT NULL,
    media_type VARCHAR(100) NOT NULL,
    byte_size BIGINT NOT NULL CHECK (byte_size BETWEEN 1 AND 5242880),
    sha256 CHAR(64) NOT NULL,
    extracted_text TEXT NOT NULL CHECK (length(extracted_text) <= 60000),
    language VARCHAR(2) NOT NULL CHECK (language IN ('nb', 'en')),
    is_master BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, owner_id)
);
CREATE UNIQUE INDEX career_document_master ON career_document(owner_id) WHERE is_master;
CREATE INDEX career_document_owner ON career_document(owner_id, created_at);
ALTER TABLE competency_claim ADD COLUMN source_document_id UUID;
ALTER TABLE competency_claim ADD COLUMN source_quote TEXT CHECK (length(source_quote) BETWEEN 1 AND 1000);
ALTER TABLE competency_claim ADD FOREIGN KEY (source_document_id, owner_id)
    REFERENCES career_document(id, owner_id) ON DELETE SET NULL (source_document_id);
ALTER TABLE competency_claim_revision ADD COLUMN source_document_id UUID;
ALTER TABLE competency_claim_revision ADD COLUMN source_quote TEXT CHECK (length(source_quote) BETWEEN 1 AND 1000);
ALTER TABLE competency_claim_revision ADD FOREIGN KEY (source_document_id, recorded_by)
    REFERENCES career_document(id, owner_id) ON DELETE SET NULL (source_document_id);
