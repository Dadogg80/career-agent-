CREATE TABLE document_analysis (
    document_id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    result JSONB NOT NULL CHECK (jsonb_typeof(result) = 'object' AND octet_length(result::text) <= 200000),
    FOREIGN KEY (document_id, owner_id) REFERENCES career_document(id, owner_id) ON DELETE CASCADE
);
CREATE INDEX document_analysis_owner ON document_analysis(owner_id);
CREATE TABLE document_collection_analysis (
    owner_id UUID PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
    result JSONB NOT NULL CHECK (jsonb_typeof(result) = 'object' AND octet_length(result::text) <= 200000)
);
