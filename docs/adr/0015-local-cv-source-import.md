# ADR 0015: Local original CV retention and source selection

Status: Accepted for the single local pilot, 2026-10-07.

## Decision

Use an owned document module, a DocumentStorage port/local filesystem adapter and PostgreSQL metadata/extracted text. Support bounded DOCX main-body XML extraction with JDK ZIP/StAX, and PDF text extraction with pinned PDFBox 3.0.8. Retain original bytes; downloads are authenticated attachments. Choose a master original and document language explicitly.

Extract locally. The user selects an exact source excerpt and creates an UNVERIFIED statement; the server checks the excerpt against the owned extracted text. Do not send private CVs to the public Groq analysis endpoint or assume provider-data policies. Automatic AI discovery, OCR, layout-preserving generation and object storage in production are separate increments.

## Consequences

No paid infrastructure or new local services are required. One backend PDF dependency is justified by a real document format. The local adapter is not suitable as a multi-instance production store. Filesystem/PostgreSQL writes have compensation for ordinary failures but are not crash-atomic; reconciliation and backups are outstanding. The free single-user pilot is not an externally available document service.

## Subsequent local-pilot extension

ADR 0016 supersedes the private-AI deferral above following explicit owner authorization: optional reviewed-preview Groq summaries/proposals for one or multiple uploaded documents. Original retention/local extraction and production limitations remain unchanged.
