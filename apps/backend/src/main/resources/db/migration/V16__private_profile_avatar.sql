CREATE TABLE career_profile_avatar (
    owner_id UUID PRIMARY KEY REFERENCES career_profile(owner_id) ON DELETE CASCADE,
    image_data BYTEA NOT NULL CHECK (octet_length(image_data) BETWEEN 1 AND 500000),
    media_type VARCHAR(16) NOT NULL CHECK (media_type = 'image/jpeg'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
