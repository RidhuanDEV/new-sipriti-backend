# Migration Phase Status

Current phase: Phase 6 - Cutover Readiness documentation and UAT preparation

Latest update: 2026-06-07. Source/static gates still pass, and the latest completed DB-backed parity evidence remains the 2026-06-05 pass recorded in `parity-report.md`. A fresh DB-backed rerun on 2026-06-07 is blocked by the local Windows service `MySQL82` being stopped and unavailable from this session.

## Phase Tracker

| phase | goal | gate | status | verification |
| --- | --- | --- | --- | --- |
| Phase 0 | Contract inventory, ADRs, SQL patch workflow, type-debt audit | ADRs and inventories exist; test script exists; build/docs/test checked | completed | `npm.cmd run build` exit 0; `npm.cmd run api-docs` exit 0 and synced 13 schemas; `npm.cmd test` exit 0 with 0 tests |
| Phase 1 | Foundation compatibility | Auth, response, RBAC, audit, storage shell ready | completed | `npm.cmd run build` exit 0; `npm.cmd run api-docs` exit 0 and synced 13 schemas; `npm.cmd test` exit 0 with 0 tests; ephemeral smoke checks completed |
| Phase 2 | Master data migration | Master data parity verified | migrated | `npm.cmd run build` exit 0; `npm.cmd run api-docs` exit 0 and synced 41 schemas; `npm.cmd test` exit 0 with 0 tests; route guard smoke completed |
| Phase 3 | Public content and upload-backed content | Public reads and upload URLs verified | migrated | Later covered by final Phase 6 route smoke and HTTP parity evidence. |
| Phase 4 | Proposal core | Proposal create/update/submit/detail/search/forward verified | migrated | Later covered by final Phase 6 route smoke, HTTP parity, policy tests, and manual previous-gap parity evidence. |
| Phase 5 | Advanced workflows | Review/laporan/PDF/HKI/monev/dashboard/audit/bulk import verified | migrated | Later covered by final Phase 6 route smoke, schema sync, migration check, and UAT checklist. |
| Phase 6 | Cutover and rollback | Parity report, runbooks, final docs, and UAT checklist complete | ready_for_uat_with_current_db_environment_blocker | Latest completed DB-backed evidence: `phase6:smoke` 30/30, `phase6:http-parity` 20/20, manual previous-gap parity 22/22. Current 2026-06-07 non-DB gates: `api-docs` 203 schemas, `test` 14 pass, `phase6:migration-check` 16 migrations/11 SQL patches. Fresh DB rerun blocked because `MySQL82` is stopped. |

## Phase 1 Type-Debt Items From Initial Audit

Command used:

```powershell
rg "\bany\b|as unknown|catch \(err: any\)" src
```

Findings to clean before using affected files as migration patterns:

| file | issue |
| --- | --- |
| `src/scripts/generate-swagger-schemas.ts` | `Record<string, any>` and `value as any` in schema generation. |
| `src/docs/swagger.ts` | `Record<string, any>` and `generateOpenApiSpec(...): any`. |
| `src/scripts/generate-crud.ts` | Generated controller templates use Express `Request<..., any, ...>`. |
| `src/modules/permissions/permission.controller.ts` | Resolved in Phase 1; Express response body generic now uses `unknown`. |
| `src/modules/user/user.controller.ts` | Resolved in Phase 1; Express response body generic now uses `unknown`. |
| `src/modules/roles/role.controller.ts` | Resolved in Phase 1; Express response body generic now uses `unknown`. |
| `src/modules/user/user.service.ts` | Resolved in Phase 1; cache result now uses an explicit `UserListResult` contract. |
| `src/core/validation/zod-error-map.ts` | `unknown[]` casts need narrowing or helper guards. |

## Phase 0 Notes

- Legacy endpoint baseline is `sipriti_backend/md/API_ENDPOINT_INVENTORY_COMPLETE.md`.
- Product example endpoint `/api/products` is marked `deferred` because it is a starter/example route, not confirmed SIPRITI domain capability.
- Legacy `proposal-review` route order collision is recorded and must be treated as a parity risk in Phase 5.
- Legacy public endpoints still pass through global `/api` middleware; Phase 1 compatibility must account for this.

