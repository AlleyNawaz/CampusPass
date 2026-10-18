# CampusPass Dependency-Aware Development Roadmap

## Delivery rules

Each sprint must ship a connected vertical slice: schema/migration where needed, backend authorization, frontend/mobile behavior, negative tests, database-backed critical-path tests, typecheck/lint/build, and updated product/security documentation. Features remain partial until their actual user journey is verified. Public deployment requires separate approval.

## Sprint plan

### Sprint 1 — Authentication and student foundation

Dependencies: existing secure authentication and RLS foundation.

Scope:

- Invitation registration UI, login/MFA/logout, protected dashboard routing, session-expiry handling.
- Student dashboard backed by tenant-scoped ticket/order data.
- Profile settings with CSRF protection and audit logging.
- Password reset and provider-backed email verification/resend.
- Authentication browser tests and database-backed authorization tests.

Current outcome: registration UI, dashboard API/UI, richer session profile, and audited settings are implemented in this increment. Password reset, transactional email delivery, browser automation, and database-backed tests remain before Sprint 1 can be closed.

### Sprint 2 — Event discovery and event management core

Dependencies: active-university catalog and authenticated organizer context.

- Search/filter/pagination, university selector, event detail, availability.
- Society profile and event draft/edit/submit endpoints and organizer pages.
- Approval state transitions with immutable audit history.
- Event/ticket validation and cross-society/cross-university negative tests.

### Sprint 3 — Free registration and ticket wallet

Dependencies: published event details and active ticket tiers.

- Connected free checkout using idempotency keys and current policy version.
- Wallet ticket detail and standards-compliant QR rendering without PII.
- Booking history, cancellation rules, notifications, and reminders.
- Concurrency, limit, sold-out, replay, and browser E2E tests.

### Sprint 4 — QR scanning and admission operations

Dependencies: organizer staff assignments and issued credentials.

- Scanner session lifecycle, event/gate selection, mobile camera QR decoding.
- Online verification, live counters, clear outcomes, and operator audit trail.
- Physical-device, permission-denial, duplicate, cancelled, wrong-event/gate, and concurrency tests.
- Offline mode stays disabled.

### Sprint 5 — Organizer dashboard and analytics

Dependencies: event and admission workflows.

- Society onboarding/profile, team permissions, scanner management.
- Registration/attendee views, sales and attendance analytics, cancellation.
- CSV export with authorization, formula-injection defense, and audit logging.

### Sprint 6 — University and platform administration

Dependencies: complete organizer workflows and approval model.

- Tenant-scoped university approvals, monitoring, policy, roles, audit, analytics.
- Platform onboarding, cross-tenant oversight, support, users, security visibility, feature configuration.
- Step-up MFA for sensitive actions and exhaustive privilege/tenant tests.

### Sprint 7 — Payment architecture and approved provider

Dependencies: merchant-of-record decision, legal/finance approval, provider contract and sandbox credentials.

- Provider abstraction, server-created checkout, signed/replay-safe webhooks, idempotent ledger.
- Refund authorization, reconciliation, reporting, failure recovery.
- Paid tickets remain disabled until independent sandbox verification succeeds.

### Sprint 8 — React Native / Expo mobile applications

Dependencies: stable versioned API/contracts and Sprint 3–4 browser workflows.

- Secure mobile session strategy, discovery, booking, wallet, notifications, profile, scanner.
- Shared contracts/validation, deep links, secure storage, accessibility, device tests.
- Store readiness requires signed builds, privacy disclosures, and real-device review.

### Sprint 9 — End-to-end and operational readiness

- Cross-role E2E matrix, load/concurrency, accessibility, browser/device compatibility.
- Monitoring, runbooks, backups/restore, incident response, key rotation, vulnerability review.
- Independent security assessment and explicit risk acceptance.

### Sprint 10 — NUST pilot preparation

Dependencies: written institutional authorization and named operational owners.

- Synthetic-to-approved pilot configuration, training, support, event dry runs, rollback criteria.
- Pilot launch checklist and measured success/safety thresholds.

## Immediate next work

1. Complete Sprint 1 password reset and transactional email architecture after selecting an approved provider or local Mailpit-compatible delivery path.
2. Add PostgreSQL-backed student dashboard/profile integration tests and Playwright browser coverage.
3. Begin Sprint 2 with public university catalog, event query contract, and event detail vertical slice.
