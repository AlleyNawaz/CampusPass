# Local development recovery

## First-time macOS setup

Requirements: Node.js 22.12+, npm 11+, and Homebrew PostgreSQL 16.

```bash
npm install
npm run dev:setup
npm run dev
```

`dev:setup` creates an isolated cluster at `.campuspass-local/postgres-16` on `127.0.0.1:55432`, an untracked mode-`0600` `.env`, a non-superuser runtime login, the `campuspass` database, all Prisma migrations, and synthetic seed data. It never operates on the default Homebrew cluster. Seed account passwords are available only in the local `.env` file.

Open `http://localhost:3000`. The API health endpoint is `http://localhost:3001/v1/health`.

## Stop and restart

- Stop the Next.js and NestJS processes with `Ctrl+C` in the terminal running `npm run dev`.
- PostgreSQL intentionally remains available for the next run. Stop it with `npm run dev:db:stop`.
- Restart everything with `npm run dev`; the launcher starts the isolated database if necessary.
- Check database state with `npm run dev:db:status`.
- Re-run `npm run dev:setup` after new migrations or when reseeding the synthetic accounts is required. It reuses, rather than deletes, the isolated database.

## Database unavailable

- Signal: API startup fails or event list shows the explicit API-unavailable state.
- Containment: do not enable fallback writes or cached private data.
- Recovery: run `npm run dev:db:start`, then `npm run dev:setup` if migrations or seed data are missing.
- Validation: query `/v1/health`, `/v1/events`, then run the unit suite.

## Feature rollback

Set risky flags false, stop the API, and restore the local database from a known fixture or recreate its Docker volume. No production rollback is authorized by this runbook.
