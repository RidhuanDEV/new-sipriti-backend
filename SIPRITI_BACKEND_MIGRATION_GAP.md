# SIPRITI Backend Migration Gap

Dokumen ini memetakan gap antara backend lama `sipriti_backend` dan fondasi backend baru `new_sipriti_backend` untuk migrasi penuh SIPRITI. Fokusnya adalah struktur, kontrak, dependency domain, dan guardrail migrasi agar proses pemindahan kode tidak sekadar menyalin file JavaScript lama ke TypeScript, tetapi membangun ulang kontrak backend dengan tipe yang benar.

## Ringkasan Keputusan

Backend baru sebaiknya diperlakukan sebagai target **modular monolith TypeScript strict**, bukan rewrite microservice. Struktur baru sudah punya fondasi baik: Express 5, TypeScript strict, Sequelize, Zod, DTO/mapper, repository-service-controller, request ID, Pino logger, Swagger, RBAC dasar, audit log, dan cache in-memory. Namun backend baru saat ini masih starter umum, belum merepresentasikan kapabilitas bisnis SIPRITI selain auth/user/role/permission.

Migrasi harus dilakukan capability-by-capability dengan kontrak eksplisit. Sumber kebenaran awal adalah backend lama: route mount di `src/routes/index.js`, model di `src/models`, migration di `migrations`, schema Zod per module, serta rules di `sipriti_backend/md/RULES-PERUBAHAN-CODE.md`. Setiap module yang dipindah harus menghasilkan model TypeScript, migration/SQL patch bila schema berubah, DTO request/response, mapper, policy authorization, route OpenAPI, dan update frontend bila endpoint contract berubah.

## Konteks & Asumsi

- Backend lama adalah aplikasi SIPRITI aktif berbasis CommonJS JavaScript, Express 4, Sequelize, MySQL, JWT cookie/header, CSRF, RBAC multi-role, upload lokal, PDF generation, audit middleware, dan banyak module domain.
- Backend baru adalah starter TypeScript ESM berbasis Express 5 dengan module inti `auth`, `user`, `roles`, dan `permissions`.
- File referensi perubahan kode ditemukan di `sipriti_backend/md/RULES-PERUBAHAN-CODE.md`.
- Tidak ada asumsi kompatibilitas diam-diam: endpoint, response shape, cookie behavior, permission, dan table ownership harus diturunkan dari source lama atau diputuskan eksplisit sebagai kontrak baru.
- Frontend SIPRITI kemungkinan masih bergantung pada kontrak lama seperti cookie `jwt`, CSRF header, `success/message/data/error`, URL `/api/*`, serta beberapa alias route lama.

## Snapshot Struktur Saat Ini

### Backend Baru

```text
new_sipriti_backend/src/
  app.ts
  server.ts
  config/
  constants/
  core/
    audit/
    auth/
    cache/
    database/
    errors/
    http/
    logger/
    middleware/
    validation/
  database/
    migrations/
    models/
    seeders/
  docs/
  modules/
    auth/
    permissions/
    roles/
    user/
  routes/
  scripts/
  types/
  utils/
```

### Backend Lama

Backend lama memiliki puluhan capability yang sudah di-mount di `/api`, antara lain:

- Identity & access: `auth`, `rbac`, `auditlog`, `notification`, `invites`.
- Proposal workflow: `proposal`, `research`, `pengabdian`, `penelitian-proposal`, `pengabdian-proposal`, `proposal-review`, `proposal-final-pdf`, `jadwal-proposal`, `luaran-proposal`, `rab-proposal`, `laporan-usulan`, `monevproposal`, `monev-internal`, `hki`, `hki-review`, `hibahinternal`.
- Master data: `prodi`, `skema`, `bidangfokus`, `tahunakademik`, `output`, `sertifikatmutu`.
- Public/content: `berita`, `pengumuman`, `panduan`, `publicpage`, `carousel`, `landingslider`, `capaian`, `publikasi`, `kategoripublikasi`, `mitrakerjariset`, `productriset`, `penghargaanriset`.
- File/upload: `upload`, `files`, `official-signatures`, `bulk-import`, richtext upload, static `/uploads/*`.

## Gap Struktur Utama

