CREATE TABLE career_presentation (
 owner_id UUID NOT NULL REFERENCES career_profile(owner_id) ON DELETE CASCADE,
 locale VARCHAR(2) NOT NULL CHECK (locale IN ('nb','en')),
 revision BIGINT NOT NULL CHECK (revision > 0),
 content JSONB NOT NULL CHECK (jsonb_typeof(content) = 'object' AND octet_length(content::text) <= 500000),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (owner_id, locale)
);
