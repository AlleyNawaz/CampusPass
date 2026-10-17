# CampusPass Security Remediation Report

Date: 2026-10-17
Decision: **NOT APPROVED FOR PRODUCTION**

## Phase results

### Phase 1 — authentication verification

- Implemented server-issued, single-use registration invitations. Invitations fix university, email, role, and scope; the caller supplies only the token, display name, and password.
- Provisioned PostgreSQL 16.15 in an isolated loopback-only temporary cluster and applied all five migrations.
- Verified real registration (201), invitation replay rejection (401), login (200), HttpOnly/SameSite cookies, CSRF rejection/acceptance, TOTP enrollment/authentication/replay rejection, idle expiry, logout revocation, and cross-tenant denial.
- A 20-request redemption race initially produced 18 serialization errors. Added bounded Prisma `P2034` retry handling and reran: one `ADMITTED`, 19 `ALREADY_USED`, zero errors.

Modified areas: `apps/api/src/auth`, `apps/api/src/platform/serializable-transaction.ts`, registration migration, order/admission services, seed/config/docs. Tests passed; no Phase 1 database blocker remains. MFA recovery remains incomplete.

### Phase 2 — API security

- Added PostgreSQL-backed endpoint-specific rate limiting and retained per-account lockout.
- Added strict Zod objects, validated query/header formats, a 64 KiB default body limit, a sanitized correlation-ID error filter, exact CORS allowlists, and production-disabled Swagger.
- Live negative tests passed for unknown privilege fields, oversized bodies, hostile CORS, brute-force throttling, forged sessions, CSRF, SQLi/XSS/SSRF-shaped inputs, and IDOR.

Modified areas: API bootstrap, auth/events/orders/admission controllers, contracts, rate-limit service/guard/decorator, error filter, environment validation, `20261017210000_api_security`. Remaining: production observability and capacity tuning.

### Phase 3 — database security

- Created `campuspass_app` as `NOSUPERUSER`, `NOBYPASSRLS`, `NOLOGIN`; production startup verifies the effective role and forced-RLS flags.
- Enabled and forced RLS on current tenant-owned business tables. Orders and admission set tenant/user context inside their transactions. Added public-read policies only for published public catalog records.
- Added positive amount/capacity/count and chronological database constraints.
- Verified the actual role cannot see tenant rows without context, cannot see tenant B under tenant A context, and cannot insert a tenant B row. Login/public catalog/order succeeded while API connections used `SET ROLE campuspass_app`.

Modified areas: `tenant-context.ts`, services, Prisma schema, `20261017220000_rls_and_constraints`, startup posture check. Remaining: society-specific policies when private society APIs exist; authentication tables still require broad runtime access and need a dedicated auth data-access role/function design before production.

### Phase 4 — infrastructure

- Removed example encryption/database secrets. Compose requires an operator password and binds PostgreSQL to `127.0.0.1` with no-new-privileges.
- Production validation requires HTTPS origins, TLS PostgreSQL URL, explicit application role, trusted proxy, body limits, secrets, and disabled unapproved feature flags.
- Added API security headers/HSTS, nonce CSP and web headers, disabled API/browser source maps, and verified build artifacts.

Modified areas: `.env.example`, `docker-compose.yml`, API/web bootstrap/config, Prisma startup. Remaining external blockers: managed secret store, private production networking, container/image policy, non-root production images, backups/restore, WAF/edge configuration, monitoring, and key rotation.

### Phase 5 — payment and ticket security

- Live payments remain disabled; there is no webhook endpoint or mock verification.
- Current free-ticket path uses idempotency records, serializable retries, a conditional inventory update, encrypted opaque QR credentials, and atomic check-in. Real concurrent redemption passed.
- Payment signatures/replay/ledger/reconciliation, refunds, cancellations, and transfers are not implemented and are recorded as pending—not passed.

### Phase 6 — frontend security

- Added login, MFA enrollment/verification, protected account loading, expiry redirect, CSRF-safe credentialed requests, and secure logout.
- No auth token is accessible to client JavaScript or stored in browser storage. React unsafe HTML is absent.
- Added per-request nonce CSP and production headers. Production build passed and contained no browser-static source maps.
- Browser automation was blocked because the browser surface was unavailable. HTTP-rendered login/CSP verification passed; full browser E2E remains open.

### Phase 7 — automated security testing

- Added `test:security:http`: 16 real HTTP assertions covering SQLi/XSS/SSRF-shaped inputs, registration replay, login/cookies, session forgery, CSRF, IDOR, MFA gating, privilege-field rejection, QR privacy, concurrent redemption, body limits, CORS, unavailable upload/payment surfaces, and rate limiting.
- Added `test:security:static`: 11 assertions covering browser storage, unsafe HTML, unsafe SQL APIs, development auth, JWT surface, hardcoded secrets/default credentials/network binding, Swagger/headers, source maps, backend guards, and logging.
- Unit suite includes serializable retry and production-environment tests.

### Phase 8 — final verification

Commands and exact results are in `SECURITY_TEST_RESULTS.md`. All executed local unit/type/lint/build/migration/security checks passed after the source-map defect was corrected. Browser E2E, production infrastructure, provider workflows, and independent review remain blocked/pending, so production readiness is not claimed.
