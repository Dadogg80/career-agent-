# ADR-0010: FINN source excerpts through Groq Browser Search

Status: Accepted for the local public-advertisement pilot. Date: 2026-10-07.

## Context

The user needs modern FINN links to work and demonstrated Groq Playground Browser Search. Direct website scraping was deliberately excluded in ADR-0008. Official Groq documentation confirms browser_search on GPT-OSS models, including the existing 20B model, and incompatibility with structured outputs.

## Decision

Add AdvertisementBrowser as a source port. Route validated canonical FINN job links to Groq's fixed API endpoint with the existing key/model. Enable browser_search only with low reasoning effort, 4,000 completion tokens and no automatic retries. Default to 10 search attempts per process, counting failures, with a backend disable flag. Keep structured requirement extraction separate and user-triggered after review.

Accept source text only from executed_tools browser.open records whose arguments and numbered URL header match the requested canonical advertisement. Discard generated final content and reasoning. Reject unavailable evidence, oversized payloads and incomplete API completion. Show GROQ_BROWSER_EXCERPT provenance before and after analysis. Provider excerpts may be partial/cached; do not represent them as a complete or independently verified original.

## Consequences and limits

The user's requested link works without another key, SDK, local browser worker or direct FINN scraper. Local validation limits what the backend submits and accepts; it cannot restrict the provider's internal navigation. Availability and current ad status are not guaranteed. Contact/private data should be removed before separate analysis. Public excerpts are transient, not persisted or logged.

Use the existing free-tier pilot account without upgrades or paid fallback. Separate attempt caps are not monetary billing guarantees and one attempt may cause multiple internal tool actions. Groq's pricing link redirected to its homepage during research; no production price guarantee is claimed. Source/provider reuse terms and billing controls need separate production assessment. This decision extends initial source coverage while preserving ADR-0008's official NAV adapter and no direct website scraping boundary.

## References verified

- https://console.groq.com/docs/tool-use/built-in-tools/browser-search
- https://console.groq.com/docs/tool-use/built-in-tools
- https://console.groq.com/docs/rate-limits
- https://console.groq.com/docs/billing-faqs

A live API response for the user-supplied public advertisement included browser.open source output separate from message.content. Test fixtures contain fictional excerpts only.
