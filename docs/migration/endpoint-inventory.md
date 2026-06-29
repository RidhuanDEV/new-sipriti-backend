# Endpoint Migration Inventory

This inventory controls migration ownership and status. The complete legacy endpoint list is sourced from `sipriti_backend/md/API_ENDPOINT_INVENTORY_COMPLETE.md`, which was built from mounted routes in `sipriti_backend/src/routes/index.js`.

Base prefix: `/api`

Status values:

- `not_started`
- `inventory_verified`
- `migrated`
- `parity_verified`
- `deferred`

## Migration Groups

| legacy_module | legacy_mount | method_scope | auth | permission_source | request_source | response_source | new_module | phase | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| root | `/api/` | GET | No | none | `src/routes/index.js` | inline route | routes | 1 | inventory_verified |
| auth | `/api/auth`, `/api/users` | POST/GET/PUT/DELETE | Mixed | `auth.routes.js`, `rbac.js` | `src/modules/auth/auth.schema.js` | `auth.controller.js`, `auth.service.js` | auth | 1 | inventory_verified |
| proposal | `/api/proposal` | POST | Yes | `proposal.routes.js` | `proposal.schema.js` | `proposal.controller.js`, `proposal.service.js` | proposal | 4 | migrated |
| invites | `/api/invites` | GET/POST | Yes | `invites.routes.js` | route params | notification/proposal services | invites | 4 | migrated |
| monev proposal | `/api/monev` | GET/POST | Yes | `monevproposal.routes.js` | `monevproposal.schema.js` | `monevproposal.controller.js` | monevproposal | 5 | inventory_verified |
| dashboard | `/api/dashboard` | GET | Yes | `dashboard.routes.js` | query | `dashboard.controller.js` | dashboard | 5 | inventory_verified |
| notifications | `/api/notifications` | GET/PUT | Yes | `notification.routes.js` | params/body | `notification.controller.js` | notification | 4 | migrated |
| penelitian | `/api/penelitian`, `/api/usulan-penelitian` | GET/POST/PUT/DELETE | Mixed | `research.routes.js` | `research.schema.js` | `research.controller.js`, `research.service.js` | research | 4 | migrated |
| pengabdian | `/api/pengabdian`, `/api/usulan-pengabdian` | GET/POST/PUT/DELETE | Mixed | `pengabdian.routes.js` | `pengabdian.schema.js` | `pengabdian.controller.js`, `pengabdian.service.js` | pengabdian | 4 | migrated |
| hki | `/api/hki` | GET/POST/PUT/DELETE | Yes | `hki.routes.js` | `hki.schema.js` | `hki.controller.js`, `hki.service.js` | hki | 5 | inventory_verified |
| hibah internal | `/api/hibah-internal` | GET/POST/PUT/DELETE | Mixed | `hibahinternal.routes.js` | `hibahinternal.schema.js` | `hibahinternal.controller.js` | hibahinternal | 3 | migrated |
| berita | `/api/berita` | GET/POST/PUT/DELETE | Mixed | `berita.routes.js` | `berita.schema.js` | `berita.controller.js` | berita | 3 | migrated |
| pengumuman | `/api/pengumuman` | GET/POST/PUT/DELETE | Mixed | `pengumuman.routes.js` | `pengumuman.schema.js` | `pengumuman.controller.js` | pengumuman | 3 | migrated |
| panduan | `/api/panduan` | GET/POST/PUT/DELETE | Mixed | `panduan.routes.js` | `panduan.schema.js` | `panduan.controller.js` | panduan | 3 | migrated |
| upload | `/api/upload`, `/api/upload/richtext` | POST/DELETE | Yes | upload routes and inline routes | `upload.schema.js` | `upload.controller.js`, `upload.richtext.controller.js` | upload | 3 | migrated |
| kategori publikasi | `/api/kategori-publikasi` | GET/POST/PUT/DELETE | Mixed | `kategoripublikasi.routes.js` | `kategoripublikasi.schema.js` | `kategoripublikasi.controller.js` | kategoripublikasi | 3 | migrated |
| publikasi | `/api/publikasi` | GET/POST | Mixed | `publikasi.routes.js` | `publikasi.schema.js` | `publikasi.controller.js` | publikasi | 3 | migrated |
| mitra kerja riset | `/api/mitra-kerja-riset` | GET/POST/PUT/DELETE | Mixed | `mitrakerjariset.routes.js` | `mitrakerjariset.schema.js` | `mitrakerjariset.controller.js` | mitrakerjariset | 3 | migrated |
| product riset | `/api/product-riset` | GET/POST/PUT/DELETE | Mixed | `productriset.routes.js` | `productriset.schema.js` | `productriset.controller.js` | productriset | 3 | migrated |
| tahun akademik | `/api/tahun-akademik` | GET/POST/PUT/DELETE | Mixed | `tahunakademik.routes.js` | `tahunakademik.schema.js` | `tahunakademik.controller.js` | tahunakademik | 2 | migrated |
| capaian | `/api/capaian` | GET/PUT | Mixed | `capaian.routes.js` | `capaian.schema.js` | `capaian.controller.js` | capaian | 3 | migrated |
| carousel | `/api/carousel` | GET/POST/PUT/DELETE | Mixed | `carousel.routes.js` | `carousel.schema.js` | `carousel.controller.js` | carousel | 3 | migrated |
| landing slider | `/api/landing-slider` | GET/POST/PUT/DELETE | Mixed | `landingslider.routes.js` | `landingslider.schema.js` | `landingslider.controller.js` | landingslider | 3 | migrated |
| sertifikat mutu | `/api/sertifikat-mutu` | GET/POST/PUT/DELETE | Mixed | `sertifikatmutu.routes.js` | `sertifikatmutu.schema.js` | `sertifikatmutu.controller.js` | sertifikatmutu | 2 | migrated |
| penghargaan riset | `/api/penghargaan-riset` | GET/POST/PUT/DELETE | Mixed | `penghargaanriset.routes.js` | `penghargaanriset.schema.js` | `penghargaanriset.controller.js` | penghargaanriset | 3 | migrated |
| admin aggregate | `/api/admin` | GET/POST/PUT/DELETE | Yes | `admin.routes.js` | module schemas | admin route controllers | admin/master-data | 2/5 | migrated for `/prodi`, `/skema`, `/bidang-fokus`; remaining admin aggregate deferred to Phase 5 |
| admin dashboard | `/api/admin/dashboard` | GET | Yes | `admin-dashboard.routes.js` | query | `admin-dashboard.controller.js` | admin-dashboard | 5 | inventory_verified |
| rbac | `/api/rbac` | GET/POST/PUT/DELETE | Yes | `rbac.routes.js` | `rbac.schema.js` | `rbac.controller.js`, `rbac.service.js` | roles/permissions/rbac | 1 | inventory_verified |
| proposal review | `/api/proposal-review` | GET/POST | Yes | `proposal-review.routes.js` | `proposal-review.schema.js` | `proposal-review.controller.js` | proposal-review | 5 | inventory_verified |
| hki review | `/api/hki-review` | GET/POST | Yes | `hki-review.routes.js` | `hki-review.schema.js` | `hki-review.controller.js` | hki-review | 5 | inventory_verified |
| options | `/api/prodi/options`, `/api/skema/options`, `/api/bidang-fokus/options` | GET | No | `options.routes.js` | query | master data controllers | options/master-data | 2 | migrated |
| product example | `/api/products` | GET/POST/PUT/DELETE | No | `product.routes.js` | `product.schema.js` | `product.controller.js` | deferred | 6 | deferred |
| laporan usulan | `/api/laporan-usulan` | GET/POST/PUT | Yes | `laporan-usulan.routes.js` | `laporan-usulan.schema.js` | `laporan-usulan.controller.js` | laporan-usulan | 5 | inventory_verified |
| audit logs | `/api/audit-logs` | GET | Yes | `auditlog.routes.js` | query/params | `auditlog.controller.js` | auditlog | 5 | inventory_verified |
| search anggota | `/api/usulan/search-anggota` | GET | Yes | inline route + `search-anggota.schema.js` | query | `search-anggota.controller.js` | search-anggota | 4 | migrated |