| Area | Kondisi Backend Baru | Kondisi Backend Lama | Gap Migrasi |
| --- | --- | --- | --- |
| Domain modules | Hanya `auth`, `user`, `roles`, `permissions` | 40+ module SIPRITI | Perlu peta bounded context dan urutan migrasi domain. |
| Models | Hanya user/role/permission/audit | Banyak model proposal, content, upload, monev, prodi, publikasi | Perlu migrasi model typed satu per satu beserta association. |
| Associations | User -> Role, Role <-> Permission | Relasi proposal/member/mahasiswa/prodi/role/user/upload jauh lebih luas | Perlu ownership relasi dan setup association baru. |
| Auth | Bearer token only | Cookie `jwt` first, bearer fallback, CSRF token, `req.user` berisi user DB + role + prodi | Perlu keputusan: pertahankan cookie/CSRF untuk frontend lama atau versi API baru. |
| RBAC | Single role pada user, permission constants minim | Multi-role via `UserRole`, permission union, cache, role hierarchy, prodi scope | Perlu desain ulang RBAC typed yang mendukung multi-role dan scope prodi. |
| Response | `success/data/meta`, error `success/message/errors` | `success/message/data/meta/error` | Perlu response contract tunggal atau compatibility adapter. |
| Upload | Belum ada upload module | Multer facade, magic byte, sanitasi path, static serving, uploaded file metadata | Perlu core upload/storage module sebelum content/proposal dipindah. |
| Audit | Audit service ada, tetapi komentar/fondasi mengarah transactional audit | Rules lama mewajibkan audit non-blocking di luar transaksi; audit lama juga punya middleware global | Perlu keputusan audit baru agar tidak kontradiktif. |
| API docs | Swagger generator dari Zod v4 | Dokumentasi endpoint lama manual di `md/API_ENDPOINT_INVENTORY_COMPLETE.md` | Perlu inventory endpoint baru dari route aktual dan mapping OpenAPI per module. |
| DB change process | Migration/seeders TypeScript di `src/database` | Migration root JS + SQL patch production + seeder + `seedRBAC` | Perlu adaptasi rules lama ke struktur baru tanpa menghilangkan SQL patch idempotent. |
| Tests | Belum terlihat test suite di backend baru | Backend lama punya `node --test` | Perlu strategy test typed untuk kontrak, service, permission, upload, dan migration smoke. |

## Kontrak yang Harus Diputuskan Sebelum Migrasi Besar

### 1. API Versioning dan Compatibility

Opsi yang dipertimbangkan:

#### Opsi A - Preserve `/api` Contract Lama

Kelebihan:
- Frontend bisa migrasi backend lebih cepat.
- Risiko perubahan UI/API lebih kecil.
- Cocok untuk cutover bertahap.

Kekurangan:
- Backend baru membawa sebagian bentuk lama seperti `message` dan cookie/CSRF.
- Perlu adapter supaya struktur TypeScript baru tidak ikut kotor oleh legacy shape.

Cocok jika target utama adalah mengganti runtime/backend tanpa rewrite frontend besar.

#### Opsi B - Buat `/api/v2` Contract Baru

Kelebihan:
- Kontrak bisa lebih bersih, versioned, dan konsisten.
- Tidak wajib mempertahankan alias lama seperti `/api/users` -> auth routes.

Kekurangan:
- Frontend harus ikut migrasi besar.
- Risiko mismatch tinggi bila migrasi dilakukan paralel.

Cocok jika frontend juga sedang dirombak total.

#### Rekomendasi

Gunakan **Opsi A untuk fase migrasi awal** dengan adapter kontrak di boundary controller/response helper. Setelah parity tercapai, buka `/api/v2` untuk cleanup contract. Jangan ubah URL dan response shape domain besar sebelum ada inventory frontend yang siap.

### 2. Auth Mode

Kontrak lama:

- Login mengirim cookie `jwt` httpOnly.
- Auth middleware membaca `req.cookies.jwt` lebih dulu, lalu `Authorization: Bearer`.
- CSRF token disegarkan saat login dan diekspos lewat header.
- CORS memakai `credentials: true`.
- `req.user` berisi data user DB lengkap termasuk `role` dan `prodiRelation`.

Gap backend baru:

- Belum memakai `cookie-parser`.
- CORS default belum `credentials`.
- `authenticate` hanya membaca bearer header.
- Payload `req.user` hanya JWT payload, belum user DB/prodi/roles lengkap.

Rekomendasi:

