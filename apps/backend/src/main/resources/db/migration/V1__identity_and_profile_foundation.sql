-- Identity bindings will be supplied by verified OIDC login, never by client input.
CREATE TABLE app_user (
    id UUID PRIMARY KEY,
    oidc_issuer TEXT NOT NULL CHECK (length(oidc_issuer) BETWEEN 1 AND 2048),
    oidc_subject TEXT NOT NULL CHECK (length(oidc_subject) BETWEEN 1 AND 512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (oidc_issuer, oidc_subject)
);

CREATE TABLE career_profile (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL UNIQUE REFERENCES app_user(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 200),
    preferred_language VARCHAR(2) NOT NULL DEFAULT 'nb' CHECK (preferred_language IN ('nb', 'en')),
    revision BIGINT NOT NULL DEFAULT 0 CHECK (revision >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
