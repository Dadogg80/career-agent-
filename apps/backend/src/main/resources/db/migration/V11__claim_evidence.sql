CREATE TABLE competency_evidence (
 id UUID PRIMARY KEY,
 claim_id UUID NOT NULL REFERENCES competency_claim(id) ON DELETE CASCADE,
 owner_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 document_id UUID,
 statement TEXT NOT NULL CHECK(length(statement) BETWEEN 1 AND 1000),
 context VARCHAR(500) NOT NULL,
 original_name VARCHAR(120) NOT NULL,
 quote TEXT NOT NULL CHECK(length(quote) BETWEEN 1 AND 1000),
 quote_hash CHAR(64) NOT NULL,
 recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(claim_id,document_id,quote_hash),
 FOREIGN KEY(document_id,owner_id) REFERENCES career_document(id,owner_id) ON DELETE SET NULL(document_id)
);
CREATE INDEX competency_evidence_owner ON competency_evidence(owner_id,claim_id);
-- Preserve evidence already attached to imported claims.
INSERT INTO competency_evidence(id,claim_id,owner_id,document_id,statement,context,original_name,quote,quote_hash)
SELECT c.id,c.id,c.owner_id,c.source_document_id,c.statement,c.context,d.original_name,c.source_quote,encode(sha256(convert_to(c.source_quote,'UTF8')),'hex')
FROM competency_claim c JOIN career_document d ON d.id=c.source_document_id AND d.owner_id=c.owner_id
WHERE c.source_quote IS NOT NULL;
