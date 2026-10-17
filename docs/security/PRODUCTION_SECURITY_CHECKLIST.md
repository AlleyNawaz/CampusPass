# CampusPass Production Security Checklist

Date: 2026-10-17

Unchecked items are release blockers unless formally risk-accepted. Current decision: **NOT APPROVED FOR PRODUCTION**.

## Authentication and API

- [x] Remove caller-controlled development identity.
- [x] Real invitation registration, Argon2id login, opaque sessions, revocation, and secure cookie configuration.
- [x] Backend RBAC; no self-service tenant/role mutation.
- [x] Session-bound CSRF and exact Origin checks.
- [x] Mandatory encrypted/replay-protected TOTP for privileged roles.
- [x] Endpoint-specific DB-backed rate limits and account lockout.
- [x] Strict request validation, body limits, sanitized errors/correlation IDs, restricted CORS, production-disabled Swagger.
- [ ] Recovery codes, independently verified account recovery, and phishing-resistant platform-admin MFA.
- [ ] Production monitoring/alerting and multi-instance/load validation.

## Database

- [x] Forced RLS on current tenant-owned business tables.
- [x] Runtime role verified non-superuser and non-`BYPASSRLS`.
- [x] Direct SQL and Prisma/API cross-tenant negative tests.
- [x] Constraints and real concurrent admission testing.
- [ ] Dedicated production LOGIN role and isolated migration owner provisioned by infrastructure.
- [ ] Narrow authentication-table access architecture and future society-specific RLS.
- [ ] Private networking, TLS validation, backups, point-in-time recovery, and restore drill.

## Infrastructure and secrets

- [x] No repository default DB/encryption credentials; local DB loopback-only.
- [x] Fail-closed production environment, feature-gate, DB-role, and RLS checks.
- [x] API/web security headers and nonce CSP.
- [x] API/browser source maps absent from production build artifacts.
- [ ] Approved secret manager, access policy, audit trail, and rotation rehearsal.
- [ ] Hardened non-root production images, read-only filesystem, dropped capabilities, signed artifacts/SBOM.
- [ ] Approved ingress/egress, TLS/HSTS edge validation, WAF, monitoring, incident response.

## Payments and ticketing

- [x] Live payments disabled; no mock verification or webhook route.
- [x] Free-ticket idempotency, conditional inventory, opaque encrypted QR, atomic redemption.
- [x] Real PostgreSQL duplicate-redemption race passed after retry remediation.
- [ ] Approved provider and exact raw-body signature verification.
- [ ] Webhook replay/event uniqueness, idempotent ledger, reconciliation.
- [ ] Refund/cancellation authorization and secure ticket-transfer workflow/tests.
- [ ] Production-scale concurrent purchase/failure-injection testing.

## Frontend and testing

- [x] Login, MFA setup/verify, protected-account UX, session-expiry handling, CSRF-safe requests, secure logout.
- [x] No auth token in browser storage and no unsafe HTML rendering.
- [x] Real HTTP and static security suites cover current surface and all 20 audit categories by implemented, negative, or explicitly pending evidence.
- [x] Local typecheck, lint, unit tests, security tests, migration verification, dependency audit, and production build executed.
- [ ] Interactive browser E2E in CI/staging.
- [ ] CI security gates, dependency/SBOM policy, independent review, and penetration test.

## Release approval

- [ ] All blockers completed or accepted by named risk owner with expiry.
- [ ] Security/backend/infrastructure/product evidence review completed.
- [ ] Explicit production deployment approval recorded.
