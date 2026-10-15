# Migration rollback procedure

The initial migration is destructive to reverse and is for an empty local database only. Stop applications, take a database backup, verify the database is non-production, then drop the schema or Docker volume and recreate it. In any shared/staging/production environment, do **not** run a down migration without a reviewed data export and incident/change record. Subsequent production migrations must use expand/migrate/contract and feature flags.
