# Phase 4 Semantic Audit - Proposal Core

Date: 2026-06-04

Scope: proposal core only. This includes proposal aggregate models, proposal create/invite/respond/review, invite routes, notification routes needed by proposal invites, penelitian, pengabdian, nested proposal sections, RAB, and search anggota.

Out of scope: proposal review workflow, laporan-usulan full workflow, PDF generation, HKI flow, monev, dashboards, audit log browsing, official signatures, and bulk import. Those remain Phase 5.

## Legacy Sources

| area | legacy source | new source |
| --- | --- | --- |
| Proposal base | `sipriti_backend/src/modules/proposal/*` | `src/modules/proposal/*` |
| Invites | `sipriti_backend/src/routes/invites.routes.js` | `src/modules/invites/*` |
| Notifications | `sipriti_backend/src/modules/notification/*` | `src/modules/notification/*` |
| Penelitian aliases | `sipriti_backend/src/modules/research/*` | `src/modules/research/*` |
| Pengabdian aliases | `sipriti_backend/src/modules/pengabdian/*` | `src/modules/pengabdian/*` |
| Nested penelitian | `sipriti_backend/src/modules/penelitian-proposal/*` | `src/modules/penelitian-proposal/*` |
| Nested pengabdian | `sipriti_backend/src/modules/pengabdian-proposal/*` | `src/modules/pengabdian-proposal/*` |
| Nested jadwal | `sipriti_backend/src/modules/jadwal-proposal/*` | `src/modules/jadwal-proposal/*` |
| Nested luaran | `sipriti_backend/src/modules/luaran-proposal/*` | `src/modules/luaran-proposal/*` |
| Nested RAB | `sipriti_backend/src/modules/rab-proposal/*` | `src/modules/rab-proposal/*` |
| Search anggota | inline legacy `/api/usulan/search-anggota` mount and `sipriti_backend/src/modules/search-anggota/*` | `src/modules/search-anggota/*` |

## Contract Locks

- `/api/penelitian` and `/api/usulan-penelitian` are mounted to the same research router.
- `/api/pengabdian` and `/api/usulan-pengabdian` are mounted to the same pengabdian router.
- `/api/proposals/:id/{penelitian,pengabdian,jadwal,luaran,rab}` nested URLs are preserved.
- Penelitian detail keeps the legacy query contract `GET /api/penelitian/detail?id=:id`.
- Pengabdian detail keeps the legacy path contract `GET /api/pengabdian/:id`.
- Proposal document uploads keep the legacy public URL shape `/uploads/proposals/:filename`.
- Search anggota keeps the legacy `keyword` query contract; empty or whitespace keyword returns an empty array.

## Business Rule Preservation

| rule family | preservation point |
| --- | --- |
| Ketua checks | Centralized in `src/modules/proposal/policies/proposal.policy.ts` and called from services before mutation/submit/forward. |
| Prodi scope checks | Centralized in proposal policy helpers and applied to by-prodi access and edit flows. |
| Draft edit restrictions | Implemented through policy-level edit decisions, not controller branching. |
| Status transitions | Proposal services preserve create, submit, review, invite, and forward transitions instead of flattening them into generic CRUD. |
| Forward rules | Penelitian and pengabdian forward actions validate the correct proposal type, actor eligibility, and laporan-usulan side effect. |
| Invite response | Accept/reject updates member status and clears related invite notifications. |
| Notification read state | Notification service keeps read, read-all, unread-count, and invite accept/reject operations. |
| Nested sections | Section services validate proposal access and keep each section in its own module. |

## Serializer Guardrails

- Public landing serializers must return public proposal fields only and must not expose internal member rows, revision notes, audit metadata, or user objects.
- Detail serializers keep legacy proposal fields, member presentation, nested penelitian/pengabdian detail, jadwal, luaran, and RAB summaries.
- Member identity fallback must preserve `no_identitas`, `nidn`, and `nrp` sources so member rows are not rendered with empty identities when joined data is available.
- Response envelopes follow the Phase 1 compatibility helper unless a legacy nested controller returned a raw `status/data/message` shape.

## Schema And Permission Changes

Added migration files:

- `src/database/migrations/20260603040000-create-phase4-proposal-core.ts`
- `src/database/migrations/20260603041000-seed-phase4-permissions.ts`

Added manual SQL patches:

- `sql/patch-03-jun-2026-phase4-proposal-core.sql`
- `sql/patch-03-jun-2026-phase4-permissions.sql`

Permission seed source:

- `src/database/rbac-source.ts`
- `src/database/seeders/20260524000000-seed-roles-permissions.ts`

## Security And Safety Notes

- Proposal upload route uses the new upload foundation: size limit, MIME allowlist, magic-byte validation, UUID filename, proposal subdir path guard, route rate limit, and safe static headers.
- Controllers delegate business rules to services/policies.
- Authenticated routes preserve legacy permission names and `checkAnyPermission` combinations.
- Audit writes are semantic and non-blocking, matching the migration ADR for audit behavior.
- SQL patches are idempotent and safe to rerun for table/index/permission creation.

## Remaining Phase 5 Risks

- Proposal review route ordering from legacy remains a Phase 5 parity risk.
- Full laporan-usulan lifecycle is not complete in Phase 4; only the forward dependency is modeled.
- PDF, official signatures, HKI, monev, dashboards, audit log browsing, and bulk import are intentionally untouched.
- DB-backed parity smoke tests require a migrated MySQL fixture with seeded users and permissions.
