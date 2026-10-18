# CampusPass Product Implementation Status

Assessment date: 2026-10-17
Basis: source, migrations, tests, and user journeys in this repository. A database model or isolated service is not counted as a completed product feature.

## Status definitions

- **Working:** connected frontend/API/database path exists and has proportionate automated verification.
- **Partial:** meaningful implementation exists, but a required path, UI, integration, or verification is missing.
- **Not implemented:** no usable end-to-end product path exists.
- **Externally blocked:** code alone cannot complete the feature without an approved provider, institution, credential, or device environment.

## Current product surface

| Capability                        | Status                               | Evidence and limitation                                                                                                                                                                                                      |
| --------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Password login and secure session | Working                              | Argon2id, opaque HttpOnly session, CSRF cookie/header, expiry, revocation, lockout, rate limits, and real HTTP security coverage.                                                                                            |
| Privileged MFA                    | Working with recovery gap            | TOTP enrollment and verification work. Recovery codes/admin recovery are not implemented.                                                                                                                                    |
| Invitation student registration   | Working                              | Single-use, server-scoped invitation registration now has a connected web form. Invitation issuance/delivery UI is missing.                                                                                                  |
| Email verification                | Partial                              | Possession of a server-issued invitation verifies the invited address. A transactional email provider, resend flow, and independent verification-link lifecycle do not exist.                                                |
| Password reset                    | Not implemented                      | No reset token lifecycle, delivery path, or UI.                                                                                                                                                                              |
| Student account settings          | Working for profile/password         | Authenticated student can update display name, locale, and timezone, or change a verified current password. Changes are CSRF-protected and audited; password change revokes other sessions. Email change is not implemented. |
| Student dashboard                 | Partial                              | Connected dashboard shows real ticket/order data and account totals. Booking from event pages and scannable QR rendering are not yet connected.                                                                              |
| Public event discovery            | Partial                              | Published public events are listed. Search, filters, pagination, university selector, details, and availability are missing.                                                                                                 |
| Free ticket issuance              | Backend working                      | Serializable, idempotent issuance with inventory enforcement exists. No connected checkout UI yet.                                                                                                                           |
| Ticket wallet                     | Partial                              | Dashboard returns tenant-scoped tickets and active opaque credentials. QR rendering, ticket detail, cancellation, and transfer are missing.                                                                                  |
| Online admission                  | Backend working                      | Assigned scanner, event/gate/session scope, atomic transition, duplicate detection, and audit record exist. Scanner UI is absent.                                                                                            |
| Organizer product                 | Not implemented                      | Core society/event entities exist, but there are no organizer CRUD/workflow endpoints or pages.                                                                                                                              |
| University administration         | Not implemented                      | Roles and tenant isolation exist; approval, policy, reporting, and audit interfaces do not.                                                                                                                                  |
| Platform administration           | Not implemented                      | Platform role exists; management and oversight workflows do not.                                                                                                                                                             |
| Payments                          | Externally blocked / not implemented | Paid-ticket flag is off. No approved provider, webhook, ledger, refunds, or reconciliation.                                                                                                                                  |
| Notifications and reminders       | Not implemented                      | Outbox persistence exists, but no dispatcher, provider, preferences, inbox, or reminder scheduler.                                                                                                                           |
| Mobile applications               | Not implemented                      | `apps/mobile` is a package placeholder only.                                                                                                                                                                                 |

## Architecture already present

- npm/Turborepo monorepo with Next.js web, NestJS API, Prisma/PostgreSQL, shared contracts/domain/validation packages, and placeholders for worker/mobile.
- Tenant-aware schema for universities, campuses, societies, venues, events, inventory, orders, tickets, staff, admissions, audit events, outbox, and idempotency.
- PostgreSQL RLS with forced policies on tenant-owned operational tables and an application-role verification guard in production.
- Backend-derived RBAC, trusted-origin CSRF defense, strict request schemas, restrictive CORS, body limits, security headers, endpoint rate limits, secure error envelopes, and disabled production Swagger/source maps.
- Serializable free-ticket issuance, encrypted QR credentials, and atomic online redemption.

## Broken or incomplete journeys

1. A student can accept a valid invitation, sign in, and change a known password, but cannot request an invitation or recover a forgotten password.
2. A student can discover a list of events, but cannot open an event detail or complete registration from the web.
3. Issued tickets are visible in the dashboard, but no standards-compliant QR is rendered.
4. A gate operator can call the secure redemption API, but has no camera/scanner interface or session setup flow.
5. Organizer/admin roles authenticate, but have no usable product surface beyond the generic account view.
6. Outbox records are written, but no worker dispatches notifications.

## Remaining production blockers

- Approved university pilot, domain/identity policy, privacy/legal retention decisions, and operational ownership.
- Transactional email provider and verified sender domain.
- MFA recovery design, password reset, session/device management, and user-support procedures.
- Managed secrets, private networking, backups/restore drills, monitoring/alerting, WAF/edge controls, and non-root production images.
- Browser/device E2E coverage, accessibility audit, load testing, and independent penetration review.
- Approved payment-provider contract and verified sandbox/live integration before paid tickets.
- Real iOS/Android builds and physical-device testing before store-readiness claims.

CampusPass is not approved for production at this stage.

## Verification performed for this increment

The new student slice was exercised on 2026-10-18 against a disposable PostgreSQL 16 database with all five existing migrations applied. The API connected using `SET ROLE campuspass_app`, which is configured `NOSUPERUSER NOBYPASSRLS`.

| Check                          | Observed result                                             |
| ------------------------------ | ----------------------------------------------------------- |
| API unit tests                 | 10 files, 24 tests passed                                   |
| API and web TypeScript checks  | Passed                                                      |
| API production build           | Passed                                                      |
| Web production build           | Passed; `/register`, `/dashboard`, and `/account` generated |
| Student login                  | HTTP 200                                                    |
| Tenant-scoped dashboard        | HTTP 200 with synthetic profile and zero initial records    |
| CSRF-protected profile update  | HTTP 200                                                    |
| Same update without CSRF token | HTTP 403                                                    |
| Free booking                   | HTTP 201, `CONFIRMED`, one ticket issued                    |
| Wallet after booking           | HTTP 200; one active ticket, upcoming event, and booking    |

These checks verify the implemented slice, not the missing password-reset/email-delivery journey or overall production readiness.
