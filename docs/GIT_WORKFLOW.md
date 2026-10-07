# Git-arbeidsflyt

Status: Valgt arbeidsmåte for dokumentasjon under brukerens instruksjon om å fortsette selvstendig. Ingen branch protection er konfigurert.

- `main` inneholder publisert prosjektgrunnlag og senere gjennomgått kode.
- Korte branches som `docs/architecture-foundation` og `feat/career-profile` brukes til sammenhengende endringer.
- Ingen permanent `development` nå; én pilot og små leveranser trenger ikke et separat integrasjonsløp.
- Bruk pull requests når GitHub-verktøytilgang tillater det. Publisert branch er ikke det samme som en opprettet eller godkjent PR.
- Ikke force-push, overskriv remote historikk eller slett andres branches.
- Før commit: undersøk diff, kontroller dokumentasjon og kjør relevante tester når kode finnes.
- Før push: inkluder bare tilsiktede filer og kontroller at persondata/hemmeligheter ikke inngår.

Første dokumentasjonsgrunnlag ble publisert direkte til `main` fordi repositoriet var tomt. Senere arkitekturarbeid publiseres på egen branch.

Commit er lokal historikk; push publiserer historikken til GitHub. Codex «Save and publish» publiserer miljøkonfigurasjon/snapshot og erstatter ingen av disse operasjonene.
