# ADR-0009: TanStack Query and shadcn/ui

Status: Accepted. Date: 2026-10-07.

## Context and decision

The user explicitly requests TanStack and shadcn and a substantial improvement in information presentation. Interpret TanStack as TanStack Query for asynchronous server state and mutations. Keep Next.js routing; Router/Table are unnecessary for this slice. Use official shadcn new-york registry components (Button, Card, Input, Textarea, Badge, Alert), committed locally with components.json, Tailwind CSS and Lucide icons.

## Interaction design

Present an input/review column and a result column, stacked on mobile. Separate URL retrieval from AI analysis. Show actual requirement counts and source quotes; never simulate match percentages, navigation or workflow progress. Provide visible errors, keyboard focus, associated labels and bilingual copy. Evidence remains inspectable.

## Consequences

Components are owned in the repository and need explicit maintenance. Source-derived registry code was adapted with Card data-slot attributes for styling. Native language selection and details/summary remain appropriate accessible primitives. Added dependencies are limited to query state, styling and the chosen components; no complete design framework or additional router is introduced. AI mutations never retry automatically. No private content is persisted in browser storage; language preference is the only persisted setting.
