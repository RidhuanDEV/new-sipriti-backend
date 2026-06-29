# ADR-006: Local Upload Storage and Static File Policy

## Status

Accepted

## Context

The legacy backend serves local uploads from `/uploads/<subdir>`, validates uploads with size/MIME/signature checks, renames files, and protects static serving with headers. Many SIPRITI modules depend on uploaded images, richtext images, PDFs, reports, and official signatures.

## Decision

During migration, local upload behavior is preserved:

- Public URLs keep the `/uploads/<subdir>/<filename>` shape.
- Static serving denies directory index and dotfiles.
- Static responses set `X-Content-Type-Options: nosniff`.
- Static responses set `Referrer-Policy: no-referrer`.
- Uploads require size validation, MIME allowlist, extension allowlist, magic byte validation, and generated UUID-based filenames.
- Path conversion must guard against traversal and must not expose absolute filesystem paths.

## Alternatives Considered

- Move directly to object storage: better for scale, but not required for parity and increases migration scope.
- Keep ad hoc module-specific upload code: faster short term, but repeats security-sensitive logic.

## Consequences

Positive:
- Existing frontend file URLs remain valid.
- Upload hardening stays centralized.
- Content, proposal, PDF, and report modules can reuse one storage policy.

Negative:
- Local disk lifecycle and backup remain operational concerns.
- Object storage migration is deferred.

Risks Accepted:
- Local storage is acceptable for parity migration as long as backup and static serving behavior are documented.

## Rollback / Reversal Strategy

If static upload behavior fails in staging, disable migrated upload-backed modules and keep their legacy backend routes active until storage parity is fixed.