## Alias Prefixes That Must Be Preserved

| alias_prefix | primary_prefix | migration_rule |
| --- | --- | --- |
| `/api/users` | `/api/auth` | Keep alias until frontend no longer calls it. |
| `/api/usulan-penelitian` | `/api/penelitian` | Keep full route parity. |
| `/api/usulan-pengabdian` | `/api/pengabdian` | Keep full route parity. |

## Accuracy Notes From Legacy Inventory

- `src/modules/monev-internal/monev-internal.routes.js` exists but is not mounted directly; active monev internal endpoints are mounted through `/api/admin/monev`.
- `proposal-review.routes.js` has a potential route-order collision where `/:type/:id` may catch `/user/revisi` and `/user/approved`.
- All `/api` endpoints pass through global `csrfProtection` and `auditMiddleware()` in the legacy backend.
- Public endpoints still pass through global middleware for safe methods such as GET.

## Phase 4 Endpoint Matrix

Source of truth: `sipriti_backend/src/routes/index.js` and the module route files under `sipriti_backend/src/modules`.

### Proposal Base

| method | legacy_url | auth | permissions | request contract | response contract | new handler |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/proposal` | yes | `create_proposal` | multipart form; `judul`; optional proposal file stored as `/uploads/proposals/:filename` | legacy proposal create envelope with message `Proposal berhasil dibuat` | `src/modules/proposal/proposal.routes.ts` |
| POST | `/api/proposal/:proposalId/invite` | yes | `create_proposal` | params `proposalId`; invite body from `inviteMemberSchema` | legacy invite/member response | `src/modules/proposal/proposal.routes.ts` |
| POST | `/api/proposal/:proposalId/respond` | yes | `view_proposal` | params `proposalId`; respond body from `respondInviteSchema` | legacy invite response envelope | `src/modules/proposal/proposal.routes.ts` |
| POST | `/api/proposal/:proposalId/review` | yes | `review_proposal` | params `proposalId`; review body from `adminReviewSchema` | legacy review response envelope | `src/modules/proposal/proposal.routes.ts` |

### Invites And Notifications

| method | legacy_url | auth | permissions | request contract | response contract | new handler |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/invites/getMyInvites` | yes | `view_proposal` | none | legacy invite list | `src/modules/invites/invites.routes.ts` |
| POST | `/api/invites/:id/accept` | yes | authenticated user | params `id` | legacy accept invite result | `src/modules/invites/invites.routes.ts` |
| POST | `/api/invites/:id/reject` | yes | authenticated user | params `id` | legacy reject invite result | `src/modules/invites/invites.routes.ts` |
| GET | `/api/notifications` | yes | authenticated user | none | legacy notification list | `src/modules/notification/notification.routes.ts` |
| GET | `/api/notifications/unread-count` | yes | authenticated user | none | legacy unread count | `src/modules/notification/notification.routes.ts` |
| PUT | `/api/notifications/read-all` | yes | authenticated user | none | legacy mark all read result | `src/modules/notification/notification.routes.ts` |
| PUT | `/api/notifications/:id/read` | yes | authenticated user | params `id` | legacy mark read result | `src/modules/notification/notification.routes.ts` |
| PUT | `/api/notifications/:id/accept-invite` | yes | authenticated user | params `id` | legacy accept invite result | `src/modules/notification/notification.routes.ts` |
| PUT | `/api/notifications/:id/reject-invite` | yes | authenticated user | params `id` | legacy reject invite result | `src/modules/notification/notification.routes.ts` |

