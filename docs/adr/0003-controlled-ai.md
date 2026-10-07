# ADR-0003: Applikasjonen styrer AI-arbeidsflyten

Status: Proposed.

## Kontekst

Capabilities deler kandidatgrunnlag og må produsere sporbare forslag uten ukontrollerte effekter.

## Forslag

Bruk eksplisitte applikasjonssteg med strukturerte modellresultater. Domenekommandoer validerer resultatene. AI får ikke direkte database- eller innsendingsrettigheter. Provider ligger bak en adapter.

## Alternativer

Autonome agenter som delegerer fritt kan være fleksible, men gjør kostnad, tilgang og årsaksforklaring vanskeligere. Hardkodet provider i domenet gjør testing og leverandørbytte vanskelig.

## Konsekvenser

Mer eksplisitt orkestreringskode, men bedre kontroll. Evaluer faktisk modellkvalitet separat fra tester med mocks. Provider og kjøreform gjenstår.
