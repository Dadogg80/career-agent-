ALTER TABLE career_document ADD COLUMN extraction_method VARCHAR(4) NOT NULL DEFAULT 'TEXT'
    CHECK (extraction_method IN ('TEXT', 'OCR'));
