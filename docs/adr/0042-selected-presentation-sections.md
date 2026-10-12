# ADR 0042: Explicit selected presentation sections

Status: accepted, 2026-10-12.

The latest saved synthesis is an AI draft and can change on reanalysis. Store one owned revisioned presentation per language with at most one selected wording snapshot per supported kind. Explicit selection reads the current completed owned workflow, verifies its original source and run revision, and rejects concurrent presentation changes. The browser submits only references and revisions; text, sources and model identities come from the server.

Snapshot wording, source excerpts/names and AI selections are retained independently of the current run. New analysis does not overwrite selection. Existing summary editing saves the draft; Use/Replace explicitly adopts its saved wording. No new AI calls, competency promotion or CV_READY status. Original deletion retains disclosed presentation references; deleting the career profile cascades presentation storage.

Limits: no separate presentation history/removal UI or freeform presentation editor in this slice. Edit the available source summary then explicitly replace. Old source runs may be replaced by reanalysis; their selected snapshots remain readable. Dedicated Documents navigation is next, followed by generated tailored artifacts and independent final review.
