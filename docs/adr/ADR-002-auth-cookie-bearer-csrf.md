# ADR-002: Cookie JWT, Bearer Fallback, and CSRF Compatibility

## Status

Accepted

## Context

The legacy backend authenticates requests by reading the `jwt` cookie first and the `Authorization: Bearer` header second. It also uses CSRF middleware on `/api` routes, exposes CSRF headers, and configures CORS with credentials. The new backend starter currently uses bearer-token-only authentication.

## Decision

During migration, `new_sipriti_backend` must support the legacy auth contract:

- Read cookie `jwt` first.
- Fall back to `Authorization: Bearer <token>`.
- Use credentialed CORS with explicit frontend origins.
- Preserve CSRF token behavior for cookie-authenticated `/api` routes.
- Load the authenticated user from the database and attach a typed request context containing user identity, roles, permissions, and prodi scope.

JWT payload is not the same as authenticated user context. The payload proves identity; the context must be loaded from current database state.

## Alternatives Considered

- Bearer-only auth: simpler and aligns with the starter, but breaks the existing cookie-based frontend.
- Cookie-only auth: matches the main frontend flow, but removes useful API-client compatibility.

## Consequences

Positive:
- Existing frontend login/session behavior remains stable.
- Deleted/inactive users can be rejected based on current database state.
- The new RBAC context can support multi-role and prodi scope.

Negative:
- CSRF support adds implementation surface.
- Auth middleware must be stricter than the starter middleware.

Risks Accepted:
- Credentialed CORS must be configured carefully per environment.

## Rollback / Reversal Strategy

If cookie auth is later removed, introduce a new ADR and migrate the frontend to bearer-only or `/api/v2` auth endpoints first. Do not remove cookie/CSRF behavior while legacy frontend still depends on it.
