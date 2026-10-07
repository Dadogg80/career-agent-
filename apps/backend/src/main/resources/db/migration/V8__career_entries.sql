CREATE TABLE career_entry (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('UNVERIFIED', 'CONFIRMED', 'REJECTED')),
    revision BIGINT NOT NULL CHECK (revision >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, owner_id)
);
CREATE INDEX career_entry_owner ON career_entry(owner_id, created_at);
CREATE TABLE career_entry_revision (
    entry_id UUID NOT NULL,
    owner_id UUID NOT NULL,
    revision BIGINT NOT NULL CHECK (revision >= 1),
    snapshot JSONB NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (entry_id, revision),
    FOREIGN KEY (entry_id, owner_id) REFERENCES career_entry(id, owner_id) ON DELETE CASCADE
);
