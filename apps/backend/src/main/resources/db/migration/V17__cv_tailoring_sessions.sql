CREATE TABLE cv_tailoring_session (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    job_id UUID NOT NULL,
    snapshot JSONB NOT NULL,
    reviews JSONB NOT NULL DEFAULT '[]'::jsonb,
    revision BIGINT NOT NULL DEFAULT 1 CHECK (revision > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id, owner_id) REFERENCES saved_job(id, owner_id) ON DELETE CASCADE
);
CREATE INDEX cv_tailoring_session_latest ON cv_tailoring_session(owner_id, job_id, created_at DESC);
