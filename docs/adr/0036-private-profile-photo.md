# ADR 0036: Private profile photo and compact identity

- Status: Accepted for the local pilot
- Date: 2026-10-09

## Context

The profile page needs a compact identity area that uses available space more purposefully and supports a candidate-selected photo. A photo is personal data, not career evidence or an AI input. The existing owned name/language profile and explicit review rules remain unchanged.

## Decision

Show a responsive identity card with initials when no photo exists, plus name, preferred profile language, privacy status and revision. Keep name/language editing in a collapsible settings area. An optional photo can be locally previewed, explicitly saved or removed; unsupported inputs are rejected with a clear error.

Accept only JPG/PNG files up to 2 MB. Check the actual decoded format, dimensions (maximum 4096 on either axis and four million pixels) and readability on the backend. Normalize accepted images to a centered 512 × 512 JPEG of at most 500 KB. Store one image per existing profile owner in PostgreSQL; deleting a profile cascades to its photo. Serve it only through authenticated owner-bound endpoints with `no-store` and `nosniff`. Same-origin frontend proxies enforce CSRF on writes and forward no browser-supplied owner identifier.

Photo upload/removal does not increment the name/language revision and is not included in any AI request, diagnostic event, cookie, local storage or public advertisement endpoint. The card and photo controls are available only to the authenticated owner.

## Consequences and limits

This adds a Flyway migration and image processing to the existing backend, but no new dependency or paid service. The original photo bytes are not retained; only the normalized derivative is stored. Profile personalization remains intentionally limited to existing name/language and this optional photo. Broader visibility, job-search and AI preferences need explicit data, ownership and privacy design before implementation. Production identity, retention/export policy and public hosting remain separate work.
