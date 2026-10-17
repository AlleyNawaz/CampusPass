# CampusPass Threat Model

Date: 2026-10-17

## Assets and trust boundaries

High-value assets are password hashes/pepper, MFA secrets, opaque sessions, university/society scopes, ticket inventory, QR bearer credentials, admissions, audit records, and future payment data.

Trust boundaries are: browser/scanner to API; API to PostgreSQL; public web rendering to API; deployment platform to runtime secrets; future workers to email/payment providers; and platform administrators crossing university boundaries. All client IDs, roles, tenant values, prices, state transitions, URLs, and payment claims are untrusted.

## Actors

- Unauthenticated attacker performing injection, credential stuffing, CSRF, XSS, SSRF, or resource exhaustion.
- Student attempting cross-user/university access or duplicate issuance.
- Society operator attempting another society’s private records.
- Scanner operator or stolen scanner session attempting unauthorized/duplicate admission.
- University or platform administrator abusing broad privilege.
- Forged/replayed future payment webhook.
- Database/log/operator compromise and supply-chain compromise.

## Threats, controls, and residual exposure

| Threat                      | Implemented control                                                                                    | Residual exposure / required action                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Password guessing           | Argon2id+pepper, generic errors, account lock, DB-backed endpoint limit                                | Production alerting, breached-password screening, capacity tuning                        |
| Session theft/fixation      | 256-bit opaque tokens, hashes at rest, HttpOnly/Secure/SameSite, user-agent binding, expiry/revocation | Anomaly detection and scheduled cleanup                                                  |
| CSRF                        | Exact Origin plus session-bound token                                                                  | Verify same-site domains and proxy behavior in staging                                   |
| Role/tenant spoofing        | Invitation/session-derived actor, backend RBAC, no self-role mutation                                  | Administration workflows need separate scoped review                                     |
| IDOR/tenant escape          | Tenant predicates, forced RLS, non-bypass role, not-found behavior                                     | Future endpoints need policy and negative-test additions                                 |
| Society-scope escape        | No private society API currently exposed                                                               | Add society context/RLS policies before private society data launches                    |
| Inventory/check-in race     | Serializable transactions, bounded conflict retry, conditional counters/state, uniqueness              | Production-scale load and failure-injection tests                                        |
| QR disclosure               | Random opaque bearer value; encrypted recoverable copy; no student PII                                 | Theft still permits use until revoked; wallet display needs screen-capture threat review |
| XSS                         | React escaping, no unsafe HTML, nonce CSP, HttpOnly session                                            | Full browser/stored-XSS automation and CSP reporting                                     |
| SSRF                        | No user-selected outbound target                                                                       | Network egress allowlists before integrations                                            |
| Secret/database compromise  | External-secret requirement, encrypted MFA/QR, startup DB-role/RLS verification                        | Secret manager, rotation, auth-table least privilege, backups/restore                    |
| Payment forgery/replay      | Payment routes and feature flag disabled                                                               | Provider signature/raw body, replay store, ledger, reconciliation remain mandatory       |
| Dependency/build compromise | Lockfile, local audit, no public source maps                                                           | CI audit/SBOM/signing/provenance and ongoing patch SLA                                   |

## Security invariants

1. A client never chooses its effective tenant or role.
2. An authenticated state-changing request requires both a valid server session and its bound CSRF value.
3. Privileged roles cannot receive a usable session without replay-protected MFA.
4. A business transaction sets PostgreSQL tenant context before touching RLS data.
5. The production API refuses a superuser, `BYPASSRLS`, wrong, or non-forced-RLS database posture.
6. Ticket issuance cannot exceed inventory; check-in transitions once from `ACTIVE`.
7. Payment state cannot change because payments are disabled until a verified provider design exists.
8. QR data contains no direct student identity.

## Required production assumptions

- TLS terminates at an approved proxy; the database connection uses TLS and private networking.
- Web/API hosts are deployed in a cookie-compatible same-site topology.
- Secrets are injected from an approved manager, never images/source/client bundles, and rotation is rehearsed.
- PostgreSQL login can assume only `campuspass_app`; migration credentials are isolated from runtime.
- Host clocks are synchronized for TOTP; logs are centrally redacted with access/retention controls.
- Independent security review, backup restore, incident response, and penetration testing occur before launch.
