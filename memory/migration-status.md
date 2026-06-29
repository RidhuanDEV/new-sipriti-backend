---
name: migration-status
description: Phase 6 granular RBAC migration completed June 2026
metadata:
  type: project
---

Migration phases 1–6 have been completed as of June 2026:

- Phase 2: Master data tables
- Phase 3: Public content
- Phase 4: Proposal core
- Phase 5: Advanced workflows
- Phase 6: Granular RBAC completion (June 8, 2026)

**Why:** Migrations are tracked in `src/database/migrations/` and applied SQL patches are in `sql/`. Phase 6 added fine-grained role-permission mappings.

**How to apply:** New features should build on top of the existing RBAC foundation. Before adding new permissions, check `src/constants/permissions.constants.ts` to avoid duplicates. New migrations go under `src/database/migrations/` with a timestamp prefix.