## Phase 1 Notes

- Runtime auth now supports cookie `jwt` first and bearer token fallback.
- Login sets an HTTP-only auth cookie and refreshes the legacy `XSRF-TOKEN` cookie while preserving token response data.
- `/api/auth/logout` clears auth and CSRF cookies; CSRF middleware skips logout verification as in the legacy backend.
- RBAC permission checks now read the authenticated context permission union, with `users.role_id` retained as primary-role fallback.
- `user_roles` has both Sequelize migration and an idempotent SQL patch.
- Audit persistence is best-effort by default; blocking audit behavior is opt-in with `throwOnError: true`.
- Static public uploads are served only for legacy public subdirs with no index, denied dotfiles, `nosniff`, and `no-referrer` headers.
- Ephemeral smoke checks on compiled `dist/app.js`: `GET /health` returned 200; `GET /api/auth/me` returned 401 with legacy error envelope and issued `XSRF-TOKEN`; `POST /api/auth/logout` returned 200; `POST /api/auth/login` without CSRF header returned 403 and issued `XSRF-TOKEN`.
- Login success was not smoke-tested because it requires a running database and seeded credentials; Phase 2+ endpoint parity checks should run against a migrated database fixture.

## Phase 2 Notes

- Implemented legacy-compatible master data modules for `prodi`, `skema`, `bidangfokus`, `tahunakademik`, `output`, and `sertifikatmutu`.
- Preserved legacy URLs: `/api/admin/prodi`, `/api/admin/skema`, `/api/admin/bidang-fokus`, `/api/prodi/options`, `/api/skema/options`, `/api/bidang-fokus/options`, `/api/tahun-akademik`, `/api/outputs`, `/api/sertifikat-mutu`.
- Added Phase 2 RBAC permissions and admin mappings through migration, seeder, and SQL patch.
- Added idempotent schema migration and SQL patch for Phase 2 master tables and nullable legacy user profile/prodi columns.
- Auth context now loads `prodiRelation` through `users.prodi_kode -> prodis.kode_prodi` and exposes `req.user.prodi`.
- Route guard smoke checks on compiled `dist/app.js`: `GET /api/admin/prodi`, `GET /api/admin/skema`, `GET /api/admin/bidang-fokus`, and `GET /api/outputs` returned 401 legacy auth envelope without DB access; `POST /api/admin/prodi` without CSRF returned 403 legacy CSRF envelope.
- Full list/detail/create/update/delete/options parity smoke checks require a running migrated database fixture and seeded admin credentials.

## Phase 3 Notes

- Implemented secure upload/files foundation with path guards, size/MIME/magic-byte validation, UUID filenames, safe public static headers, and `/api/files/path/:subdir/:filename`.
- Preserved legacy public/static subdirs and richtext URL behavior: `/uploads/{berita,pengumuman,panduan,landing-slider,images}` and `/api/files/path/richtext/:filename`.
- Migrated Phase 3 content modules: `berita`, `pengumuman`, `panduan`, `publicpage`, `carousel`, `landing-slider`, `capaian`, `kategori-publikasi`, `publikasi`, `mitra-kerja-riset`, `product-riset`, `penghargaan-riset`, and `hibah-internal`.
- Added Phase 3 schema migration, permission migration, seeder entries, and SQL patches.
- Smoke checks on compiled `dist/app.js`: `GET /health` returned 200; `GET /uploads/images/phase3-smoke.txt` returned 200 with `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer`; `POST /api/upload/richtext` without CSRF returned 403 legacy CSRF envelope.
- `GET /api/berita?page=1&limit=1` and `GET /api/capaian/stats` reached the migrated route handlers but returned 500 because no MySQL service was listening on `localhost:3306`; run DB-backed parity after migrations are applied to a local fixture.

## Phase 4 Notes

