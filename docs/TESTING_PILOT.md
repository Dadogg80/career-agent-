# Test the advertisement-analysis pilot

Status: Ready for a local pilot test after checking out `feat/job-requirements` or merging its PR. Codex tests and live Groq checks do not establish that the application is already installed on the user's Mac.

## What is available

- Norwegian-first interface with English selection.
- Pasted advertisement text, 40–15,000 characters.
- Groq extraction of at most 12 requirements with source quotations.
- Required/preferred/unclear categories, error handling, and retained text after a failed call.
- A warning when the source changes after analysis.

This is advertisement extraction, not candidate matching. There is no candidate profile, score, CV upload, persistent storage, or login yet. Use public advertisements or fictional data only. Text is sent to Groq when Analyze is selected; the application does not persist it. Provider processing has its own terms.

## Start on your Mac

Prerequisites: ARM64 JDK 21, Node.js 24 and npm. Docker is not required for this screen. Do not assume Codex installations exist on your Mac.

From the repository root, start the backend:

```sh
cd apps/backend
./gradlew test bootJar
```

Configure `GROQ_API_KEY` securely in that terminal's process environment, then:

```sh
java -jar build/libs/career-agent-backend.jar
```

For Bash, a hidden prompt can set the key without putting the value in command history. Run `bash` first if using zsh, then enter:

```sh
read -r -s -p "Groq API key: " GROQ_API_KEY
printf '\n'
export GROQ_API_KEY
java -jar build/libs/career-agent-backend.jar
```

Use either launch approach, not both simultaneously. Codex secrets are not automatically transferred to your Mac. Do not save the real key in `env_example` or another tracked file.

In a second terminal, from the repository root:

```sh
cd apps/web
npm ci
npm run dev -- --hostname 127.0.0.1
```

Open the application on your Mac's loopback port 3000. This is a local test, not a deployed web link.

## First test

Paste this fictional advertisement:

> Vi søker kundebehandler. Du må snakke norsk og engelsk. Erfaring med kundeservice er en fordel. Arbeidet innebærer telefon og e-post.

Select **Analyser**. Verify that language skills are identified, quoted evidence actually appears in the source, and customer-service experience is desirable rather than mandatory. Review whether duties were incorrectly treated as candidate requirements; quotation matching cannot prove semantic correctness.

Switch to English and analyze an English advertisement. Check the output language, edit the source to see the outdated-result warning, and confirm that a failed call retains the pasted text.

## Limits and feedback

Default model: `openai/gpt-oss-20b`, configurable through backend `GROQ_MODEL`. There is no automatic fallback or plan upgrade. Availability and free quotas are controlled by Groq.

Default safety limit: 20 accepted analysis attempts per backend process, including failed attempts, and one in-flight call. Restart resets this limit; it is not a durable billing cap. `AI_MAX_REQUESTS` can reduce the limit. Output is bounded to 2,200 completion tokens per call. A limited smoke test does not establish complete Norwegian quality or prompt-injection resistance.

Report missing/incorrect requirements, misleading categories, invented labels, latency, and confusing UI. Avoid copying real private candidate data into GitHub issues.
