CREATE TABLE saved_job (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    fingerprint CHAR(64) NOT NULL,
    snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (owner_id, fingerprint),
    UNIQUE (id, owner_id)
);
CREATE INDEX saved_job_owner ON saved_job(owner_id, created_at DESC);
