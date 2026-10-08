CREATE TABLE job_match_analysis (
    job_id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    result JSONB NOT NULL,
    FOREIGN KEY (job_id, owner_id) REFERENCES saved_job(id, owner_id) ON DELETE CASCADE
);
