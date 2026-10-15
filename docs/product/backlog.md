# Dependency-ordered product backlog

The detailed 360-feature catalog in the master specification remains planned. Items below are epics; no future epic is marked complete.

| Order | Epic                                                    | Depends on                  | Gate / acceptance summary                                              | State                                             |
| ----: | ------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------- |
|     0 | Discovery, approvals, risks, ADRs, repo/CI              | None                        | Reviewable artifacts and executable local foundation                   | Implemented; verification pending                 |
|     1 | Tenant identity, sessions, verification, grants         | 0                           | Real persistence, revocation, least privilege, tenant regression suite | Planned                                           |
|     2 | University/society onboarding and approvals             | 1                           | Admin-scoped lifecycle, invite expiry/revocation, audit evidence       | Planned                                           |
|     3 | Events, venues, publication and discovery               | 2                           | Complete state machine, visibility isolation, accessible public UI     | Planned                                           |
|     4 | Inventory, holds, free orders and wallet                | 3                           | No oversell at 100-way race; idempotent free fulfillment               | Domain kernel implemented; persistence/UI planned |
|     5 | Scanner assignment and online admission                 | 4                           | One success in 100-way redemption; all rejection reasons tested        | Domain kernel implemented; persistence/UI planned |
|     6 | Pilot hardening and operations                          | 5 + pilot authorization     | Load/accessibility/security reviews and on-site rehearsal recorded     | Planned                                           |
|     7 | Payments, ledger and reconciliation                     | 6 + legal/provider approval | Verified provider signatures, dedupe/reorder tests, balanced postings  | Blocked by business decisions                     |
|     8 | Refunds, cancellation, transfers, waitlists, promotions | 7                           | Atomic ticket/finance effects and recovery procedures                  | Planned                                           |
|     9 | Expo apps, push and deep links                          | 6                           | Device QA and current store-policy evidence                            | Planned                                           |
|    10 | Advanced reporting, subscriptions, tenant scale         | 7/9                         | Privacy-safe metrics and independently approved universities           | Planned                                           |

Every feature issue must use Appendix B's definition template before implementation.