- Buat `core/auth/session.middleware.ts` yang mendukung cookie JWT first + bearer fallback.
- Definisikan `AuthenticatedUserContext` typed di `src/types/auth.ts`.
- Pisahkan `JwtUserPayload` dari `AuthenticatedUserContext`; jangan samakan payload token dengan user DB.
- Tambahkan CSRF middleware typed bila tetap memakai cookie auth untuk frontend lama.

### 3. Response Shape

Kontrak lama yang banyak dipakai:

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": {},
  "meta": {}
}
```

Error lama:

```json
{
  "success": false,
  "message": "Token tidak valid atau expired",
  "error": "INVALID_TOKEN"
}
```

Backend baru belum membawa `message` pada success dan memakai `errors` pada error.

Rekomendasi:

- Definisikan `ApiSuccess<TData, TMeta>` dan `ApiFailure<TCode>` sebagai discriminated contract.
- Tambahkan `sendLegacySuccess` dan `sendLegacyError` atau ubah helper utama agar kompatibel.
- Simpan error detail teknis hanya di log, bukan response production.
- Gunakan Bahasa Indonesia untuk message user-facing domain SIPRITI.

### 4. RBAC dan Scope Data

Kontrak lama penting:

- User dapat memiliki banyak role melalui `user_roles`.
- Permission adalah union dari semua role user.
- Ada fallback legacy `user.role_id`.
- Ada role hierarchy untuk mencegah user mengelola target setara/lebih tinggi.
- Beberapa flow harus scoped by `kode_prodi`, terutama `kaprodi` dan official signature.

Gap backend baru:

- User hanya `belongsTo(Role)` melalui `roleId`.
- Belum ada `UserRole`.
- Permission constants masih starter dan belum mencakup SIPRITI.
- Belum ada scope prodi/role hierarchy.

Rekomendasi:

- Migrasikan RBAC sebagai foundation module sebelum domain proposal.
- Tambahkan typed model `UserRole`.
- Jadikan `roles` dan `permissions` di `AuthenticatedUserContext` sebagai array.
- Permission naming harus dinormalisasi sebelum dipakai ulang; hindari duplikasi nama permission lintas module dengan makna berbeda.
- Definisikan policy helper seperti `canManageUser`, `canAccessProdiScope`, `canMutateProposal`.

## Gap Per Bounded Context

### Foundation Context

Harus selesai sebelum domain besar:

- `auth` compatibility: cookie, bearer fallback, CSRF, logout, change password, profile, admin user management.
- `rbac`: role, permission, role-permission, user-role, role hierarchy, cache invalidation.
- `audit`: action/entity constants, structured audit, non-blocking policy, request context.
- `response`: success/error standardized and frontend-safe.
- `upload/storage`: multer facade, path normalization, magic byte validation, UUID filename, public static serving, uploaded file metadata.
- `database`: migration + SQL patch convention in new TypeScript layout.
- `observability`: request ID, access log, error log, audit log, health check.

### Proposal Workflow Context

Core owner data:

- Proposal root: `hakiproposal`, `memberproposal`, `mahasiswa`, `mitraproposal`.
- Penelitian/pengabdian detail: `penelitianproposal`, `pengabdianproposal`.
- Substansi: `jadwalproposal`, `luaranproposal`, `rabproposal`, `output`.
- Workflow: submit, review, approve, reject, resubmit, forward to hibah internal.
- Reports: `laporanusulan`, monev, final PDF.

Gap utama:

- Backend baru belum punya model proposal sama sekali.
- Route lama punya alias dan nested routes: `/api/penelitian`, `/api/usulan-penelitian`, `/api/pengabdian`, `/api/usulan-pengabdian`, `/api/proposals/:id/jadwal`, `/api/proposals/:id/luaran`, `/api/proposals/:id/rab`.
- Banyak operasi CUD harus transaction-safe dan punya audit semantics seperti `SUBMIT`, `FORWARD`, `APPROVE`, `DECLINE`.
- Eligibility PDF final dan laporan akhir harus dijadikan domain policy, bukan logic tersebar di controller/frontend.

Rekomendasi struktur:

```text
src/modules/proposals/
  contract/
  dto/
  mappers/
  policies/
  repositories/
  services/
  proposal.model.ts
  member-proposal.model.ts
  proposal.routes.ts
