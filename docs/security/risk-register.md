# Security and payment risk summary

| Risk                          | Severity | Current control                                                                  | Residual / launch action                                                                                                   |
| ----------------------------- | -------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Cross-tenant IDOR             | Critical | Tenant is server-side actor scope; uniform not-found; isolation tests            | Independent security review before pilot                                                                                   |
| Inventory oversell            | Critical | DB row lock/serializable design; check constraints; race test                    | PostgreSQL integration/load evidence required                                                                              |
| Duplicate admission           | Critical | Hashed opaque token; conditional state transition; unique admission; idempotency | Real-device/network race rehearsal required                                                                                |
| QR screenshot theft           | High     | One-time redemption, optional identity policy later                              | First presenter can still redeem; communicate honestly                                                                     |
| Offline duplicate admission   | Critical | Offline scanning disabled; online fail-closed                                    | Disconnected devices cannot coordinate a global single-use fact; any future offline mode is provisional and conflict-prone |
| Payment spoof/duplication     | Critical | Paid feature off; future signed raw-body webhooks, dedupe and reconciliation     | Legal/provider verification required                                                                                       |
| Merchant/settlement liability | Critical | No payment acceptance                                                            | Merchant-of-record and payout design must be approved                                                                      |
| PII leakage                   | High     | No PII in QR; token hashes at rest; redaction policy                             | Log/privacy tests and retention review required                                                                            |
| Privileged misuse             | High     | Least privilege design; immutable audit events                                   | Reauthentication and dual control for financial actions                                                                    |
| Development auth misuse       | Critical | Refuses production; explicit flag; synthetic data only                           | Replace entirely in Sprint 1                                                                                               |

## Why offline QR cannot guarantee global uniqueness

A QR token can be copied. Two disconnected scanners have no shared, current record of redemption, so both can independently decide the same credential is unused. Cryptographic signatures prove issuer authenticity, not whether another offline device already admitted it. A later contingency mode can reduce risk with device-bound, short-lived encrypted manifests and reconciliation, but it must show “provisional” admission and cannot promise global single use.
