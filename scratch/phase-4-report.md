# Phase 4 Report — Standards Compliance Cleanup

**Tanggal:** 2026-06-23
**Status:** ✅ SELESAI — `npm run build` (tsc + tsc-alias) lulus, 0 error

---

## Ringkasan

Phase 4 membereskan pelanggaran standar kode new backend tanpa mengubah kontrak
response yang dikonsumsi frontend. Setiap perubahan diverifikasi terhadap shape
yang dibaca frontend (`../SIPRITI/src/services/*`) dan terhadap legacy production
agar tidak ada regresi.

---

## Task 4.1 — Hand-rolled response → `sendSuccess()`

**Status:** ✅ DONE (4 dari 5 file; 1 dikecualikan dengan alasan parity)

### Yang diubah

| File | Endpoint | Sebelum | Sesudah |
|---|---|---|---|
| `penelitian-proposal.controller.ts` | get + upsert | `res.json({ status: "success", data })` | `sendSuccess(res, { message, data })` |
| `pengabdian-proposal.controller.ts` | get + upsert | `res.json({ status: "success", data })` | `sendSuccess(res, { message, data })` |
| `jadwal-proposal.controller.ts` | get + bulkUpsert | `res.json({ status: "success", data })` | `sendSuccess(res, { message, data })` |
| `luaran-proposal.controller.ts` | get + bulkUpsert | `res.json({ status: "success", data })` | `sendSuccess(res, { message, data })` |

### Verifikasi keamanan perubahan (anti-regresi frontend)

- Legacy controller untuk 4 modul ini **juga** memakai shape ad-hoc
  `{ status: "success", data }` (bukan `successResponse`). Jadi shape lama bukan
  acuan yang harus dipertahankan.
- Frontend service (`penelitian-proposal.service.ts`, dst.) men-declare tipe
  `{ status: string; data }` **tetapi hanya membaca `res.data`** — field `status`
  tidak pernah dibaca. Maka beralih ke `{ success: true, message, data }`
  (output `sendSuccess`) **tidak memutus frontend**: `.data` tetap ada.
- Nilai `null` (substansi belum ada) dan `[]` (jadwal/luaran kosong) tetap
  diteruskan apa adanya karena `sendSuccess` menyertakan `data` selama bukan
  `undefined`. Frontend `res.data ?? null` / `res.data ?? []` tetap aman.

### Dikecualikan: `capaian.controller.ts` → `getPublikasiPivot`

Plan menyebut "capaian baris 19", tetapi handler tersebut mengembalikan shape
**flat** `{ success: true, header_tahun, data_tabel }`. Frontend
(`capaian.service.ts` tipe `PublikasiPivotResponse` + `useCapaianQuery`) membaca
`header_tahun` dan `data_tabel` di **top-level**, bukan di bawah `data`.
Membungkusnya dengan `sendSuccess({ data })` akan menyarangkan field ke
`data.header_tahun` dan **memutus halaman capaian publik**. Handler ini sudah
memakai `{ success: true }` (bukan `{ status: "success" }`), jadi dibiarkan apa
adanya demi parity. Sisa handler di `capaian.controller.ts` sudah memakai
`sendSuccess`.

---

## Task 4.2 — Audit pada `penelitian-proposal.service.ts`

**Status:** ✅ SUDAH ADA (premis plan sudah usang)

`upsertPenelitian` **sudah** memanggil `auditService.persistNonBlocking(...)`
(action `UPDATE` bila record ada, `CREATE` bila baru) dengan `before`/`after`
snapshot. Pengecekan paritas juga dilakukan pada modul saudara:

| Service | Audit upsert |
|---|---|
| `penelitian-proposal.service.ts` | ✅ ada |
| `pengabdian-proposal.service.ts` | ✅ ada |
| `jadwal-proposal.service.ts` | ✅ ada |
| `luaran-proposal.service.ts` | ✅ ada |

Tidak ada perubahan yang diperlukan.

---

## Task 4.3 — Centralized `NotificationService.createNotification`

**Status:** ✅ DONE (diimplementasi + 6 call-site dimigrasi)

### Helper baru

`notification.service.ts` kini punya satu pintu pembuatan notifikasi:

```ts
async createNotification(
  params: CreateNotificationParams,
  transaction?: Transaction,
): Promise<Notification>
```

Perbaikan dari rancangan plan:
- **Transaction-aware** — parameter `transaction` opsional, sehingga call-site
  yang berada di dalam `sequelize.transaction()` tetap atomik (rancangan plan
  semula tidak punya ini dan akan memecah atomisitas).
- **ID v4 eksplisit** — helper menghasilkan `id: randomUUID()` (v4).
  Alasan: legacy production men-default kolom PK tabel `notifications` ke
  `DataTypes.UUIDV4`, jadi data produksi seluruhnya v4. Sebelumnya 5 dari 6
  call-site new backend mengandalkan default model (`generateUuidV7()` → v7),
  yang **inkonsisten** dengan produksi. Helper menyeragamkan semua notifikasi ke
  v4 sesuai aturan UUID (#4: produksi berjalan v4, hindari mixing). Default
  model `generateUuidV7()` dibiarkan apa adanya (tidak di-rollback).

### Call-site yang dimigrasi (6)

| File | Konteks | Transaction |
|---|---|---|
| `notification.service.ts` `acceptInvite` | invite_accepted | ✅ in-trx |
| `notification.service.ts` `rejectInvite` | invite_rejected | ✅ in-trx |
| `hki.service.ts` `approveHKI` | usulan_approved | ✅ in-trx |
| `hki.service.ts` `rejectHKI` | usulan_rejected | ✅ in-trx |
| `proposal.service.ts` invite anggota | invite_anggota | ✅ in-trx |
| `proposal.service.ts` forward usulan | forward_usulan | ✅ in-trx |
| `proposal-review.service.ts` `approveProposal` | usulan_approved | tanpa trx (parity legacy) |
| `proposal-review.service.ts` `declineProposal` | usulan_rejected | tanpa trx (parity legacy) |

- Import `Notification` model diganti `notificationService` di `hki.service.ts`,
  `proposal.service.ts`, `proposal-review.service.ts`.
- `randomUUID` import yang jadi tak terpakai di `proposal.service.ts` dihapus.
- `Notification` model tetap di-import di `notification.service.ts` (masih dipakai
  untuk `findAndCountAll`, `count`, `findOne`, `update`, `destroy`).

---

## Verifikasi

```
npx tsc --noEmit  → 0 error
npm run build     → 0 error (tsc + tsc-alias)
grep Notification.create di src → hanya tersisa di dalam helper createNotification
```

Tidak ada `any`/`unknown` baru, semua import lokal pakai `.js`, tidak ada
dependency baru (tetap in-memory cache, tanpa Redis/S3 — cocok cPanel).

---

## Catatan untuk Phase 5

- Tidak ada perubahan Zod schema di Phase 4 → `npm run api-docs` tidak wajib
  dijalankan ulang khusus untuk phase ini (tetap dijalankan di Task 5.1 sebagai
  langkah akhir).
- Perubahan envelope 4 controller substansi: walau aman untuk frontend saat ini,
  catat di Task 5.2/5.4 untuk smoke-test GET/PUT substansi penelitian, pengabdian,
  jadwal, luaran.
