CREATE TABLE application_case (
 id UUID PRIMARY KEY,
 owner_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 job_id UUID NOT NULL,
 job_title VARCHAR(200) NOT NULL,
 cv_version_id UUID,
 content JSONB NOT NULL,
 history JSONB NOT NULL,
 revision BIGINT NOT NULL CHECK(revision>0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(owner_id,job_id),
 FOREIGN KEY(job_id,owner_id) REFERENCES saved_job(id,owner_id) ON DELETE RESTRICT,
 FOREIGN KEY(cv_version_id,owner_id) REFERENCES cv_version(id,owner_id) ON DELETE RESTRICT
);
CREATE INDEX application_case_owner ON application_case(owner_id,updated_at DESC);
