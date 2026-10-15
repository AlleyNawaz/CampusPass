# API documentation

Owner: API team. Local command: `npm run dev --workspace @campuspass/api`. Tests: `npm test --workspace @campuspass/api`.

The API is versioned under `/v1`. When running locally, OpenAPI is available at `/docs`. Error responses use a stable code, human-safe message, correlation ID, and optional validation details. Private-resource errors do not reveal cross-tenant existence.
