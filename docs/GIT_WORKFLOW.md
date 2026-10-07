# Git workflow

Status: Current working convention. Branch protection has not been configured.

- Use English for commit messages, pull request titles and descriptions, issues, review comments, release notes, and branch names.
- Write new technical documentation and code comments in English. The application's default language remains Norwegian, with English supported.
- `main` contains the merged project baseline and subsequently reviewed code.
- Use short-lived branches such as `docs/architecture-foundation` and `feat/career-profile` for coherent changes.
- Do not introduce a permanent `development` branch yet.
- Use pull requests when GitHub tooling permits. A published branch does not mean a PR has been created or approved.
- The user creates and merges PRs when API access is unavailable. When a branch is ready, provide its base/head, an English title, and a complete English description including actual validation and limitations.
- Fetch main explicitly when necessary: some cloud checkouts only fetch HEAD, so a normal fetch can leave origin/main stale.
- Do not force-push, overwrite remote history, or delete other people's branches.
- Before committing, inspect the diff, check documentation, and run relevant tests for code changes.
- Before pushing, include only intended files and ensure personal data and secrets are excluded.

The initial documentation was published directly to `main` because the repository was empty. Subsequent changes use working branches.

A commit records local history; a push publishes it to GitHub. Codex environment Save and publish captures environment configuration and a filesystem snapshot; it replaces neither operation.