```

Module tambahan boleh dipisah saat kompleksitas nyata muncul:

- `proposal-review`
- `proposal-substance`
- `proposal-reports`
- `proposal-final-pdf`

Jangan langsung membuat terlalu banyak module kecil bila boundary transaksinya masih satu aggregate proposal.

### Master Data Context

Data owner:

- `prodi`
- `skema`
- `bidangfokus`
- `tahunakademik`
- `sertifikatmutu`
- `output`

Gap utama:

- Belum ada module master data di backend baru.
- Permission lama beragam dan sebagian pernah terlalu generik.
- Dropdown/options endpoints dipakai frontend di banyak form.

Rekomendasi:

- Migrasikan `prodi` lebih awal karena auth user context, kaprodi scope, official signature, dan proposal filtering bergantung pada `kode_prodi`.
- Setelah `prodi`, lanjut `skema`, `bidangfokus`, `tahunakademik`, lalu `output`.
- Buat route public/options typed, tetapi tetap rate-limited bila public.
- Jangan memakai permission generik `manage_master_data`; gunakan permission spesifik per resource.

### Content & Public Page Context

Data owner:

- `berita`, `pengumuman`, `panduan`, `publicpage`
- `carousel`, `landingSlider`
- `capaian`, `publikasi`, `kategoripublikasi`
- `mitrakerjariset`, `productriset`, `penghargaanriset`, `hibahinternal`

Gap utama:

- Banyak content module bergantung upload image/file.
- Public routes tidak semuanya butuh auth, tetapi perlu rate limit dan response safe.
- Slug untuk `berita` dan `pengumuman` sudah ada di migration lama.

Rekomendasi:

- Jangan migrasikan content module sebelum storage/upload foundation siap.
- Mulai dari content yang paling sederhana tanpa upload berat, lalu lanjut yang butuh image/lampiran.
- Public read contract perlu mapper khusus agar field internal, path absolut, dan metadata sensitif tidak bocor.

### Upload & Document Context

Kontrak lama:

- Static files served dari `/uploads/<subdir>`.
- Header static: `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`.
- Upload memakai size, MIME, magic byte validation, UUID rename, dan path guard.
- Richtext image punya endpoint khusus `/api/upload/richtext`.
- Ada `uploaded_files` metadata dan file lifecycle service.
- PDF memakai `pdfmake`, `katex`, `mathjax-full`, dan local archive.

Gap backend baru:

- Belum ada multer, storage service, file metadata model, static serving, PDF tooling, atau richtext lifecycle.

Rekomendasi:

- Buat `core/storage` untuk path, validation, filename, and public URL mapping.
- Buat `modules/files` untuk metadata dan retrieval.
- Buat `modules/upload` sebagai HTTP adapter.
- Baru setelah itu migrasikan content/proposal modules yang menerima file.

## Data & Migration Gap

Backend lama punya migration root JavaScript dan SQL patch production. Backend baru punya migration TypeScript di `src/database/migrations`.

Guardrail dari `RULES-PERUBAHAN-CODE.md` yang harus tetap dibawa:

- Setiap perubahan schema wajib punya migration dengan `up()` dan `down()`.
- Setiap perubahan schema wajib punya SQL patch idempotent di `sql/`.
- Setiap perubahan permission/role mapping wajib punya migration, seeder, SQL patch, dan update seed source.
- SQL patch harus aman dijalankan lebih dari sekali.
- Perubahan endpoint/input/output wajib diikuti update frontend service, hooks, pages, components, dan types.
- TypeScript strict: tidak boleh `any`, cast paksa, atau `unknown` tanpa narrowing.

Gap tambahan di backend baru:

- Belum ada folder `sql/` untuk patch production.
- Seeder RBAC baru masih minimal dan belum berisi role SIPRITI.
- Existing TypeScript masih memiliki beberapa `any` di controller generic Express, cache user, Swagger generator, dan docs helper. Ini harus dibersihkan sebelum dijadikan standar migrasi.

Rekomendasi:

```text
new_sipriti_backend/
  sql/
    patch-DD-mmm-YYYY-description.sql
  src/database/migrations/
  src/database/seeders/
  src/database/seeders/rbac-source.ts
