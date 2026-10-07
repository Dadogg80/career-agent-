# Local PostgreSQL foundation

Public job analysis still runs without Docker or PostgreSQL. The optional basic-profile screen and OIDC ownership are now implemented. To enable them, follow [IDENTITY_SETUP.md](IDENTITY_SETUP.md); this guide alone enables the database, not sign-in. Experience/CV remain future work.

## Start PostgreSQL

From the repository root, add `DATABASE_PASSWORD="your-own-local-password"` to the ignored `apps/backend/.env` file. Keep your existing `GROQ_API_KEY` there. Do not commit this file.

```sh
docker compose --env-file apps/backend/.env up -d --wait
```

The database binds to `127.0.0.1:5432`, uses database/user `career_agent` and retains data in the `career_postgres` named volume. If the port is occupied, add `DATABASE_PORT=5433` and `DATABASE_URL="jdbc:postgresql://127.0.0.1:5433/career_agent"` to the same file. Changing the password in configuration does not change credentials in an already initialized PostgreSQL volume.

## Run the backend with migrations

From the repository root (Java 21 must already be selected):

```sh
cd apps/backend
./gradlew test bootJar
set -a
source .env
set +a
SPRING_PROFILES_ACTIVE=persistence java -jar build/libs/career-agent-backend.jar
```

A normal `java -jar ...` without the persistence profile still starts the public-ad tool without a database. An unavailable database or missing password fails persistence startup. Flyway applies/validates checked-in migrations at startup; repeat startup does not recreate data. Health details remain hidden.

## Tests and stopping

`./gradlew test` now requires a running Docker daemon for two real PostgreSQL migration/integrity tests. They use a disposable Testcontainers database, not the Compose volume. Existing public endpoint tests remain database independent. CI runs them on Ubuntu with Docker. Migration tests verify constraints and cascade deletion; the added profile security suite verifies session access, issuer+subject ownership, CSRF, spoofed inputs and revision conflicts against a separate disposable database.

From the repository root:

```sh
docker compose --env-file apps/backend/.env stop
```

Stopping preserves data. Do not use `down -v` unless you intend to delete the development database. No automatic destructive reset is provided. Compose is local development infrastructure, not a production deployment.
