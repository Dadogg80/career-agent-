# FINN title and diagnostic overlay hotfix

Base: `main`

Head: `fix/finn-wrapped-title-diagnostics`

Title: `Fix wrapped FINN titles and handled-error diagnostics`

Description:

```markdown
A valid FINN browser excerpt was rejected with SOURCE_NOT_AVAILABLE when the provider placed the entire `| FINN.no` suffix on a separate numbered line. Accept this precise title format while retaining exact-link argument/output checks and source-only extraction.

Log expected retrieval/provider failures with console.warn instead of console.error to prevent Next.js development mode from presenting a handled workflow failure as a runtime-error overlay. Preserve red diagnostic states, mapped codes, HTTP status, input and cooldown behavior.

Validation: 12 focused backend FINN tests and 7 development browser tests passed; executable JAR built. Live retrieval of the reported public FINN link succeeded through the real backend. Structured analysis was not rerun live, and no paid upgrade or automatic retry was introduced.
```

https://github.com/Dadogg80/career-agent-/compare/main...fix/finn-wrapped-title-diagnostics?expand=1
