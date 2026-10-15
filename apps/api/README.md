# API

Owner: backend platform. Run `npm run dev --workspace @campuspass/api`, test with `npm test --workspace @campuspass/api`, and generate the client with `npm run db:generate`.

Sprint 0 endpoints use development-only synthetic actor headers and a local PostgreSQL database. The application refuses this auth mode in production. Do not expose this service publicly.
