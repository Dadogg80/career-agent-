# ADR-0001: Modular monolith med Kotlin/Spring Boot

Status: Accepted — føring fra brukerens produktvisjon, ikke implementert.

## Kontekst

Produktet trenger tydelige domenegrenser og reell Spring-erfaring, samtidig som pilot og drift må være enkle.

## Beslutning

Start med modular monolith, Kotlin/Spring Boot og PostgreSQL. Bruk Next.js/React/TypeScript som ønsket frontend. Ikke start med microservices eller Kubernetes.

## Alternativer

Node/NestJS ville redusert læringskostnaden, men oppfyller ikke Spring-læringsmålet like godt. Microservices ville økt distribusjons- og driftskostnaden uten dokumentert pilotbehov.

## Konsekvenser

Modulgrenser må håndheves selv om data ligger i én database. Arbeidsprosesser kan senere skilles ut når ressurs- eller lastbehov tilsier det. Verktøyversjoner og eksakte modulgrenser er ennå ikke vedtatt.
