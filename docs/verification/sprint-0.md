# Sprint 0 verification — 2026-10-15

## Passed locally

| Command                | Result                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `npm install`          | Passed; one root lockfile; audit reported 0 vulnerabilities after Prisma was pinned to 6.12.0                                    |
| `npm run lint`         | Passed, 14/14 Turborepo tasks                                                                                                    |
| `npm run typecheck`    | Passed, 14/14 Turborepo tasks                                                                                                    |
| `npm test`             | Passed, 14/14 tasks; 15 substantive assertions across contracts, validation, domain, development auth, and credential encryption |
| `npm run build`        | Passed, 12/12 tasks; API compiled and Next.js production build completed                                                         |
| `npm run format:check` | Passed                                                                                                                           |
| `prisma validate`      | Passed against the Sprint 0 schema                                                                                               |
| `prisma generate`      | Passed with Prisma 6.12.0 using the installed engine paths in this managed environment                                           |

The domain race suite launches 100 concurrent buyers against 10 tickets and 100 concurrent scans against one credential. It asserts exactly 10 issues, one successful redemption, opaque credentials, and tenant isolation. These are deterministic in-process policy tests, not PostgreSQL load-test evidence.

## Not verified

- Migration application, database-backed integration, serializable retry behavior, and seed execution: Docker/PostgreSQL executables are not available in the current environment.
- Browser screenshots and visual regression: the managed sandbox refused local TCP binding with `EPERM`, although the production web build passed.
- Real authentication, email, SMS, push, payment, SSO, object storage, Redis, or mobile runtime.
- Deployment, NUST/university authorization, legal approval, accessibility audit, penetration test, load test, backup restore, or real-device scanner rehearsal.

## Rollback

No external state was created. Local generated build directories and database volumes (when created by a developer) can be discarded. For a migrated development database, follow `apps/api/prisma/rollback/README.md`; never run destructive down SQL against production without review and backup evidence.
