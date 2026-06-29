# Phase 5 Semantic Audit - Advanced Workflows

Date: 2026-06-04

Scope: advanced workflow modules after proposal core stabilization. This includes proposal review, laporan-usulan, proposal final PDF, official signatures, HKI and HKI review, monev proposal, admin monev, dashboard, admin dashboard, audit log browsing, and bulk import.

## Legacy Sources

| area | legacy source | new source |
| --- | --- | --- |
| Proposal review | `sipriti_backend/src/modules/proposal-review/*` | `src/modules/proposal-review/*` |
| Laporan usulan | `sipriti_backend/src/modules/laporan-usulan/*` | `src/modules/laporan-usulan/*` |
| Final PDF and richtext parsing | legacy PDF/richtext parser and builder services | `src/modules/proposal-final-pdf/*`, `src/services/richtext-parser.service.ts` |
| Official signatures | legacy signature upload/admin behavior | `src/modules/official-signatures/*` |
| HKI user flow | `sipriti_backend/src/modules/hki/*` | `src/modules/hki/*` |
| HKI review | `sipriti_backend/src/modules/hki-review/*` | `src/modules/hki-review/*` |
| Monev proposal | `sipriti_backend/src/modules/monevproposal/*` | `src/modules/monevproposal/*` |
| Admin monev | `sipriti_backend/src/modules/monev-internal/*`, admin route mount | `src/modules/monev-internal/*` |
| Dashboard | legacy dashboard and admin aggregate controllers | `src/modules/dashboard/*`, `src/modules/admin-dashboard/*` |
| Audit logs | `sipriti_backend/src/modules/auditlog/*` | `src/modules/auditlog/*` |
| Bulk import | legacy import-usulan template/import services | `src/modules/bulk-import/*` |

## Contract Locks

- `/api/proposal-review` preserves stats, list, detail, approve, decline, user revision, user approved, and resubmit routes.
- `/api/laporan-usulan` keeps the legacy report workflow fields and file URL behavior for kemajuan, akhir, and final proposal rows.
- `/api/proposal-final-pdf/user/:id` keeps the legacy proposal final PDF URL surface and reads approved report/signature readiness before generation.
- `/api/admin/signatures` keeps prodi-scoped signature management and signature file delivery behavior.
- `/api/hki` and `/api/hki-review` keep separate owner and reviewer surfaces with the legacy status/catatan semantics.
- `/api/monev` and `/api/admin/monev` remain separate, with legacy admin monev option/upload behavior preserved.
- `/api/dashboard`, `/api/admin/dashboard`, and `/api/audit-logs` keep legacy authenticated URL surfaces.
- `/api/admin/usulan/import/template` and `/api/admin/usulan/import` keep the legacy template/import routes, request fields, and selected-member enforcement.

## Business Rule Preservation

| rule family | preservation point |
| --- | --- |
| Proposal review | Approval, decline, revision, resubmit, status serialization, laporan side effects, and notification side effects live in the service layer. |
| Laporan usulan | Ketua/report ownership checks, final report readiness, validator identity, and file status transitions remain service responsibilities. |
| PDF generation | Richtext parsing, table/list/math handling, final report lookup, and official signature requirement are isolated from controllers. |
| Official signatures | Only one active signature per signature key and prodi is retained; upload hash and metadata are persisted. |
| HKI | Owner mutations, submit, reviewer approve/reject, upload fields, and status/status_hki mapping are preserved as explicit service contracts. |
| Monev | User-side monev proposal operations and admin monev schedule/upload flows stay separated. |
| Dashboard | Aggregates read from proposal, member, report, HKI, and monev models without exposing internal rows. |
| Audit log | Viewer maps the new audit table to legacy `entity_type`, `entity_id`, `old_value`, `new_value`, and user presentation keys. |
| Bulk import | The hidden selected-member sheet is mandatory; missing, mismatched, or tampered selected members/roles are rejected before database writes. |

## Upload And Static Safety

- Phase 5 upload flows reuse the Phase 3 secure upload foundation: size limits, MIME allowlists, magic-byte validation, UUID filenames, per-subdir path guard, route rate limits, and safe static headers.
- Added public static subdirectories for laporan kemajuan, laporan akhir, proposal final PDF, signatures, and monev files where legacy public URLs require them.
- Official signature uploads accept PNG input, validate image identity, persist SHA-256, and keep active signature selection in database state.
- PDF generation writes UUID filenames and does not expose internal filesystem paths in API responses.

## Bulk Import Tamper Guards

- Template generation writes the visible proposal sheet plus hidden/veryHidden master sheets for selected members and role metadata.
- Import reads selected-member metadata first and rejects templates where selected members are missing, duplicated incorrectly, or not aligned with the visible proposal rows.
- Validation is completed before transaction writes; proposal creation and member rows are atomic for accepted files.

## Schema And Permission Changes

Added migration files:

- `src/database/migrations/20260603050000-create-phase5-advanced-workflows.ts`
- `src/database/migrations/20260603051000-seed-phase5-permissions.ts`

Added manual SQL patches:

- `sql/patch-03-jun-2026-phase5-advanced-workflows.sql`
- `sql/patch-03-jun-2026-phase5-permissions.sql`

Permission seed source:

- `src/database/rbac-source.ts`
- `src/database/seeders/20260524000000-seed-roles-permissions.ts`

## Verification

- `npm.cmd run build` exit 0.
- `npm.cmd run api-docs` exit 0 and synced 181 Zod schemas.
- `npm.cmd test` exit 0 with 0 tests.
- Strict Phase 5 type scan for `any`, `as unknown`, and `catch (err: any)` returned no matches.
- Route guard smoke on compiled `dist/app.js` covered review, laporan, final PDF, signatures, HKI, monev, dashboard, auditlog, and bulk import CSRF/auth surfaces.
- DB-backed happy-path and tamper-case smoke checks require a migrated MySQL fixture with seeded auth; current local Sequelize connection returns `SequelizeConnectionRefusedError` with `ECONNREFUSED`.

## Remaining Cutover Risks

- Full review/laporan/PDF/signature/HKI/monev/dashboard/audit/bulk-import parity must be replayed against a migrated database fixture before production cutover.
- Generated final PDFs should be visually inspected with real proposal richtext/signature data during Phase 6.
- Bulk import tamper rejection should be rerun with real legacy templates and intentionally modified hidden sheets once the fixture is available.
