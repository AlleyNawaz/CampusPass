# CampusPass Security Test Results

Date: 2026-10-17

## Environment

- Disposable PostgreSQL 16.15, loopback port 55432, synthetic data only.
- Five Prisma migrations applied successfully.
- API exercised over HTTP on port 3101, including a run with every connection using effective role `campuspass_app`.
- Optimized Next.js production build exercised on loopback port 3000.
- No production target was contacted.

## Executed evidence

| Area                  | Evidence                                                                                               | Result                 |
| --------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------- |
| Registration/login    | Real invitation registration 201, replay 401, login 200                                                | Pass                   |
| Cookies/session       | HttpOnly and SameSite=Strict observed; production Secure path unit/config tested                       | Pass locally           |
| CSRF/CORS             | Missing token 403; hostile Origin denied; valid mutation passed                                        | Pass                   |
| MFA                   | Enroll/start/confirm, subsequent challenge, fresh code success, replay failure                         | Pass                   |
| Expiry/revocation     | Forced idle expiry 401; logout then reuse 401                                                          | Pass                   |
| IDOR/BOLA             | Other-university user requesting tenant-A ticket type received 404                                     | Pass                   |
| RLS role              | `rolsuper=f`, `rolbypassrls=f`, `rolcanlogin=f`; tenant/no-context reads and cross-tenant write denial | Pass                   |
| RLS API compatibility | Public events, login, and tenant order under effective app role                                        | Pass                   |
| Concurrent redemption | Initial run exposed 18 `P2034` errors; after fix: 1 admitted, 19 already-used, 0 errors                | Pass after remediation |
| API negative suite    | `npm run test:security:http`: 16 real HTTP assertions                                                  | Pass                   |
| Static suite          | `npm run test:security:static`: 11 security assertions                                                 | Pass                   |
| Web response          | Login rendered; nonce CSP/no unsafe-inline script; HSTS/XFO; no source-map link                        | Pass                   |
| Source-map artifacts  | No API dist or browser-static `.map` files after corrected build                                       | Pass                   |

## Final command results

The final run must remain the source of truth; do not substitute older cached counts.

| Command                                               | Result                                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------ |
| `npm test`                                            | Pass (workspace suite; API includes 20 unit tests after final additions) |
| `npm run typecheck`                                   | Pass                                                                     |
| `npm run lint`                                        | Pass                                                                     |
| `npm run format:check`                                | Pass                                                                     |
| `npm run build`                                       | Pass                                                                     |
| `npm run test:security:http`                          | Pass: 16 assertions                                                      |
| `npm run test:security:static`                        | Pass: 11 assertions                                                      |
| `npm audit --audit-level=high`                        | Pass: 0 vulnerabilities                                                  |
| `prisma migrate status` against disposable PostgreSQL | Pass: 5 migrations; database schema is up to date                        |

## Coverage of original 20 categories

SQLi, XSS, CSRF, IDOR/BOLA, rate limiting, session/JWT design, secrets/defaults, password hashing, MFA, CORS, browser storage, backend authorization, RLS, SSRF, source maps, logging, dependencies, ticket concurrency, and disabled upload/payment surfaces have executable evidence. File uploads and payment webhooks are absent and therefore tested only for non-exposure; their required positive security behavior remains pending until those features exist.

## Blocked or incomplete—never counted as passed

- Interactive browser E2E: computer-use browser surface was unavailable. Production HTML/header verification passed, but UI interaction was not automated.
- Multi-instance rate-limit/load behavior, production proxy/TLS, WAF/egress, secret manager, rotation, backups/restore, central logging/SIEM, and container runtime policy require infrastructure access.
- Payment webhook signature/replay/ledger/refund/reconciliation and ticket transfer do not exist.
- MFA/account recovery and phishing-resistant platform-admin MFA do not exist.
- Private society APIs and society-level RLS do not exist; policies must precede those features.
- Independent penetration test and security review have not occurred.
