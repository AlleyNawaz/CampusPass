# CampusPass Feature Gap Analysis

## Student experience

| Required feature        | Existing implementation                                                                                | Gap / acceptance condition                                                                | Target           |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ---------------- |
| Homepage                | Responsive public landing page                                                                         | Replace remaining foundation/demo language when pilot authorization exists                | Sprint 1         |
| University selection    | University exists in data model                                                                        | Public active-university catalog and selector are absent                                  | Sprint 2         |
| Search and filtering    | Public event list supports university slug only                                                        | Search, date/category/campus filters, validated query contract, empty/loading states      | Sprint 2         |
| Event details           | Event data exists                                                                                      | Public detail endpoint/page, policies, availability, venue, ticket tiers                  | Sprint 2         |
| Registration            | Secure invitation API and web form                                                                     | Issuance/delivery/admin workflow and resend support                                       | Sprint 1–2       |
| Email verification      | Invitation possession establishes address control                                                      | Dedicated email provider, verification lifecycle, expiry/resend telemetry                 | Sprint 1 blocker |
| Login/MFA/logout        | Implemented                                                                                            | Add recovery and clearer session-expiry UX                                                | Sprint 1         |
| Password reset          | None                                                                                                   | Single-use hashed token, enumeration-safe request, revoke sessions, email delivery, tests | Sprint 1 blocker |
| Dashboard/account       | Connected profile, ticket/order dashboard, settings, and password change with other-session revocation | Session/device list, email changes, delete/export paths                                   | Sprint 1/6       |
| Booking                 | Secure backend free registration                                                                       | Event checkout UI, consent/policy display, idempotency persistence                        | Sprint 3         |
| Wallet/QR               | Credential storage and dashboard listing                                                               | QR encoder/rendering, brightness/fullscreen, ticket detail, accessibility                 | Sprint 3         |
| Notifications/reminders | Outbox model only                                                                                      | Dispatcher, provider adapter, preferences/inbox, scheduled reminders                      | Sprint 3/5       |

## Organizer and operations

All requested organizer workflows are missing as usable journeys: society onboarding/profile, event CRUD and approval submission, ticket tier/inventory management, attendees, reporting, cancellation, team roles, and scanner assignment. The schema covers much of the core data but not workflow APIs or UIs. Event categories/media, approval comments, notification preferences, and support cases need schema decisions.

The admission backend is the strongest operations component. It still needs scanner assignment/session APIs, a camera UI, QR decoding, live counters, event/gate selection, and device testing. Offline scanning remains intentionally disabled.

## Administration

University and platform roles are modeled and backend-derived, but there are no administration modules. Missing capabilities include university/society/user onboarding and approvals, role-grant management, policy configuration, audit history, analytics, support cases, and platform feature configuration. Every mutation must write an audit event and every university query must execute under verified tenant context.

## Data model gaps

- Event category/tags, media, accessibility structure, and approval decision/comment history.
- Notification, notification preference, delivery attempt, and reminder schedule.
- Password-reset/email-verification lifecycle if invitation verification is not retained.
- Payment intent/transaction/webhook receipt/refund/reconciliation ledger.
- Ticket transfer lifecycle and recipient acceptance.
- Support case and platform feature-flag entities.
- Optional session/device naming and recovery-code storage.

New entities must receive constraints, indexes, retention rules, RLS where tenant-owned, migration rollback notes, and application-role verification.

## Test gaps

- No web component/browser E2E suite or responsive/accessibility automation.
- The student dashboard/profile path has a disposable-database HTTP verification record, but it still needs a committed automated database-backed integration test in CI.
- No event-detail/search/filter or browser booking tests because those journeys do not exist.
- No organizer/admin authorization matrix tests beyond foundation security checks.
- No scanner camera/device tests.
- No worker/notification, payment, refund, transfer, or reconciliation tests.
- No mobile unit/E2E/device tests.

## Production gaps

Production blockers remain tracked in `docs/security/PRODUCTION_SECURITY_CHECKLIST.md`. Product completion additionally requires a pilot institution, approved operating policies, support/incident processes, email delivery, observability, accessibility review, representative load testing, and device/browser coverage. Passing local tests alone will not remove these blockers.
