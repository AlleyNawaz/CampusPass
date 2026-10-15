# ADR 0003: npm workspaces fallback for the foundation environment

- Status: accepted for Sprint 0; reversible
- Date: 2026-10-15

## Context

The requested reference uses pnpm workspaces. In the current managed environment, pnpm registry requests fail with DNS restrictions while approved npm installs succeed. A missing lockfile would make CI non-reproducible.

## Decision

Use npm 11 workspaces with Turborepo and one root lockfile for the executable foundation. Package boundaries and scripts remain package-manager-neutral. Re-evaluate pnpm before Sprint 1 if the build environment supports it consistently.

## Consequences

This is a tooling deviation, not an architecture change. Local and CI commands use npm. Migrating back requires regenerating one lockfile and changing filter syntax; application code is unaffected.
