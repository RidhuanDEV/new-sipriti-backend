# ADR-001: Preserve Legacy API Contract During Migration

## Status

Accepted

## Context

The legacy SIPRITI backend exposes a large `/api` surface consumed by the existing React frontend. The migration goal is to move implementation into `new_sipriti_backend` without changing existing business logic, endpoint URLs, permission behavior, or response expectations. Rewriting endpoints into a cleaner contract during the same migration would create frontend drift and make parity impossible to prove.

## Decision

The migrated backend will preserve the legacy `/api` contract through Phase 1 to Phase 6. Endpoint URLs, HTTP methods, request field names, response field names, auth requirements, permission behavior, and user-facing messages must match the legacy backend unless a difference is explicitly approved and documented.

Cleaner contracts may be introduced only in a separate approved cleanup phase, preferably under `/api/v2`, after legacy parity is verified.

## Alternatives Considered

- Migrate directly to `/api/v2`: cleaner long term, but requires simultaneous frontend migration and increases cutover risk.
- Rewrite endpoint names while migrating modules: faster to make the new backend look consistent, but breaks the primary goal of parity.

## Consequences

Positive:
- Frontend can keep using existing services and hooks during backend migration.
- Old and new backend responses can be compared directly.
- Cutover risk is lower.

Negative:
- Some legacy naming and response envelope choices remain temporarily.
- New code needs compatibility adapters at HTTP boundaries.

Risks Accepted:
- Technical debt is carried during migration to protect runtime behavior.

## Rollback / Reversal Strategy

If compatibility creates excessive complexity, stop adding new modules and create a dedicated `/api/v2` ADR. Existing migrated `/api` endpoints remain until frontend migration is complete.
