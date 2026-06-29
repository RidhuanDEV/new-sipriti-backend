# Full End-to-End Endpoint & Logic Audit

Date: 2026-06-05

Legacy source of truth: `sipriti_backend`

New backend target: `new_sipriti_backend`

## Verdict

Status: PASS WITH ONE DOCUMENTED LEGACY DEFECT.

The migrated backend now passes the covered Phase 6 DB-backed parity matrix, route/guard smoke matrix, and manual authenticated parity checks for the endpoint surfaces that were previously reported as gaps.

One runtime difference is intentionally documented instead of copied: legacy `GET /api/admin/usulan` fails locally with `ReferenceError: TahunAkademik is not defined`, while the new backend returns the working aggregate response. This is a legacy runtime defect, not business logic that should be reproduced.

## Audit Method

- Compared legacy active mounts from `sipriti_backend/src/routes/index.js` and `sipriti_backend/src/routes/admin.routes.js`.
- Compared legacy module route files, schemas, services, serializers, permissions, and side effects against the new module structure.
- Re-ran DB-backed old/new HTTP parity with legacy DB `sipriti_db` and new DB `new_sipriti_db`.
- Re-ran route/guard smoke checks and migration/SQL patch static checks.
- Manually replayed previously missing surfaces with authenticated old/new requests: root, register, auth profile/admin endpoints, RBAC compatibility routes, admin usulan, and products.

## Runtime Verification Evidence

| check | command | result |
| --- | --- | --- |
| DB migration rerun | `npm.cmd run db:migrate` | PASS; no migrations were executed, database schema was already up to date |
| Build | `npm.cmd run build` | PASS |
| OpenAPI schema sync | `npm.cmd run api-docs` | PASS; synced 203 Zod schemas |
| Unit/contract tests | `npm.cmd test` | PASS; 14 tests passed |
| Migration and SQL patch check | `npm.cmd run phase6:migration-check` | PASS; 16 migrations and 11 SQL patches, 0 failed |
| Route/guard smoke matrix | `npm.cmd run phase6:smoke` | PASS; 30/30 checks passed |
| DB-backed critical HTTP parity | `npm.cmd run phase6:http-parity` | PASS; 20/20 old/new checks passed |
| Manual previous-gap parity | inline authenticated old/new HTTP parity replay | PASS; 22/22 checks passed with one documented legacy defect |

## Gap Closure Register

| id | status | area | finding | resolution |
| --- | --- | --- | --- | --- |
| GAP-E2E-001 | FIXED | Root | Legacy `GET /api/` returns `API PRPM`; new backend had no equivalent route. | Added root compatibility handler and verified old/new response parity. |
| GAP-E2E-002 | FIXED | Auth register | Legacy register has a runtime schema/service mismatch around `role_id` and currently fails with legacy validation messages. | New register now accepts the same request shape and preserves the same runtime error contract instead of creating a divergent user. |
| GAP-E2E-003 | FIXED | Auth profile/password/admin user | Legacy profile, password, admin detail/update/deactivate/restore endpoints were missing. | Added legacy auth and `/api/users` alias surfaces; manual authenticated parity passed. |
| GAP-E2E-004 | FIXED | Auth logout guard | Legacy logout is authenticated; new logout was public/idempotent. | Restored guarded legacy-compatible behavior and verified through parity/smoke checks. |
| GAP-E2E-005 | FIXED | RBAC | Legacy `/api/rbac/*` compatibility surface was missing or too strict on seeded IDs. | Added RBAC compatibility routes and relaxed param validation to legacy string IDs; manual parity passed. |
| GAP-E2E-006 | FIXED WITH LEGACY DEFECT NOTE | Admin usulan aggregate | Legacy `/api/admin/usulan`, `/statistics`, and `/:id` were missing. | Added aggregate routes. Statistics passes old/new parity. Local legacy list endpoint returns 500 due missing `TahunAkademik` import; new returns 200 and the defect is documented rather than copied. |
| GAP-E2E-007 | FIXED | Product example | Legacy `/api/products` CRUD was missing. | Added compatibility CRUD route and verified list/create/detail/update/delete parity. |
| GAP-E2E-008 | FIXED | Proposal access policy | New policy had become stricter than the legacy `assertProposalAccess` branch. | Restored legacy-compatible access branch while keeping policy logic outside controllers. |
| GAP-E2E-009 | FIXED | Runtime parity | Earlier audit was blocked by MySQL connection refusal. | User restarted localhost DB; DB-backed parity now passes. |
| GAP-E2E-010 | FIXED | Permission metadata | RBAC permission groups drifted because copied fixture rows did not refresh metadata and two new permissions had null module. | Fixture copy now updates role/permission metadata; migration and SQL patch backfill HKI permission metadata. |

