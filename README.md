# CampusPass

CampusPass is a NUST-first hypothesis for a multi-university event operations platform. NUST is **not** represented as a partner. This repository is an early local-development foundation; it is not deployed and no external integrations are approved or active.

## Current verified scope

- Monorepo and CI-ready command structure.
- Responsive public web shell.
- NestJS API with health, free-ticket registration, and online ticket redemption endpoints.
- PostgreSQL/Prisma schema plus an explicit SQL migration for the first vertical slice.
- Deterministic domain tests, including 100-way inventory and redemption races.
- Development-only synthetic authentication. It is refused in production mode.

Payments, real email, SMS, push, campus SSO, offline scanning, and production infrastructure are disabled.

## Local setup

Requirements: Node.js 22.12+, npm 11+, and Docker with Compose for database-backed API use.

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Web: `http://localhost:3000` · API: `http://localhost:3001/v1` · OpenAPI: `http://localhost:3001/docs`

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Development credentials and sample identifiers are printed only by the synthetic seed command. Never use them outside a local database.

See [implementation plan](docs/implementation-plan.md), [assumptions](docs/assumptions.md), [architecture](docs/architecture/overview.md), and [backlog](docs/product/backlog.md).
