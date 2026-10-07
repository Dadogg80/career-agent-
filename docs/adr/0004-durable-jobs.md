# ADR-0004: Varige databasejobber før Kafka og Temporal

Status: Proposed.

## Kontekst

AI- og dokumentjobber må tåle restart. Pilotens kostnad og kompleksitet må holdes lav.

## Forslag

Registrer jobber transaksjonelt i PostgreSQL med lease, retry og idempotens. Lagre venting på bruker som prosesstilstand. Innfør broker/outbox-distribusjon eller Temporal når reelle behov overstiger dette.

## Alternativer

In-memory async mister arbeid ved crash. Kafka fra dag én tilfører drift, men løser ikke alene varige human-in-the-loop-flyter. Temporal gir kraftig orkestrering, men øker plattformomfanget.

## Konsekvenser

Jobbmekanismen må testes for crash og duplikater. Ikke bygg et generisk workflow-produkt. Kafka blir relevant ved flere uavhengige konsumenter og replay-behov; Temporal ved vesentlig kompleksitet i langvarige prosesser.
