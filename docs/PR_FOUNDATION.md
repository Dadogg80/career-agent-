# PR: Bilingual frontend and Spring Boot foundation

Base: `main`

Head: `feat/foundation`

Status: Published branch, ready for a pull request. This document does not create or merge a PR.

## Title

feat: add bilingual frontend and tested Spring Boot foundation

## Description

Add the first runnable application foundation: a Next.js welcome page with Norwegian as the default, persistent English language selection, and a connection to a Kotlin/Spring Boot backend. An unavailable service displays an error and a retry action.

The backend exposes system status and a limited health endpoint, binding to loopback by default. The frontend accesses it through a server-side route. Includes a checksum-verified Gradle wrapper, npm lockfile, CI workflow, run instructions, and updated project documentation.

Sync the branch with current main while preserving the existing `.env` ignore rule and `env_example` file. Resolve the `.gitignore` conflict without changing application behavior. Document English as the language for GitHub communication.

Validation completed in Codex:

- 2 backend integration tests passed, with no failures or skips.
- 3 Playwright tests passed against real services: Norwegian defaults, persistent English selection, and recovery after a simulated service failure.
- Next.js production build, TypeScript checks, and frozen npm installation passed.
- Gradle wrapper execution and the wrapper JAR checksum were verified.
- Runtime npm audit reported no known vulnerabilities at the time of the check.

GitHub Actions execution and local execution on the pilot's Mac have not been verified. Database, authentication, candidate profiles, and AI integration are not implemented. The Groq secret requirement is saved separately in the Codex environment draft; no key is committed and no Groq API calls have been made. No public deployment or paid service has been enabled.