### Penelitian

All rows are mounted twice and must remain equivalent: `/api/penelitian/*` and `/api/usulan-penelitian/*`.

| method | legacy_url | auth | permissions | request contract | response contract | new handler |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/landing` | public | public limiter | query pagination/search | public landing serializer only | `src/modules/research/research.routes.ts` |
| GET | `/` | yes | `view_penelitian`, `manage_penelitian`, or `edit_usulan_by_prodi` | list query | legacy user proposal list | `src/modules/research/research.routes.ts` |
| GET | `/options` | yes | authenticated user | none | legacy dropdown options | `src/modules/research/research.routes.ts` |
| POST | `/` | yes | `submit_proposal` or `create_proposal` | `createResearchSchema` | legacy create usulan penelitian envelope | `src/modules/research/research.routes.ts` |
| PUT | `/:id` | yes | `edit_proposal` or `edit_usulan_by_prodi` | params `id`; `updateResearchSchema` | legacy update usulan penelitian envelope | `src/modules/research/research.routes.ts` |
| GET | `/detail?id=:id` | yes | `view_penelitian`, `manage_penelitian`, or `edit_usulan_by_prodi` | query `id` | legacy penelitian detail serializer | `src/modules/research/research.routes.ts` |
| POST | `/:id/submit` | yes | `submit_proposal` or `create_proposal` | params `id` | legacy submit response | `src/modules/research/research.routes.ts` |
| DELETE | `/:id` | yes | `delete_proposal` | params `id` | legacy delete response | `src/modules/research/research.routes.ts` |
| POST | `/search` | yes | `view_penelitian` or `manage_penelitian` | `proposalSearchBodySchema` | legacy proposal search result | `src/modules/research/research.routes.ts` |
| GET | `/by-prodi` | yes | `view_penelitian` or `edit_usulan_by_prodi` | `proposalByProdiQuerySchema` | legacy prodi-scoped list | `src/modules/research/research.routes.ts` |
| POST | `/:id/forward` | yes | `forward_usulan_penelitian` or `manage_proposal` | params `id` | legacy forward response and laporan-usulan side effect | `src/modules/research/research.routes.ts` |

### Pengabdian

All rows are mounted twice and must remain equivalent: `/api/pengabdian/*` and `/api/usulan-pengabdian/*`.

| method | legacy_url | auth | permissions | request contract | response contract | new handler |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/landing` | public | public limiter | query pagination/search | public landing serializer only | `src/modules/pengabdian/pengabdian.routes.ts` |
| GET | `/` | yes | `view_pengabdian`, `manage_pengabdian`, or `edit_usulan_by_prodi` | list query | legacy user proposal list | `src/modules/pengabdian/pengabdian.routes.ts` |
| GET | `/options` | yes | authenticated user | none | legacy dropdown options | `src/modules/pengabdian/pengabdian.routes.ts` |
| GET | `/by-prodi` | yes | `view_pengabdian` or `edit_usulan_by_prodi` | `proposalByProdiQuerySchema` | legacy prodi-scoped list | `src/modules/pengabdian/pengabdian.routes.ts` |
| POST | `/` | yes | `submit_proposal` or `create_proposal` | `createPengabdianSchema` | legacy create usulan pengabdian envelope | `src/modules/pengabdian/pengabdian.routes.ts` |
| PUT | `/:id` | yes | `edit_proposal` or `edit_usulan_by_prodi` | params `id`; `updatePengabdianSchema` | legacy update usulan pengabdian envelope | `src/modules/pengabdian/pengabdian.routes.ts` |
| GET | `/:id` | yes | `view_pengabdian`, `manage_pengabdian`, or `edit_usulan_by_prodi` | params `id` | legacy pengabdian detail serializer | `src/modules/pengabdian/pengabdian.routes.ts` |
| POST | `/:id/submit` | yes | `submit_proposal` or `create_proposal` | params `id` | legacy submit response | `src/modules/pengabdian/pengabdian.routes.ts` |
| POST | `/:id/forward` | yes | `forward_usulan_pengabdian` or `manage_proposal` | params `id` | legacy forward response and laporan-usulan side effect | `src/modules/pengabdian/pengabdian.routes.ts` |
| DELETE | `/:id` | yes | `delete_proposal` | params `id` | legacy delete response | `src/modules/pengabdian/pengabdian.routes.ts` |
| POST | `/search` | yes | `view_pengabdian` or `manage_pengabdian` | `proposalSearchBodySchema` | legacy proposal search result | `src/modules/pengabdian/pengabdian.routes.ts` |

### Nested Proposal Sections

All rows preserve the nested parent id URL form `/api/proposals/:id/*` and read business rules from proposal services/policies.

| method | legacy_url | auth | permissions | request contract | response contract | new handler |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/proposals/:id/penelitian` | yes | view/manage/create/edit/prodi/forward penelitian permission set | params `id` | legacy raw section envelope | `src/modules/penelitian-proposal/penelitian-proposal.routes.ts` |
| PUT | `/api/proposals/:id/penelitian` | yes | manage/create/edit/prodi/forward penelitian permission set | params `id`; section body | legacy raw upsert envelope | `src/modules/penelitian-proposal/penelitian-proposal.routes.ts` |
| GET | `/api/proposals/:id/pengabdian` | yes | view/manage/create/edit/prodi/forward pengabdian permission set | params `id` | legacy raw section envelope | `src/modules/pengabdian-proposal/pengabdian-proposal.routes.ts` |
| PUT | `/api/proposals/:id/pengabdian` | yes | manage/create/edit/prodi/forward pengabdian permission set | params `id`; section body | legacy raw upsert envelope | `src/modules/pengabdian-proposal/pengabdian-proposal.routes.ts` |
| GET | `/api/proposals/:id/jadwal` | yes | shared view/manage/create/edit/prodi/forward permission set | params `id` | legacy schedule list | `src/modules/jadwal-proposal/jadwal-proposal.routes.ts` |
| PUT | `/api/proposals/:id/jadwal` | yes | shared manage/create/edit/prodi/forward permission set | params `id`; bulk schedule body | legacy bulk upsert envelope | `src/modules/jadwal-proposal/jadwal-proposal.routes.ts` |
| GET | `/api/proposals/:id/luaran` | yes | shared view/manage/create/edit/prodi/forward permission set | params `id` | legacy luaran list | `src/modules/luaran-proposal/luaran-proposal.routes.ts` |
| PUT | `/api/proposals/:id/luaran` | yes | shared manage/create/edit/prodi/forward permission set | params `id`; bulk luaran body | legacy bulk upsert envelope | `src/modules/luaran-proposal/luaran-proposal.routes.ts` |
| GET | `/api/proposals/:id/rab` | yes | shared view/manage/create/edit/prodi/forward permission set | params `id` | legacy RAB list and total | `src/modules/rab-proposal/rab-proposal.routes.ts` |
| POST | `/api/proposals/:id/rab` | yes | shared manage/create/edit/prodi/forward permission set | params `id`; RAB rows body | legacy RAB upsert envelope | `src/modules/rab-proposal/rab-proposal.routes.ts` |

### Search Anggota

| method | legacy_url | auth | permissions | request contract | response contract | new handler |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/usulan/search-anggota` | yes | authenticated user | query `keyword`; empty keyword returns an empty array | legacy compact member search array | `src/modules/search-anggota/search-anggota.routes.ts` |

## Phase 5 Endpoint Matrix

Source of truth: legacy Phase 5 route files under `sipriti_backend/src/modules/*` plus the active mounts in `sipriti_backend/src/routes/index.js` and `sipriti_backend/src/routes/admin.routes.js`.

### Proposal Review

| method | legacy_url | auth | permissions | request contract | response contract | new handler |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/proposal-review/stats/:type` | yes | `review_proposal` or `manage_penelitian` or `manage_pengabdian` | params `type=penelitian|pengabdian|hki|all`; optional filters | status count object | `src/modules/proposal-review/proposal-review.routes.ts` |
| GET | `/api/proposal-review/:type` | yes | same as stats | params `type`; list filters/pagination | review list rows plus pagination/counts | `src/modules/proposal-review/proposal-review.routes.ts` |
| GET | `/api/proposal-review/user/revisi` | yes | authenticated user | pagination/type filters | declined proposals where user is Ketua | `src/modules/proposal-review/proposal-review.routes.ts` |
| GET | `/api/proposal-review/user/approved` | yes | authenticated user | pagination/type filters | approved Ketua proposal report rows | `src/modules/proposal-review/proposal-review.routes.ts` |
| POST | `/api/proposal-review/user/:id/resubmit` | yes | authenticated user | params `id` | `{ id, status }` | `src/modules/proposal-review/proposal-review.routes.ts` |
| GET | `/api/proposal-review/:type/:id` | yes | `review_proposal` or manage permissions | params `type`, `id` | proposal detail review serializer | `src/modules/proposal-review/proposal-review.routes.ts` |
| POST | `/api/proposal-review/:type/:id/approve` | yes | `approve_proposal` | optional `catatan` | `{ id, status: "Approved" }` and laporan side effect | `src/modules/proposal-review/proposal-review.routes.ts` |
| POST | `/api/proposal-review/:type/:id/decline` | yes | `approve_proposal` | required `catatan` | `{ id, status: "Declined", catatan }` | `src/modules/proposal-review/proposal-review.routes.ts` |

### Laporan Usulan And PDF

| method | legacy_url | auth | permissions | request contract | response contract | new handler |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/laporan-usulan` | yes | `view_proposal` or `manage_penelitian` or `manage_pengabdian` or `edit_usulan_by_prodi` | filters/pagination | laporan rows plus pagination | `src/modules/laporan-usulan/laporan-usulan.routes.ts` |
| GET | `/api/laporan-usulan/:id` | yes | same as list | params `id` | laporan detail row | `src/modules/laporan-usulan/laporan-usulan.routes.ts` |
| POST | `/api/laporan-usulan` | yes | `create_proposal` or `edit_proposal` | query/body `jenis_laporan`, `haki_proposal_id`, optional file/link | created laporan status object | `src/modules/laporan-usulan/laporan-usulan.routes.ts` |
| PUT | `/api/laporan-usulan/:id` | yes | `create_proposal` or `edit_proposal` | params `id`; optional file/link | updated laporan status object | `src/modules/laporan-usulan/laporan-usulan.routes.ts` |
| PUT | `/api/laporan-usulan/:id/validate` | yes | `manage_penelitian` or `manage_pengabdian` or `review_proposal` | status `Sesuai|Revisi`, catatan required for `Revisi` | validation result object | `src/modules/laporan-usulan/laporan-usulan.routes.ts` |
| GET | `/api/proposal-final-pdf/user/:id` | yes | authenticated user | params `id` | binary PDF attachment | `src/modules/proposal-final-pdf/proposal-final-pdf.routes.ts` |
| GET | `/api/proposal-final-pdf/admin/:id` | yes | admin role | params `id` | binary PDF attachment | `src/modules/proposal-final-pdf/proposal-final-pdf.routes.ts` |

### Signatures, HKI, Monev, Dashboards, Audit, Bulk Import

| method | legacy_url | auth | permissions | request contract | response contract | new handler |
| --- | --- | --- | --- | --- | --- | --- |
| GET/POST/PATCH/DELETE | `/api/admin/signatures/*` | yes | `manage_signature` | PNG signature body/file; `kode_prodi` scoped | signature rows and inline file | `src/modules/official-signatures/official-signatures.routes.ts` |
| GET/POST/PUT/DELETE | `/api/hki/*` | yes | HKI permission set | HKI fields plus upload file fields | user HKI rows/detail/mutation results | `src/modules/hki/hki.routes.ts` |
| GET/POST | `/api/hki-review/*` | yes | `view_hki`, `manage_hki`, `approve_hki` | review filters and approve/reject catatan | HKI review rows/stats/actions | `src/modules/hki-review/hki-review.routes.ts` |
| GET/POST | `/api/monev/*` | yes | `view_monev` or `manage_monev` | proposal id plus anggota/RAB body | proposal monev detail/list/action rows | `src/modules/monevproposal/monevproposal.routes.ts` |
| GET/POST/PUT/DELETE | `/api/admin/monev/*` | yes | `manage_monev` plus view detail | monev schedule body and PDF upload fields | monev rows/detail/upload status | `src/modules/monev-internal/monev-internal.routes.ts` |
| GET | `/api/dashboard/*` | yes | `view_dashboard` | pagination filters | latest statuses and counts | `src/modules/dashboard/dashboard.routes.ts` |
| GET | `/api/admin/dashboard/*` | yes | `view_admin_dashboard` | tahun/tipe filters | admin stats rows | `src/modules/admin-dashboard/admin-dashboard.routes.ts` |
| GET | `/api/audit-logs/*` | yes | `view_audit_log` | query filters or params `id` | audit log rows/detail and pagination | `src/modules/auditlog/auditlog.routes.ts` |
| POST | `/api/admin/usulan/import/template` | yes | `manage_penelitian` or `manage_pengabdian` | selected `anggota[]` body | XLSX attachment with hidden `Master_Anggota` policy | `src/modules/bulk-import/bulk-import.routes.ts` |
| POST | `/api/admin/usulan/import` | yes | `manage_penelitian` or `manage_pengabdian` | `.xlsx` upload | atomic import result or tamper-safe rejection | `src/modules/bulk-import/bulk-import.routes.ts` |

## Phase 6 Cutover Readiness Notes

- Endpoint registration and DB-free auth/CSRF guard smoke are covered by `npm.cmd run phase6:smoke`.
- The final smoke matrix verified 30 critical route surfaces with 0 failures.
- DB-backed old/new fixture capture passed the covered Phase 6 parity matrix with 20 total checks and 0 failures on the latest completed parity run.
- Manual replay for previously missing endpoint surfaces passed 22 total checks and 0 failures, with one documented legacy runtime defect intentionally not copied: legacy `GET /api/admin/usulan` fails locally because `TahunAkademik` is not defined in the old service.
- Current cutover evidence is summarized in `docs/migration/parity-report.md` and `docs/migration/full-end-to-end-logic-audit.md`.
