CREATE TABLE competency_claim (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    skill TEXT NOT NULL CHECK (length(skill) BETWEEN 1 AND 120),
    statement TEXT NOT NULL CHECK (length(statement) BETWEEN 1 AND 1000),
    context TEXT NOT NULL CHECK (length(context) BETWEEN 1 AND 500),
    source_note TEXT NOT NULL CHECK (length(source_note) BETWEEN 1 AND 500),
    status VARCHAR(16) NOT NULL CHECK (status IN ('UNVERIFIED', 'INFERRED', 'CONFIRMED', 'REJECTED')),
    revision BIGINT NOT NULL CHECK (revision >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, owner_id)
);
CREATE INDEX competency_claim_owner ON competency_claim(owner_id, created_at);

CREATE TABLE competency_claim_revision (
    claim_id UUID NOT NULL,
    revision BIGINT NOT NULL CHECK (revision >= 1),
    recorded_by UUID NOT NULL,
    skill TEXT NOT NULL CHECK (length(skill) BETWEEN 1 AND 120),
    statement TEXT NOT NULL CHECK (length(statement) BETWEEN 1 AND 1000),
    context TEXT NOT NULL CHECK (length(context) BETWEEN 1 AND 500),
    source_note TEXT NOT NULL CHECK (length(source_note) BETWEEN 1 AND 500),
    status VARCHAR(16) NOT NULL CHECK (status IN ('UNVERIFIED', 'INFERRED', 'CONFIRMED', 'REJECTED')),
    action VARCHAR(20) NOT NULL CHECK (action IN ('MANUAL_ENTRY', 'CONTENT_EDIT', 'USER_CONFIRMATION', 'USER_REJECTION')),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (claim_id, revision),
    FOREIGN KEY (claim_id, recorded_by) REFERENCES competency_claim(id, owner_id) ON DELETE CASCADE,
    CHECK ((action IN ('MANUAL_ENTRY', 'CONTENT_EDIT') AND status = 'UNVERIFIED')
        OR (action = 'USER_CONFIRMATION' AND status = 'CONFIRMED')
        OR (action = 'USER_REJECTION' AND status = 'REJECTED'))
);
