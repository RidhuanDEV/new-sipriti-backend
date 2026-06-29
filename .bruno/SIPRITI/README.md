# SIPRITI API Documentation

Koleksi API Bruno untuk SIPRITI Backend (Sistem Informasi Penelitian dan Pengabdian).

> Status tracking endpoint terbaru (real backend vs Bruno):
> `sipriti_backend/md/ENDPOINT-CHECKLIST-REAL-STATUS.md`
>
> Rule sinkronisasi PR route ↔ Bruno:
> `sipriti_backend/md/PR-RULE-ROUTE-BRUNO-SYNC.md`

## Setup

1. Install [Bruno](https://www.usebruno.com/)
2. Buka folder `.bruno/SIPRITI` di Bruno
3. Pilih environment `local` atau `production`
4. Set variable `host` dengan base URL API

## Environment Variables

| Variable | Description                                  |
| -------- | -------------------------------------------- |
| `host`   | Base URL API (contoh: http://localhost:3000) |
| `token`  | JWT Token untuk authentication               |

## Authentication

Sebagian besar endpoint memerlukan authentication menggunakan Bearer Token.

1. Gunakan endpoint `auth/register.bru` atau login untuk mendapatkan token
2. Token akan otomatis di-set ke variable `token`
3. Semua request authenticated akan menggunakan token ini

## API Modules

### Admin (`/api/admin`) 🆕

> **Requires Admin Role**

#### Prodi (`/api/admin/prodi`)

- GET / - List semua prodi dengan pagination
- GET /:id - Detail prodi
- POST / - Tambah prodi baru
- PUT /:id - Update prodi
- DELETE /:id - Hapus prodi

#### Skema (`/api/admin/skema`)

- GET / - List semua skema dengan pagination
- GET /:id - Detail skema
- POST / - Tambah skema baru
- PUT /:id - Update skema
- DELETE /:id - Hapus skema

#### Usulan (`/api/admin/usulan`)

- GET / - List semua usulan dengan filter
- GET /:id - Detail lengkap usulan
- GET /statistics - Statistik usulan untuk dashboard

#### Monev Internal (`/api/admin/monev`)

- GET / - List jadwal monev
- GET /:id - Detail monev
- POST / - Buat jadwal monev
- PUT /:id - Update monev
- DELETE /:id - Hapus monev
- POST /:id/upload - Upload dokumen monev
- GET /usulan/options - Dropdown usulan untuk form monev

### Options (`/api/options`) 🆕

> **Public Endpoints (No Auth Required)**

- GET /prodi - Dropdown prodi untuk registrasi
- GET /skema - Dropdown skema untuk form usulan

### 1. Auth (`/api/auth`, `/api/users`)

- Register, Me, Logout, Change Password, Search Users

### 2. Berita (`/api/berita`)

- CRUD berita/artikel

### 3. Capaian (`/api/capaian`)

- Statistik dan data capaian penelitian
- Publikasi pivot data
- Stats: dana hibah, mitra riset, HKI, publikasi

### 4. Carousel (`/api/carousel`)

- CRUD carousel images untuk landing page

### 5. Dashboard (`/api/dashboard`)

- Statistik dashboard
- Latest statuses, counts

### 6. Hibah Internal (`/api/hibah-internal`)

- CRUD hibah internal/skema pendanaan

### 7. HKI (`/api/hki`)

- CRUD Hak Kekayaan Intelektual
- Submit HKI

### 8. Invites (`/api/invites`)

- Get my invites
- Accept/Reject undangan proposal

### 9. Kategori Publikasi (`/api/kategori-publikasi`)

- CRUD kategori publikasi

### 10. Mitra Kerja Riset (`/api/mitra-kerja-riset`)

- CRUD mitra kerja riset

### 11. MONEV (`/api/monev`)

- Monitoring & Evaluasi proposal
- Add anggota, substansi, RAB, dokumen, mitra

### 12. Notifications (`/api/notifications`)

- List notifications
- Mark read/unread

### 13. Panduan (`/api/panduan`)

- CRUD dokumen panduan

### 14. Pengabdian / Usulan Pengabdian (`/api/usulan-pengabdian`)

- CRUD usulan pengabdian
- Submit, search

### 15. Pengumuman (`/api/pengumuman`)

- CRUD pengumuman

### 16. Product Riset (`/api/product-riset`)

- CRUD product riset

### 17. Proposal (`/api/proposal`)

- Create proposal
- Invite member, respond invite
- Admin review

### 17b. Search Anggota (`/api/usulan/search-anggota`)

- Search calon anggota tim usulan (authenticated)

### 18. Penelitian / Usulan Penelitian (`/api/usulan-penelitian`)

- CRUD usulan penelitian
- Submit, search

### 18b. Products (`/api/products`)

- CRUD product demo (in-memory)

### 19. Tahun Akademik (`/api/tahun-akademik`)

- CRUD tahun akademik

### 20. Upload (`/api/upload`)

- Upload single/multiple images
- Delete image

### 21. Publikasi (`/api/publikasi`)

- List publikasi (public)
- Upsert publikasi (admin)

## Roles

- **admin**: Full access
- **dosen**: Akses penelitian, pengabdian, HKI
- **mahasiswa**: Akses penelitian, pengabdian, HKI

## Response Format

Semua response menggunakan format standar:

```json
{
  "success": true,
  "status": 200,
  "message": "Success message",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Error Response

```json
{
  "success": false,
  "status": 400,
  "message": "Error message",
  "errors": [ ... ]
}
```
