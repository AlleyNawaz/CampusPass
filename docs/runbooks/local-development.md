# Local development recovery

## Database unavailable

- Signal: API startup fails or event list shows the explicit API-unavailable state.
- Containment: do not enable fallback writes or cached private data.
- Recovery: start local PostgreSQL, run migrations, then seed synthetic data.
- Validation: query `/v1/health`, `/v1/events`, then run the unit suite.

## Feature rollback

Set risky flags false, stop the API, and restore the local database from a known fixture or recreate its Docker volume. No production rollback is authorized by this runbook.
