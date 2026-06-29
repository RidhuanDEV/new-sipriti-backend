# ADR-003: Multi-Role RBAC and Prodi-Scoped Authorization

## Status

Accepted

## Context

The legacy backend supports multi-role authorization through `user_roles`, permission aggregation from all roles, legacy `user.role_id` fallback, role hierarchy checks, and prodi-scoped access rules. The new starter has a simpler single-role user model.

## Decision

The migrated backend must support SIPRITI RBAC semantics:

- A user may have multiple roles.
- Effective permissions are the union of permissions from all assigned roles.
- During migration, legacy `role_id` fallback remains supported for users not yet normalized into `user_roles`.
- Role hierarchy prevents users from managing accounts at the same or higher privilege level.
- Prodi-scoped access must use `kode_prodi` where legacy logic does so, especially for `kaprodi` and official signatures.

## Alternatives Considered

- Keep single-role RBAC: simpler, but not true to SIPRITI behavior.
- Migrate to a fully new permission model: cleaner, but creates frontend and data migration risk.

## Consequences

Positive:
- Existing role and permission behavior is preserved.
- Frontend RBAC context can continue to rely on permission union semantics.
- Future prodi-scoped features have a clear policy foundation.

Negative:
- More associations and cache invalidation paths are required.
- Permission inventory must be cleaned carefully to avoid duplicate semantics.

Risks Accepted:
- Legacy `role_id` fallback is temporary compatibility debt.

## Rollback / Reversal Strategy

If multi-role migration fails in staging, keep the old single-role relation active and disable new `user_roles` writes until data and permission mapping are corrected.
