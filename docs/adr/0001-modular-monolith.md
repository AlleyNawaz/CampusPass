# ADR 0001: Modular monolith and web-first delivery

- Status: accepted for foundation
- Date: 2026-10-15

## Context

CampusPass has strict transactional boundaries across inventory, orders, tickets, and admissions. The team and verified demand do not justify distributed services.

## Decision

Use a TypeScript monorepo with separately deployable web, API, and worker applications but one domain-oriented API codebase and one PostgreSQL authority. Introduce service boundaries only after measured scaling or organizational need.

## Consequences

Transactions and authorization are easier to reason about. Modules must still avoid cross-domain table access except through defined application services. Later extraction is possible via the outbox and versioned contracts.
