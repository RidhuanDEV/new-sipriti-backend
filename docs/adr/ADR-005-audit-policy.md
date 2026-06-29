# ADR-005: Audit Policy

## Status

Accepted

## Context

`sipriti_backend/md/RULES-PERUBAHAN-CODE.md` states that audit log is an observer, not a gatekeeper. Audit failure must not cancel the main business transaction. Some legacy code and new starter comments still imply transactional audit for all mutations, creating inconsistent guidance.

## Decision

Default audit behavior in `new_sipriti_backend` is non-blocking:

- Main business mutation runs in its own transaction when needed.
- Audit is written after the main transaction.
- Audit uses `throwOnError: false`.
- Audit promise is caught and logged with `logger.warn`.
- Audit action constants must be registered before use.

Domain-critical exceptions may be blocking only when explicitly documented in the service/policy. Examples include role-permission mutation, account deactivate/restore, approval/rejection decisions, and proposal forward if the team decides audit is part of integrity.

## Alternatives Considered

- Transactional audit for every mutation: stronger coupling, but can break business flows when audit write fails.
- Generic global audit only: broad coverage, but weak semantic accuracy and duplicate audit risk.

## Consequences

Positive:
- Audit failures do not break normal user actions.
- Domain-critical audit behavior is deliberate, not accidental.
- Duplicate audit writes can be avoided by module-specific semantic events.

Negative:
- Audit can lag or fail independently from business data.
- Critical exceptions need explicit documentation and tests.

Risks Accepted:
- Non-blocking audit may miss events during audit table outages, but logs should expose the failure.

## Rollback / Reversal Strategy

For a specific high-risk workflow, add a service-level exception with tests and document it in the module inventory. Do not change the global default.
