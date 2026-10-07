# ADR-0002: Inferens er ikke bekreftet erfaring

Status: Accepted — sentralt eksplisitt produktprinsipp, ikke implementert.

## Kontekst

Dokumenter og AI kan inneholde feil, mangler og sannsynlige slutninger. Produktet skal representere kandidatens reelle erfaring.

## Beslutning

Skill UNVERIFIED, INFERRED, CONFIRMED og REJECTED. Bevar kilde og bekreftelsesgrunnlag. AI-ekstraksjon eller inferens skal ikke automatisk bli bekreftet erfaring. PostgreSQL er system of record; vector-data er retrieval.

## Alternativer

En fri chat-memory eller automatisk bekreftelse av ekstrahert innhold ville gitt mindre friksjon, men dårligere kontroll og etterprøvbarhet.

## Konsekvenser

Gjennomgang og avklaring er produktfunksjoner, ikke ekstra administrasjon. Manglende dokumentasjon må skilles fra faktisk kompetansegap. Detaljer om revisjoner og eksportpolicy er foreløpige forslag i DOMAIN.md.
