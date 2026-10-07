# Docker strategy

Status: PostgreSQL Compose is implemented; backend/frontend still run natively. No application Dockerfiles are implemented. See [POSTGRES_SETUP.md](POSTGRES_SETUP.md).

## Initial development on Apple M1 / 16 GB

Run Node/Next.js and the JDK/Spring Boot directly on macOS. Add PostgreSQL through Docker Compose when persistence is introduced. This keeps hot reload and debugging straightforward while limiting VM memory usage.

Use native ARM64 images where available. Avoid assuming that an x86_64 image will run efficiently under emulation. Inspect the existing container runtime before installing another one. Docker Desktop licensing depends on the intended use; Colima is an alternative to evaluate.

## Appropriate uses

- PostgreSQL with pinned versions and a persistent volume.
- Disposable databases for integration tests with Testcontainers.
- A later isolated document conversion worker with resource limits.
- Reproducible backend/frontend deployment images when deployment is needed.
- Kafka/Redpanda and Temporal for local development only after their workloads justify them.

Compose can later start the entire application, but it is not required for the current advertisement extraction screen. Container packaging does not require Kubernetes.

## Tradeoffs

Benefits: repeatable service setup, isolated dependencies, straightforward cleanup of disposable test resources, and deployable artifacts.

Costs: Linux VM overhead on macOS, image/cache disk usage, file-watching quirks, additional networking/debugging, and architecture compatibility. Containers do not guarantee security or backup; persistent data must have its own backup and access policy.

Keep any local Ollama experiment native on macOS for Metal support. Never bake API keys into image layers or Compose files committed to Git. Pass secrets at runtime.
