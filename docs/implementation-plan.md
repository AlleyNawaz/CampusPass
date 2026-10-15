# CampusPass implementation plan

Status vocabulary is strict: **planned**, **mocked**, **implemented**, **tested**, **deployed**, and **approved** are distinct. Nothing in this repository is deployed or institutionally approved.

## Product understanding

CampusPass is a tenant-aware campus event operating system. Its trust-critical path is: an authorized organizer publishes an approved event; an eligible attendee receives a capacity-backed ticket; an assigned gate operator redeems its opaque credential exactly once; all state changes remain auditable. The initial delivery is web-first and a modular monolith. Payment and offline scanning remain disabled until their legal, provider, and operational dependencies are resolved.

## Dependency graph

```mermaid
flowchart LR
  A[Discovery and approvals] --> B[ADRs and repository]
  B --> C[Tenant identity and authorization]
  C --> D[University and society onboarding]
  D --> E[Event approval and publication]
  E --> F[Ticket inventory]
  F --> G[Free registration and issuance]
  G --> H[Online scanner and admissions]
  H --> I[Pilot hardening]
  I --> J[Approved payment design]
  J --> K[Payments, ledger, reconciliation]
  K --> L[Refunds, transfers, waitlists]
  I --> M[Native apps]
  K --> N[Multi-university scale]
```

## Milestones

| Milestone                      | Depends on                    | Exit evidence                                                                      | Rollback                                                  |
| ------------------------------ | ----------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Sprint 0: discovery/foundation | Founder input where available | ADRs, assumptions, risk register, repo, CI commands, local health check, tests     | Delete local checkout/database volume; no external state  |
| Sprint 1: tenant identity      | Sprint 0 decisions            | Real sessions, verification lifecycle, role/tenant tests, accessible account UI    | Disable identity flag; backward-compatible DB rollback    |
| Sprint 2: event lifecycle      | Sprint 1                      | Draft/approval/publication slice, tenant-safe discovery, state tests               | Unpublish/disable event writes; retain audit history      |
| Sprint 3: free ticketing       | Sprint 2                      | Transactional inventory, zero-value order, opaque credential, wallet               | Disable registrations; expire holds; do not delete orders |
| Sprint 4: online admissions    | Sprint 3                      | Scoped scanner, atomic redeem, duplicate race test, reports                        | Revoke assignments and scanner flag; preserve admissions  |
| Sprint 5: pilot readiness      | Sprint 4 plus permission      | Load/accessibility/security evidence, runbooks, dry run                            | Kill switches; return to manual admission plan            |
| Sprint 6: paid tickets         | Legal/provider approvals      | Verified sandbox/live separation, signed webhooks, balanced ledger, reconciliation | Paid flag off; stop intents; reconcile pending states     |
| Sprint 7+: expansion           | Earlier gates                 | Refunds/transfers/mobile/analytics per gated backlog                               | Per-feature flags and additive migrations                 |

## Current Sprint 0 backlog

| ID    | Work                                   | Owner role          | Risk     | Effort | Dependency | Acceptance                                                           |
| ----- | -------------------------------------- | ------------------- | -------- | ------ | ---------- | -------------------------------------------------------------------- |
| S0-01 | Assumptions and decisions register     | Product lead        | High     | S      | None       | Every unknown has owner, impact, evidence, due date, default         |
| S0-02 | Architecture and data ADRs             | Principal architect | High     | M      | S0-01      | Modular monolith, tenancy, Prisma, auth boundary documented          |
| S0-03 | Monorepo and repository contract       | Platform engineer   | Medium   | M      | S0-02      | Required directories exist with local commands/ownership             |
| S0-04 | Local PostgreSQL and initial migration | Data engineer       | High     | L      | S0-02      | Core keys, constraints, indexes, rollback notes, deterministic seed  |
| S0-05 | Shared API contracts                   | API engineer        | High     | M      | S0-02      | Zod schemas and typed error/result envelopes test successfully       |
| S0-06 | Free-ticket domain kernel              | Backend engineer    | Critical | L      | S0-04/05   | 100 buyers for 10 units issue exactly 10 tickets in race test        |
| S0-07 | Atomic admission domain kernel         | Backend/security    | Critical | L      | S0-04/05   | 100 scans produce one successful admission; QR contains no PII       |
| S0-08 | Tenant authorization baseline          | Security engineer   | Critical | M      | S0-05      | Cross-tenant access is denied without revealing resource existence   |
| S0-09 | Public web shell                       | Web/accessibility   | Medium   | M      | S0-03      | 360px responsive, keyboard focus, reduced motion, honest trust copy  |
| S0-10 | Verification evidence                  | QA/SRE              | High     | M      | All above  | Exact commands/results recorded; limitations and rollback documented |

## Vertical-slice acceptance boundary

Sprint 0's API endpoints use real PostgreSQL transactions when a database is configured, but identity is deliberately development-only and synthetic. That means the slice may be exercised locally but is not a production authentication implementation. Email delivery is not silently mocked: verification mail is not implemented and its provider is marked disabled.
