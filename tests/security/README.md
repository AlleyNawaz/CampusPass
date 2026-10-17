# Security tests

Owner: security/QA. Unit tests cover password/session/MFA/CSRF/RBAC/configuration and transaction retry behavior. `npm run test:security:http` runs destructive-safe, synthetic tests only against an explicitly local disposable PostgreSQL/API environment. `npm run test:security:static` checks browser storage, unsafe HTML/SQL, development auth, JWT surface, defaults, Swagger/headers, source maps, backend guards, and logging. Exact evidence and remaining provider/browser/infrastructure gaps are tracked in `docs/security/SECURITY_TEST_RESULTS.md`.