- Implemented proposal core models, associations, routes, services, policies, schemas, migrations, permission seeds, and manual SQL patches.
- Preserved `/api/proposal`, `/api/invites`, `/api/notifications`, `/api/penelitian`, `/api/usulan-penelitian`, `/api/pengabdian`, `/api/usulan-pengabdian`, `/api/proposals/:id/{penelitian,pengabdian,jadwal,luaran,rab}`, and `/api/usulan/search-anggota`.
- Preserved penelitian detail as `GET /api/penelitian/detail?id=:id` and pengabdian detail as `GET /api/pengabdian/:id`.
- Centralized ketua, prodi, draft edit, access, and forward rules under proposal services/policies.
- Proposal uploads preserve `/uploads/proposals/:filename` and use the Phase 3 secure upload foundation.
- Added semantic audit at `docs/migration/phase4-semantic-audit.md`.
- Route guard smoke checks on compiled `dist/app.js`: `GET /health` returned 200; `GET /api/penelitian`, `GET /api/usulan-penelitian`, `GET /api/pengabdian`, `GET /api/usulan-pengabdian`, `GET /api/usulan/search-anggota?keyword=rid`, and `GET /api/proposals/00000000-0000-4000-8000-000000000000/jadwal` returned 401 legacy auth envelopes; `POST /api/penelitian` without CSRF returned 403 legacy CSRF envelope.
- Full create/update/submit/detail/search/by-prodi/forward/nested section parity checks require a migrated MySQL fixture and seeded credentials. `npm.cmd start` currently fails with `ECONNREFUSED ::1:3306` and `ECONNREFUSED 127.0.0.1:3306`.

## Phase 5 Notes

- Implemented advanced workflow modules for proposal review, laporan-usulan, proposal final PDF, official signatures, HKI, HKI review, monev proposal, admin monev, dashboard, admin dashboard, audit log browsing, and bulk import.
- Added Phase 5 models, associations, routes, schemas, services, controllers, migrations, permission seeds, seeder mappings, manual SQL patches, and API docs schema output.
- Added semantic audit at `docs/migration/phase5-semantic-audit.md`.
- Review approval preserves laporan-usulan and notification side effects; review decline/resubmit keeps legacy catatan/status behavior in services.
- Laporan, final PDF, signature, HKI, and monev upload surfaces use the secure upload foundation with size, MIME, magic-byte, UUID filename, path guard, route rate limit, and safe static header behavior.
- Final PDF generation uses the migrated richtext parser and official signature lookup before writing public PDF URLs.
- Bulk import preserves hidden selected-member enforcement and rejects missing or tampered selected-member/role metadata before transaction writes.
- Route guard smoke checks on compiled `dist/app.js`: `GET /health` returned 200; Phase 5 authenticated GET routes returned 401 legacy auth envelopes; bulk import POST routes without CSRF returned 403 legacy CSRF envelopes.
- Direct database availability check returned `SequelizeConnectionRefusedError` with parent code `ECONNREFUSED`; full DB-backed review/laporan/PDF/signature/HKI/monev/dashboard/audit/bulk-import tamper checks require a migrated MySQL fixture and seeded credentials.

## Phase 6 Notes

- Added cutover runbook at `docs/migration/cutover-runbook.md`.
- Added rollback runbook at `docs/migration/rollback-runbook.md`.
- Added parity report at `docs/migration/parity-report.md`.
- Added repeatable local checks: `npm.cmd run phase6:smoke` and `npm.cmd run phase6:migration-check`.
- Fixed the Phase 1 `user_roles` SQL patch to include `SET FOREIGN_KEY_CHECKS = 0` and `SET FOREIGN_KEY_CHECKS = 1` because it declares foreign keys.
- Local route guard fixture captured `/health`, auth, RBAC, master data admin, upload, proposal aliases, nested proposal section, search anggota, proposal review, laporan, PDF, official signatures, HKI, monev, dashboard, auditlog, and bulk import guard behavior.
- Legacy DB readiness check from `sipriti_backend` returned `SequelizeConnectionRefusedError` with `connect ECONNREFUSED 127.0.0.1:3306`; new backend DB readiness also returned `SequelizeConnectionRefusedError` with parent code `ECONNREFUSED`.
- Production cutover is not fully ready until the DB-backed old/new response fixture matrix in `docs/migration/parity-report.md` is replayed and shows no contract drift.
