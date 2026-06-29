# ADR-007: Migration and SQL Patch Workflow

## Status

Accepted

## Context

The legacy backend requires Sequelize migrations and idempotent SQL patches for schema, index, enum, role, and permission changes. The new backend currently has TypeScript migrations under `src/database/migrations` but no production SQL patch directory.

## Decision

Every schema or permission change in `new_sipriti_backend` must include:

- Sequelize migration with `up()` and `down()`.
- Idempotent SQL patch in `sql/`.
- Seeder update when role or permission data changes.
- RBAC source update when role or permission data changes.

SQL patches must be safe to run more than once. Patches touching foreign keys must handle foreign key checks explicitly when required.

## Alternatives Considered

- Sequelize migrations only: easier in development, but does not match production manual patch workflow.
- SQL patches only: unsafe for developer rebuilds and test environments.

## Consequences

Positive:
- Production deployment keeps the old operational safety model.
- Fresh installs and production updates remain aligned.
- Rollback planning is explicit.

Negative:
- Each schema change requires more artifacts.
- Review must verify migration and SQL patch equivalence.

Risks Accepted:
- Extra process is intentional because database drift is a high-risk migration failure mode.

## Rollback / Reversal Strategy

Use Sequelize `down()` for development rollback. For production, every SQL patch must include clear rollback notes or a paired rollback patch when destructive changes are unavoidable.
