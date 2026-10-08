CREATE TABLE document_analysis_run (
    owner_id UUID NOT NULL REFERENCES career_profile(owner_id) ON DELETE CASCADE,
    scope VARCHAR(36) NOT NULL,
    id UUID NOT NULL UNIQUE,
    revision BIGINT NOT NULL,
    lease_until TIMESTAMPTZ,
    state JSONB NOT NULL CHECK (jsonb_typeof(state) = 'object' AND octet_length(state::text) <= 12000000),
    PRIMARY KEY(owner_id, scope)
);
ALTER TABLE document_analysis DROP CONSTRAINT document_analysis_result_check;
ALTER TABLE document_analysis ADD CONSTRAINT document_analysis_result_check CHECK (jsonb_typeof(result) = 'object' AND octet_length(result::text) <= 1000000);
ALTER TABLE document_collection_analysis DROP CONSTRAINT document_collection_analysis_result_check;
ALTER TABLE document_collection_analysis ADD CONSTRAINT document_collection_analysis_result_check CHECK (jsonb_typeof(result) = 'object' AND octet_length(result::text) <= 1000000);

-- Evidence remains tied to the reviewed entry revision; deleting the original retains the disclosed quote.
CREATE TABLE career_entry_evidence (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    entry_id UUID NOT NULL,
    owner_id UUID NOT NULL,
    revision BIGINT NOT NULL CHECK(revision>0),
    document_id UUID,
    original_name VARCHAR(120) NOT NULL,
    quote VARCHAR(1000) NOT NULL,
    period_text VARCHAR(120) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(document_id,owner_id) REFERENCES career_document(id,owner_id) ON DELETE SET NULL (document_id),
    FOREIGN KEY(entry_id,owner_id) REFERENCES career_entry(id,owner_id) ON DELETE CASCADE,
    FOREIGN KEY(entry_id,revision) REFERENCES career_entry_revision(entry_id,revision) ON DELETE CASCADE,
    UNIQUE(entry_id,revision,document_id,quote)
);
CREATE INDEX career_entry_evidence_owner ON career_entry_evidence(owner_id,entry_id);
