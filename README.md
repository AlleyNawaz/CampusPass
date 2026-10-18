# CampusPass

CampusPass is a NUST-first hypothesis for a multi-university event operations platform. NUST is **not** represented as a partner. This repository is an early local-development foundation; it is not deployed and no external integrations are approved or active.

## Current verified scope

- Monorepo and CI-ready command structure.
- Responsive public web shell.
- NestJS API with health, free-ticket registration, and online ticket redemption endpoints.
- PostgreSQL/Prisma schema, five applied migrations, forced tenant RLS, and a non-bypass runtime role.
- Domain and real PostgreSQL/HTTP security tests, including concurrent redemption.
- Password authentication with server-side opaque sessions, backend RBAC, CSRF protection, and privileged-role TOTP MFA.
- Invitation registration, API rate limiting, strict validation, secure errors/CORS, and cookie/MFA frontend flows.

Payments, real email, SMS, push, campus SSO, offline scanning, and production infrastructure are disabled.

## Local setup

Requirements: Node.js 22.12+, npm 11+, and PostgreSQL 16. On macOS, the setup script automatically uses Homebrew PostgreSQL 16 and creates an isolated CampusPass cluster on port `55432`; it does not modify the default Homebrew cluster.

```bash
npm install
npm run dev:setup
npm run dev
```

Web: `http://localhost:3000` · API: `http://localhost:3001/v1` · OpenAPI: `http://localhost:3001/docs`

`dev:setup` generates an untracked mode-`0600` `.env`, initializes or reuses only `.campuspass-local/postgres-16`, applies migrations, and seeds synthetic accounts. Seed passwords remain in `.env` and are never printed. Stop the app with `Ctrl+C`; stop or restart its isolated database with `npm run dev:db:stop` and `npm run dev:db:start`.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Synthetic identifiers are printed only by the seed command. Seed passwords are supplied through local environment variables and must never be reused outside a local database.

See [implementation plan](docs/implementation-plan.md), [assumptions](docs/assumptions.md), [architecture](docs/architecture/overview.md), and [backlog](docs/product/backlog.md).
