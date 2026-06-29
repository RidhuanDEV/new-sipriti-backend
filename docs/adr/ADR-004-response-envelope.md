# ADR-004: Legacy-Compatible Response Envelope

## Status

Accepted

## Context

The legacy backend generally returns `success`, `message`, optional `data`, optional `meta`, and `error` for failures. The new backend starter currently returns a slimmer `success/data` response and `success/message/errors` for failures. The existing frontend services and error handlers expect the legacy shape.

## Decision

Migrated `/api` endpoints must use this success envelope:

```json
{
  "success": true,
  "message": "Pesan Bahasa Indonesia",
  "data": {},
  "meta": {}
}
```

Migrated `/api` endpoints must use this error envelope:

```json
{
  "success": false,
  "message": "Pesan Bahasa Indonesia",
  "error": "ERROR_CODE"
}
```

Internal error details must be logged server-side and not exposed in production responses.

## Alternatives Considered

- Keep the starter response shape: less work, but breaks frontend assumptions.
- Support both shapes per module: flexible, but makes parity testing harder.

## Consequences

Positive:
- Existing frontend error handling remains stable.
- Old and new backend responses are easier to compare.
- User-facing messages remain in Bahasa Indonesia.

Negative:
- The new backend carries legacy envelope semantics during migration.

Risks Accepted:
- Some starter controllers must be adapted before domain migration.

## Rollback / Reversal Strategy

If `/api/v2` is introduced later, it may use a cleaner response envelope. Legacy `/api` should remain stable until frontend consumers are migrated.
