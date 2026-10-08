CREATE TABLE cv_version (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    job_id UUID,
    title VARCHAR(200) NOT NULL,
    content JSONB NOT NULL,
    status VARCHAR(20) NOT NULL CHECK(status IN ('DRAFT','APPROVED')),
    revision BIGINT NOT NULL CHECK(revision > 0),
    template_version VARCHAR(40) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMPTZ,
    artifacts JSONB NOT NULL,
    UNIQUE(id,owner_id),
    FOREIGN KEY(job_id,owner_id) REFERENCES saved_job(id,owner_id) ON DELETE RESTRICT,
    CHECK ((status='DRAFT' AND approved_at IS NULL) OR (status='APPROVED' AND approved_at IS NOT NULL))
);
CREATE INDEX cv_version_owner ON cv_version(owner_id,created_at DESC);

-- Keep failed file cleanup retryable without retaining the deleted CV contents.
CREATE TABLE cv_file_cleanup (
    object_id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
