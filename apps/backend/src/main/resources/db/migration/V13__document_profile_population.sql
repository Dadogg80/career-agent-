-- Documentary confirmation records what a source declares; it is not a personal attestation.
ALTER TABLE competency_claim ADD COLUMN confirmation_basis VARCHAR(16) NOT NULL DEFAULT 'NONE'
    CHECK (confirmation_basis IN ('NONE','USER','DOCUMENT'));
ALTER TABLE competency_claim_revision ADD COLUMN confirmation_basis VARCHAR(16) NOT NULL DEFAULT 'NONE'
    CHECK (confirmation_basis IN ('NONE','USER','DOCUMENT'));
UPDATE competency_claim SET confirmation_basis='USER' WHERE status='CONFIRMED';
UPDATE competency_claim_revision SET confirmation_basis='USER' WHERE status='CONFIRMED';
ALTER TABLE competency_claim ADD CHECK ((status='CONFIRMED') = (confirmation_basis<>'NONE'));
DO $$ DECLARE item RECORD; BEGIN
    FOR item IN SELECT conname FROM pg_constraint
        WHERE conrelid='competency_claim_revision'::regclass AND contype='c'
        AND pg_get_constraintdef(oid) LIKE '%action%'
    LOOP EXECUTE format('ALTER TABLE competency_claim_revision DROP CONSTRAINT %I',item.conname); END LOOP;
END $$;
ALTER TABLE competency_claim_revision ADD CHECK (action IN ('MANUAL_ENTRY','CONTENT_EDIT','USER_CONFIRMATION','USER_REJECTION','DOCUMENT_IMPORT'));
ALTER TABLE competency_claim_revision ADD CHECK (
    (action IN ('MANUAL_ENTRY','CONTENT_EDIT') AND status='UNVERIFIED' AND confirmation_basis='NONE') OR
    (action='USER_CONFIRMATION' AND status='CONFIRMED' AND confirmation_basis='USER') OR
    (action='USER_REJECTION' AND status='REJECTED' AND confirmation_basis='NONE') OR
    (action='DOCUMENT_IMPORT' AND status='CONFIRMED' AND confirmation_basis='DOCUMENT'));

-- A deleted target leaves a tombstone: another analysis cannot resurrect it automatically.
CREATE TABLE document_profile_import (
    owner_id UUID NOT NULL REFERENCES career_profile(owner_id) ON DELETE CASCADE,
    kind VARCHAR(8) NOT NULL CHECK(kind IN ('CLAIM','ENTRY')),
    fingerprint CHAR(64) NOT NULL,
    claim_id UUID,
    entry_id UUID,
    PRIMARY KEY(owner_id,kind,fingerprint),
    FOREIGN KEY(claim_id,owner_id) REFERENCES competency_claim(id,owner_id) ON DELETE SET NULL(claim_id),
    FOREIGN KEY(entry_id,owner_id) REFERENCES career_entry(id,owner_id) ON DELETE SET NULL(entry_id),
    CHECK ((kind='CLAIM' AND entry_id IS NULL) OR (kind='ENTRY' AND claim_id IS NULL))
);