## Endpoint And Logic Checklist

| legacy group | legacy endpoint surface | new endpoint surface | audit status | notes |
| --- | --- | --- | --- | --- |
| Root | `GET /api/` | Present | PASS | Response preserved. |
| Auth public | `POST /api/auth/register`, `POST /api/auth/login` and `/api/users` aliases | Present | PASS | Login returns legacy `data.user` and cookies. Register preserves current legacy runtime failure contract. |
| Auth session | `GET /api/auth/me`, `POST /api/auth/logout`, `/api/users/me`, `/api/users/logout` | Present | PASS | Auth guard and response contract verified. |
| Auth profile/password | `PUT /api/auth/change-password`, `PUT /api/auth/profile` and aliases | Present | PASS | Manual parity passed. |
| Auth admin user | `/api/auth/admin/list`, `/api/auth/admin/:id`, update, deactivate, restore and aliases | Present | PASS | Admin list covered by DB parity; detail/update/deactivate/restore covered by manual parity. |
| User CRUD addition | New `/api/users` CRUD outside legacy auth alias | Present | PASS WITH ADDITION | Additive new backend surface; does not replace legacy auth alias behavior. |
| Proposal base | `POST /api/proposal`, invite/respond/review | Present | PASS | Phase 4 logic kept in services/policies. |
| Invites | `/api/invites/getMyInvites`, accept, reject | Present | PASS | Legacy invite side effects preserved for proposal core. |
| Notifications | list, unread count, read all, read, accept/reject invite | Present | PASS | `unread-count` covered by DB parity. |
| Penelitian | `/api/penelitian/*` and `/api/usulan-penelitian/*` | Present | PASS | Alias paths preserved. |
| Pengabdian | `/api/pengabdian/*` and `/api/usulan-pengabdian/*` | Present | PASS | Alias paths preserved. |
| Nested proposal sections | `/api/proposals/:id/penelitian`, `pengabdian`, `jadwal`, `luaran`, `rab` | Present | PASS | Nested section routes preserved with legacy access behavior. |
| Search anggota | `GET /api/usulan/search-anggota` | Present | PASS | Empty keyword behavior and compact result shape migrated. |
| HKI | `/api/hki`, detail, create, update, delete, submit | Present | PASS | Route and permission contract migrated. |
| Proposal review | stats, list, user revisi/approved, resubmit, detail, approve, decline | Present | PASS | Source truth uses `/decline`; preserved. |
| Laporan usulan | list, detail, create, update, validate | Present | PASS | Static route and service contract migrated. |
| Proposal final PDF | user/admin PDF endpoints | Present | PASS | Endpoint contract migrated; real binary rendering still belongs in FE/UAT smoke. |
| Monev proposal | `/api/monev/*` proposal monev endpoints | Present | PASS | Route/source match. |
| Admin monev | `/api/admin/monev/*` | Present | PASS | Route/source match, including upload surface. |
| Admin usulan aggregate | `/api/admin/usulan`, statistics, detail | Present | PASS WITH LEGACY DEFECT NOTE | New endpoint works; old list endpoint fails locally due missing `TahunAkademik` import. |
| Dashboard | `/api/dashboard/latest-statuses`, `/api/dashboard/counts` | Present | PASS | `counts` covered by DB parity. |
| Admin dashboard | stats, skema/prodi stats, recent activity, tahun options | Present | PASS | `stats` covered by DB parity. |
| Audit logs | `/api/audit-logs`, `/api/audit-logs/:id` | Present | PASS | Legacy response fields restored; list covered by DB parity. |
| RBAC | `/api/rbac/*` permissions, roles, role permissions, role users, user roles | Present | PASS | Legacy string IDs, response groups, and role-user surfaces verified. |
| Master prodi | `/api/admin/prodi/*`, `/api/prodi/options` | Present | PASS | Options covered by DB parity. |
| Master skema | `/api/admin/skema/*`, `/api/skema/options` | Present | PASS | Options covered by DB parity. |
| Master bidang fokus | `/api/admin/bidang-fokus/*`, `/api/bidang-fokus/options` | Present | PASS | Options covered by DB parity. |
| Tahun akademik | list/all/detail/create/update/delete | Present | PASS | Route/source match. |
| Output | `/api/outputs`, options, detail, create, update, delete | Present | PASS | Route/source match. |
| Sertifikat mutu | list/all/detail/create/update/delete | Present | PASS | Route/source match. |
| Public berita | list/detail/create/update/delete | Present | PASS | List covered by DB parity. |
| Public pengumuman | list/detail/create/update/delete | Present | PASS | List covered by DB parity. |
| Public panduan | list/detail/create/update/delete | Present | PASS | List covered by DB parity. |
| Public page aggregate | `/api/publicpage/berita`, `pengumuman`, `panduan` | Present | PASS | `berita` covered by DB parity. |
| Upload image/richtext | image/images/delete, richtext upload/delete | Present | PASS | Security validation migrated; real upload files should be replayed during FE/UAT. |
| Files | `/api/files/path/:subdir/:filename`, `/api/files/:id` | Present | PASS | Public URL shape preserved with safe static headers. |
| Carousel | admin, public list/detail, create/update/delete | Present | PASS | Route/source match. |
| Landing slider | admin, public list/detail, create/update/delete | Present | PASS | Route/source match. |
| Capaian | pivot/stats/static/deskripsi endpoints | Present | PASS | Route/source match. |
| Kategori publikasi | list/detail/create/update/delete | Present | PASS | Route/source match. |
| Publikasi | list, upsert | Present | PASS | Route/source match. |
| Mitra kerja riset | list/all/detail/create/update/delete | Present | PASS | Route/source match. |
| Product riset | list/all/detail/create/update/delete | Present | PASS | Route/source match. |
| Penghargaan riset | list/all/detail/create/update/delete | Present | PASS | Route/source match. |
| Hibah internal | list/detail/create/update/delete | Present | PASS | Route/source match. |
| Official signatures | admin signatures CRUD/file/activate/deactivate | Present | PASS | Migrated Phase 5 contract. |
| HKI review | stats/all/list/detail/approve/reject | Present | PASS | Route/source match. |
| Bulk import | `/api/admin/usulan/import/template`, `/api/admin/usulan/import` | Present | PASS | Hidden-sheet selected-member enforcement preserved; real tamper workbook should be replayed during FE/UAT. |
| Product example | `/api/products` CRUD | Present | PASS | Manual list/create/detail/update/delete parity passed. |

## Remaining UAT Focus

- Replay real frontend flows for ketua, accepted member, prodi coordinator, reviewer, admin, and operator accounts.
- Replay real upload files, generated PDFs, signature files, and bulk-import tamper workbooks against `new_sipriti_db`.
- Treat any new frontend-observed response shape drift as a bug unless explicitly approved as a new backend addition.