```

Gunakan `rbac-source.ts` sebagai source of truth typed untuk roles, permissions, dan role-permission matrix. Seeder dan SQL patch harus diturunkan dari source yang sama semaksimal mungkin.

## Audit Gap

Ada konflik arah yang perlu diselesaikan:

- `RULES-PERUBAHAN-CODE.md` menyatakan audit adalah observer, non-blocking, di luar transaksi, `throwOnError: false`.
- Sebagian kode/dokumen lama dan komentar backend baru masih mengarah ke audit di dalam transaksi untuk mutasi.

Rekomendasi keputusan:

- Default audit baru: **non-blocking, fire-and-forget, di luar transaksi**, error ditangkap dan masuk `logger.warn`.
- Exception domain-critical boleh blocking hanya jika benar-benar menjadi bagian dari integritas akses/workflow, misalnya role-permission mutation, account deactivate/restore, approval/rejection final, atau forward proposal. Exception ini wajib ditulis eksplisit di policy/service, bukan menjadi default.
- Hindari audit ganda: jangan pasang generic global audit yang menulis duplicate event untuk service yang sudah punya semantic audit.
- Action audit harus semantic: `LOGIN`, `LOGOUT`, `SUBMIT`, `FORWARD`, `APPROVE`, `DECLINE`, `RESTORE`, bukan hanya mapping `POST` -> `CREATE`.

## Security Consideration

Security gap yang harus diprioritaskan:

- Cookie auth tanpa CSRF di backend baru akan berisiko bila frontend lama tetap memakai cookie.
- Upload belum ada validation pipeline di backend baru.
- Static file serving belum punya `nosniff`, dotfile deny, path traversal guard.
- RBAC baru belum multi-role dan belum punya prodi scope.
- Error middleware baru belum menyamakan kode error yang aman untuk frontend.
- CORS baru masih default dan belum mengikat origin + credentials seperti backend lama.

Minimal sebelum cutover:

- CORS explicit per environment.
- Cookie parser + CSRF jika cookie auth dipertahankan.
- Helmet tetap aktif dengan pengecualian yang benar untuk static/media.
- Rate limiter dipisah untuk auth, public API, upload, dan generic API.
- Upload validation wajib size + MIME + magic byte + extension allowlist.
- Request ID muncul di log dan response error.

## Observability Gap

Backend baru sudah punya request ID, access log, Pino, dan health endpoint. Yang belum ada untuk parity SIPRITI:

- Audit log viewer parity (`/api/audit-logs`).
- Audit semantic per domain action.
- Metrics minimal untuk upload failure, auth failure, DB error, validation error, and slow query.
- Health/readiness yang memverifikasi DB connection, bukan hanya process hidup.
- Runbook migration/cutover.

Rekomendasi:

- `/health` untuk liveness.
- `/ready` untuk DB readiness.
- Structured log wajib menyertakan `requestId`, `userId`, `module`, `action`, dan `entityId` bila tersedia.

## Urutan Migrasi yang Disarankan

### Phase 0 - Contract Inventory & Guardrail

- Freeze endpoint inventory dari backend lama.
- Freeze table/model inventory dari backend lama.
- Tentukan response compatibility mode.
- Tambahkan folder `sql/` dan template migration/patch.
- Bersihkan `any` di backend baru foundation sebelum dijadikan contoh.

### Phase 1 - Foundation Parity

- Auth cookie/bearer compatibility.
- CSRF if cookie auth remains.
- Response helper legacy-compatible.
- RBAC multi-role + `UserRole`.
- Prodi model/scope.
- Audit policy final.
- Upload/storage foundation.
- Error handler dengan kode error stabil.

### Phase 2 - Master Data

- `prodi`
- `skema`
- `bidangfokus`
- `tahunakademik`
- `output`
- `sertifikatmutu`
- Options/dropdown endpoints.

### Phase 3 - Public Content

- `berita`
- `pengumuman`
- `panduan`
- `publicpage`
- `carousel`
- `landing-slider`
- `capaian`
- `publikasi`
- `mitra-kerja-riset`
- `product-riset`
- `penghargaan-riset`
- `hibah-internal`

### Phase 4 - Proposal Core

- Proposal aggregate root.
- Member proposal and mahasiswa.
- Research/pengabdian create/update/submit.
- Proposal detail serializers.
- Search/filter by prodi.
- Invite/notification integration.

### Phase 5 - Review, Report, PDF, Bulk Import

- Proposal review approve/reject/resubmit.
- HKI and HKI review.
- Laporan usulan.
- Monev.
- Final PDF.
- Official signatures.
- Bulk import template/download/import.

### Phase 6 - Cutover & Cleanup

- Dual-run endpoint checks against frontend flows.
- Compare old vs new API response fixtures.
- Run migration and SQL patch in staging.
- Remove old alias only after frontend no longer depends on it.
- Archive/decommission legacy tables only after one stable cycle.

## Migration Checklist Per Module

Gunakan checklist ini untuk setiap module yang dipindah:

- [ ] Tentukan owner data dan bounded context.
- [ ] Catat endpoint lama, method, auth, permission, request body, query, params, response.
- [ ] Catat model lama, table name, indexes, FK, enum, nullable, default value, paranoid/soft delete.
- [ ] Buat Zod schema request/query/params.
- [ ] Buat DTO request/response tanpa `any`.
- [ ] Buat mapper model -> response DTO.
- [ ] Buat repository typed untuk DB access.
- [ ] Buat service yang memegang business rule dan transaction.
- [ ] Buat policy authorization resource-level.
- [ ] Buat routes dengan middleware chain yang eksplisit.
- [ ] Tambahkan OpenAPI annotation dan schema sync.
- [ ] Tambahkan permission constants dan RBAC seed source.
- [ ] Tambahkan migration + SQL patch bila schema/permission berubah.
- [ ] Tambahkan audit semantic bila CUD atau workflow action.
- [ ] Tambahkan tests untuk schema, service happy path, forbidden path, dan response contract.
- [ ] Update frontend service/hooks/types bila kontrak berubah.

## Risiko & Trade-off

- Big-bang migration akan cepat terlihat selesai, tetapi risiko mismatch frontend, auth cookie, upload path, dan permission sangat tinggi.
- Compatibility mode menambah adapter legacy, tetapi memberi jalur cutover yang lebih aman.
- Menjaga URL lama mempercepat parity, tetapi perlu ADR kapan alias lama boleh dideprecate.
- Multi-role RBAC wajib untuk SIPRITI, walau backend baru starter-nya lebih sederhana.
- Upload/storage harus dimigrasikan lebih awal karena banyak content/proposal bergantung pada file.
- Audit harus disederhanakan agar tidak blocking berlebihan dan tidak duplikatif.

## ADR yang Perlu Dibuat

- ADR-001: Preserve `/api` legacy compatibility during migration.
- ADR-002: Cookie JWT + CSRF vs bearer-only auth.
- ADR-003: Multi-role RBAC and prodi-scoped authorization.
- ADR-004: Response envelope standard for SIPRITI.
- ADR-005: Audit semantic and non-blocking default.
- ADR-006: Local upload storage and public static file policy.
- ADR-007: Migration + SQL patch production workflow in TypeScript backend.

## Definition of Ready untuk Mulai Migrasi Module

Sebuah module siap dimigrasikan jika:

- Endpoint lama sudah diinventarisasi.
- Table/model lama sudah diinventarisasi.
- Permission lama sudah diketahui.
- Response contract lama sudah diketahui dari controller/service.
- Dependency module lain sudah jelas.
- Ada keputusan apakah endpoint mempertahankan legacy contract atau memakai contract baru.

## Definition of Done untuk Module Migrasi

Sebuah module dianggap selesai jika:

- Build TypeScript lulus tanpa `any` baru.
- Route terdaftar di `src/routes/index.ts`.
- OpenAPI docs bisa digenerate.
- Migration dan SQL patch tersedia bila ada perubahan DB.
- Seeder/RBAC source terupdate bila ada permission.
- Unit/contract test minimum lulus.
- Frontend contract sudah disinkronkan bila ada perubahan.
- Manual smoke test endpoint utama berhasil.

## Kesimpulan

Gap terbesar bukan pada tooling TypeScript, tetapi pada kontrak domain SIPRITI yang belum hadir di backend baru. Backend baru sudah cukup baik sebagai fondasi, tetapi harus diperluas dengan urutan yang disiplin: foundation compatibility, RBAC multi-role, upload/storage, master data, public content, proposal workflow, lalu review/report/PDF/bulk import.

Migrasi yang paling aman adalah bertahap dan kontrak-driven. Setiap file yang dipindah harus menjawab: data apa yang dimiliki module ini, endpoint apa yang dijanjikan ke frontend, permission apa yang menjaga aksesnya, response apa yang diterima caller, dan migration apa yang membuat DB state benar.
