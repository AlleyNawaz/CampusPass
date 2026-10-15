# ADR 0002: PostgreSQL with Prisma and explicit transactional SQL

- Status: accepted, reversible before production
- Date: 2026-10-15

## Decision

Use PostgreSQL 16+ and Prisma. Keep generated migrations in source. Use database constraints and explicit SQL for row locking, conditional redemption, and invariants Prisma cannot express directly.

## Rationale

Prisma gives a typed client and accessible migrations while PostgreSQL provides the isolation, constraints, and locking required by inventory/admission workflows. Redis is not authoritative.

## Rollback

Before production, the ORM can be replaced behind repositories. After production, migrations require expand/migrate/contract procedures and reviewed rollback plans.
