# Dokumentasi API Backend SIPRITI

Judul tugas akhir: Rancang Bangun Sistem Informasi Pengelolaan Penelitian, Pengabdian Masyarakat, dan Kekayaan Intelektual pada Pusat Riset dan Pengabdian Masyarakat Institut Teknologi Indonesia.  
Nama sistem: SIPRITI PRPM ITI  
Target backend: `new_sipriti_backend`  
Tanggal penyusunan: 7 Juni 2026

## BAB I PENDAHULUAN

### 1.1 Latar Belakang Dokumentasi API

Antarmuka pemrograman aplikasi atau API pada SIPRITI berfungsi sebagai penghubung antara frontend, backend, dan basis data. Melalui API, proses login, pengajuan proposal, pengelolaan konten publik, validasi laporan, review, forward, import data, dan pencatatan audit dapat dilakukan secara terstruktur. Dokumentasi ini disusun sebagai lampiran teknis tugas akhir agar kontrak layanan backend dapat ditelusuri oleh pengembang, penguji UAT, dan pembaca akademik.

Dokumentasi API tidak dimaksudkan sebagai daftar endpoint semata. Pada tugas akhir ini, API diposisikan sebagai bukti bahwa sistem memiliki kontrak yang stabil. Karena SIPRITI baru harus tetap dapat digunakan oleh frontend asli, setiap endpoint utama dijaga agar tidak mengalami perubahan alamat, bentuk permintaan, bentuk respons, izin akses, dan efek samping bisnis tanpa dasar verifikasi.

### 1.2 Ruang Lingkup

Dokumentasi ini mencakup standar respons, autentikasi, otorisasi, middleware, kelompok endpoint, permission aktor, validasi unggahan, dan hasil verifikasi. Endpoint yang ditulis adalah endpoint yang relevan untuk pengujian fitur utama SIPRITI, bukan seluruh detail parameter kecil yang sudah tersedia pada Swagger UI.

### 1.3 Sumber Kebenaran

| sumber | fungsi |
| --- | --- |
| `src/routes/index.ts` | Daftar route aktif yang dipasang pada aplikasi. |
| `src/modules/**/**/*.routes.ts` | Definisi endpoint, middleware autentikasi, permission, dan validator. |
| `src/modules/**/**/*.schema.ts` | Skema Zod untuk body, query, params, dan metadata unggahan. |
| `src/docs/schemas.json` | Hasil sinkronisasi 203 skema Zod ke OpenAPI. |
| `docs/migration/full-end-to-end-logic-audit.md` | Bukti audit endpoint dan logika. |
| `docs/migration/parity-report.md` | Bukti kesiapan cutover dan gap yang telah ditutup. |
| `docs/final-development/RBAC_LOGIC_FINAL_GAP.md` | Bukti audit akhir aktor dan RBAC. |

## BAB II ARSITEKTUR LAYANAN API

### 2.1 Alamat Layanan dan Dokumentasi Interaktif

| kebutuhan | alamat |
| --- | --- |
| API lokal | `http://localhost:{PORT}/api` |
| Pemeriksaan kesehatan | `GET /health` |
| Swagger UI | `GET /docs` |
| OpenAPI global | `GET /docs.json` atau `GET /docs/specs/all.json` |
| OpenAPI per modul | `GET /docs/specs/:moduleName.json` |

### 2.2 Middleware Global

| middleware | fungsi |
| --- | --- |
| Helmet | Menambahkan header keamanan dasar. |
| CORS allowlist | Membatasi origin frontend yang boleh membawa kuki. |
| Pembatas ukuran JSON dan formulir | Membatasi ukuran payload umum. |
| Pembaca kuki | Membaca token autentikasi dan CSRF dari kuki. |
| Request ID | Memberi identitas unik pada setiap permintaan. |
| Access log | Mencatat metode, alamat, status, dan waktu respons. |
| Pembatas laju permintaan | Mengurangi risiko penyalahgunaan request berulang. |
| Middleware file statis | Menyajikan berkas unggahan dengan header aman. |
| Proteksi CSRF | Melindungi permintaan yang mengubah data. |
| Session opsional | Membaca pengguna aktif jika kuki tersedia. |
| Error handler | Menyeragamkan bentuk respons gagal. |

### 2.3 Standar Respons Berhasil

Sebagian besar endpoint JSON menggunakan bentuk respons berikut.

```json
{
  "success": true,
  "message": "Operasi berhasil",
  "data": {},
  "meta": {}
}
```

Field `meta` digunakan untuk pagination atau informasi filter. Beberapa endpoint legacy tetap mempertahankan respons khusus, misalnya `GET /api/` yang mengembalikan teks `API PRPM`.

### 2.4 Standar Respons Gagal

```json
{
  "success": false,
  "message": "Harap login terlebih dahulu",
  "error": "UNAUTHORIZED"
}
```

Pada kasus validasi tertentu, bentuk pesan tetap mengikuti backend lama. Keputusan ini diambil agar frontend asli tidak mengalami perubahan kontrak yang tidak diperlukan.

### 2.5 Autentikasi dan Otorisasi

| mekanisme | penjelasan |
| --- | --- |
| Kuki JWT | Login berhasil mengirimkan token JWT melalui kuki HTTP-only. |
| Token CSRF | Permintaan yang mengubah data harus membawa token CSRF valid. |
| RBAC | Role dan permission disimpan pada `roles`, `permissions`, `role_permissions`, dan `user_roles`. |
| Resource policy | Service memeriksa kepemilikan proposal, ketua proposal, prodi, status usulan, reviewer, koordinator, dan admin. |
| Alias legacy | Endpoint lama seperti `/api/users`, `/api/usulan-penelitian`, dan `/api/usulan-pengabdian` tetap dipertahankan. |

### 2.6 Matriks Aktor dan Permission Inti

| aktor | role basis data | izin utama | cakupan endpoint |
| --- | --- | --- | --- |
| Admin PRPM | `admin` | Izin administratif luas, termasuk pengguna, role, permission, proposal, review, forward, import, dashboard, dan audit. | Seluruh modul administratif dan workflow. |
| Dosen atau Peneliti | `dosen`, `mahasiswa`, atau `user` sesuai data | Membuat, mengubah draft, mengirim proposal, melihat proposal pribadi, dan mengelola laporan/HKI personal. | Proposal pribadi, undangan, laporan, HKI, dan dashboard pengguna. |
| Ketua Proposal | Ditentukan dari anggota proposal dan kepemilikan | Submit, revisi, resubmit, laporan, dan PDF final. | Proposal yang dipimpin. |
| Kaprodi | `kaprodi` | Akses prodi dan signature sesuai assignment. | Signature prodi dan dashboard terbatas. |
| Koordinator Penelitian | `koordinator_penelitian` | `manage_penelitian`, `view_penelitian`, `review_proposal`, `approve_proposal`, `edit_usulan_by_prodi`, `forward_usulan_penelitian`. | Review, approve/decline, edit by prodi, forward, laporan, import, dan dashboard untuk penelitian. |
| Koordinator Pengabdian | `koordinator_pengabdian` | `manage_pengabdian`, `view_pengabdian`, `review_proposal`, `approve_proposal`, `edit_usulan_by_prodi`, `forward_usulan_pengabdian`. | Review, approve/decline, edit by prodi, forward, laporan, import, dan dashboard untuk pengabdian. |
| Reviewer | `reviewer` | `review_proposal`, `view_proposal`. | Review proposal sesuai cakupan, tanpa hak forward. |
| Operator PRPM | Role operasional sesuai assignment | Permission import, monev, atau dokumen pendukung sesuai pemberian admin. | Bulk import, monev, dan dokumen pendukung. |

## BAB III SPESIFIKASI KELOMPOK ENDPOINT

### 3.1 Endpoint Sistem dan Dokumentasi

| metode | endpoint | akses | fungsi |
| --- | --- | --- | --- |
| GET | `/health` | Publik | Memeriksa kondisi aplikasi. |
| GET | `/api/` | Publik | Root API legacy. |
| GET | `/docs` | Dokumentasi | Menampilkan Swagger UI. |
| GET | `/docs.json` | Dokumentasi | Mengambil dokumen OpenAPI global. |
| GET | `/docs/specs/:moduleName.json` | Dokumentasi | Mengambil dokumen OpenAPI per modul. |

### 3.2 Autentikasi, Pengguna, dan RBAC

| modul | endpoint utama | akses | fungsi |
| --- | --- | --- | --- |
| Autentikasi | `POST /api/auth/login` | Publik dan CSRF | Login menggunakan `username` dan `password`. |
| Autentikasi | `POST /api/auth/register` | Publik dan CSRF | Registrasi dengan kontrak validasi legacy. |
| Session | `GET /api/auth/me`, `POST /api/auth/logout` | Pengguna login | Membaca session aktif dan logout. |
| Profil | `PUT /api/auth/change-password`, `PUT /api/auth/profile` | Pengguna login | Mengubah password dan profil. |
| Administrasi pengguna | `/api/auth/admin/list`, `/api/auth/admin/:id`, deactivate, restore | Admin/RBAC | Pengelolaan pengguna. |
| Alias pengguna | `/api/users/*` | Campuran | Alias legacy dan CRUD pengguna tambahan. |
| RBAC legacy | `/api/rbac/permissions`, `/api/rbac/roles`, `/api/rbac/users` | `manage_roles` | Pengelolaan role, permission, dan pemetaan pengguna. |
| CRUD role dan permission | `/api/roles`, `/api/permissions` | RBAC | Pengelolaan role dan permission baru. |

### 3.3 Master Data

| modul | endpoint utama | akses | fungsi |
| --- | --- | --- | --- |
| Program studi | `/api/admin/prodi`, `/api/prodi/options` | Admin untuk mutasi | Master prodi dan dropdown. |
| Skema | `/api/admin/skema`, `/api/skema/options` | Admin untuk mutasi | Master skema penelitian, pengabdian, dan HKI. |
| Bidang fokus | `/api/admin/bidang-fokus`, `/api/bidang-fokus/options` | Admin untuk mutasi | Master bidang fokus. |
| Tahun akademik | `/api/tahun-akademik`, `/api/tahun-akademik/all` | Admin untuk mutasi | Tahun dan semester akademik. |
| Output | `/api/outputs`, `/api/outputs/options` | Admin untuk mutasi | Master luaran proposal. |
| Sertifikat mutu | `/api/sertifikat-mutu`, `/api/sertifikat-mutu/all` | Admin untuk mutasi | Deskripsi sertifikat mutu. |

### 3.4 CMS dan Portal Publik

| modul | endpoint utama | akses | fungsi |
| --- | --- | --- | --- |
| Berita | `/api/berita` | GET publik, mutasi admin | Berita PRPM dengan slug dan lampiran. |
| Pengumuman | `/api/pengumuman` | GET publik, mutasi admin | Pengumuman PRPM. |
| Panduan | `/api/panduan` | GET publik, mutasi admin | Panduan dan berkas pendukung. |
| Halaman publik | `/api/publicpage/berita`, `/pengumuman`, `/panduan` | Publik | Agregasi konten publik. |
| Carousel | `/api/carousel` | Publik/admin | Konten carousel. |
| Landing slider | `/api/landing-slider`, `/api/landing-slider/admin` | Publik/admin | Slider halaman depan. |
| Capaian | `/api/capaian/*` | Publik/admin | Statistik dan deskripsi capaian. |
| Publikasi | `/api/kategori-publikasi`, `/api/publikasi`, `/api/publikasi/upsert` | Publik/admin | Rekap publikasi. |
| Riset dan penghargaan | `/api/mitra-kerja-riset`, `/api/product-riset`, `/api/penghargaan-riset`, `/api/hibah-internal` | Publik/admin | Informasi riset dan hibah. |

### 3.5 Unggahan dan Berkas

| modul | endpoint utama | akses | fungsi |
| --- | --- | --- | --- |
| Unggah gambar | `POST /api/upload/image`, `POST /api/upload/images`, `DELETE /api/upload/image` | Login dan CSRF | Unggah gambar dengan validasi ukuran, MIME, magic byte, nama UUID, dan path guard. |
| Unggah richtext | `POST /api/upload/richtext`, `DELETE /api/upload/richtext` | Login dan CSRF | Unggah berkas untuk editor richtext. |
| Baca berkas | `GET /api/files/path/:subdir/:filename`, `GET /api/files/:id` | Publik/session opsional | Membaca berkas melalui path aman atau metadata ID. |

### 3.6 Proposal Penelitian dan Pengabdian

| modul | endpoint utama | akses | fungsi |
| --- | --- | --- | --- |
| Proposal dasar | `POST /api/proposal` | `create_proposal` | Membuat proposal dasar multipart. |
| Undangan anggota | `POST /api/proposal/:proposalId/invite`, `/respond` | Login/RBAC | Mengirim dan menjawab undangan anggota. |
| Invites | `/api/invites/getMyInvites`, accept, reject | Login | Daftar dan aksi undangan. |
| Notifikasi | `/api/notifications`, `/unread-count`, `/read-all`, `/:id/read` | Login | Notifikasi workflow. |
| Penelitian | `/api/penelitian/*` dan `/api/usulan-penelitian/*` | Login/RBAC | Daftar, pilihan, buat, ubah, detail, submit, hapus, search, by-prodi, dan forward penelitian. |
| Pengabdian | `/api/pengabdian/*` dan `/api/usulan-pengabdian/*` | Login/RBAC | Daftar, pilihan, buat, ubah, detail, submit, hapus, search, by-prodi, dan forward pengabdian. |
| Nested section | `/api/proposals/:id/penelitian`, `/pengabdian`, `/jadwal`, `/luaran`, `/rab` | Login/RBAC | Substansi, jadwal, luaran, dan RAB proposal. |
| Pencarian anggota | `GET /api/usulan/search-anggota` | Login | Pencarian dosen atau mahasiswa sebagai anggota. |

Forward penelitian mensyaratkan `forward_usulan_penelitian` atau akses admin `manage_proposal`. Forward pengabdian mensyaratkan `forward_usulan_pengabdian` atau akses admin `manage_proposal`. Koordinator tidak boleh menjalankan forward lintas domain.

### 3.7 Review, Laporan, PDF, HKI, dan Monev

| modul | endpoint utama | akses | fungsi |
| --- | --- | --- | --- |
| Review proposal | `/api/proposal-review/stats/:type`, `/:type`, `/user/revisi`, `/user/approved`, approve, decline, resubmit | Reviewer/koordinator/admin | Review dan perubahan status proposal. |
| Laporan usulan | `/api/laporan-usulan`, `/:id`, `/:id/validate` | Login/RBAC | Unggah, ubah, dan validasi laporan. |
| PDF final | `/api/proposal-final-pdf/user/:id`, `/admin/:id` | Login/admin | Membuat PDF proposal final. |
| Tanda tangan resmi | `/api/admin/signatures/*` | `manage_signature` | CRUD tanda tangan resmi. |
| HKI | `/api/hki/*` | RBAC HKI | Pengajuan HKI pengguna. |
| Review HKI | `/api/hki-review/stats`, `/all`, `/`, `/:id`, approve, reject | Reviewer HKI/RBAC | Review pengajuan HKI. |
| Monev pengguna | `/api/monev/*` | `view_monev`/`manage_monev` | Pemantauan proposal oleh pengguna terkait. |
| Monev admin | `/api/admin/monev/*` | `manage_monev` | Jadwal monev, dokumen, dan opsi usulan. |

Pada endpoint review proposal, Koordinator Penelitian hanya berlaku untuk `type=penelitian`, sedangkan Koordinator Pengabdian hanya berlaku untuk `type=pengabdian`. Admin dapat mengakses seluruh tipe karena memiliki permission administratif luas.

### 3.8 Dashboard, Audit, Admin Usulan, dan Import

| modul | endpoint utama | akses | fungsi |
| --- | --- | --- | --- |
| Dashboard pengguna | `/api/dashboard/latest-statuses`, `/api/dashboard/counts` | `view_dashboard` | Ringkasan status pengguna. |
| Dashboard admin | `/api/admin/dashboard/stats`, `/skema-stats`, `/prodi-stats`, `/recent-activity`, `/tahun-options` | `view_admin_dashboard` | Statistik admin PRPM. |
| Audit log | `/api/audit-logs`, `/api/audit-logs/:id` | `view_audit_log` | Catatan aktivitas sistem. |
| Admin usulan | `/api/admin/usulan`, `/statistics`, `/:id` | Admin/RBAC | Agregasi proposal untuk admin. |
| Import usulan | `/api/admin/usulan/import/template`, `/api/admin/usulan/import` | `manage_penelitian`/`manage_pengabdian` | Template XLSX dan import usulan dengan proteksi tamper. |
| Product legacy | `/api/products` | GET publik, mutasi dengan izin | Endpoint legacy yang dipertahankan untuk kesetaraan. |

Import penelitian hanya boleh dilakukan oleh role yang memiliki `manage_penelitian`, sedangkan import pengabdian hanya boleh dilakukan oleh role yang memiliki `manage_pengabdian`. Template import mempertahankan selected member melalui hidden sheet agar anggota yang dipilih saat unduh template tidak dapat diganti secara diam-diam.

## BAB IV KEAMANAN DAN VALIDASI

### 4.1 Validasi Input

Endpoint yang menerima input divalidasi menggunakan Zod v4 atau pemeriksaan service. Validasi mencakup body, query, params, dan metadata unggahan. Hasil sinkronisasi dokumentasi menunjukkan 203 skema berhasil masuk ke `src/docs/schemas.json`.

### 4.2 Proteksi Unggahan

Unggahan berkas menerapkan pembatasan ukuran, validasi MIME, validasi magic byte, nama berkas UUID, path guard, metadata `uploaded_files`, dan header statis aman. Proteksi ini diperlukan agar sistem tidak hanya memeriksa ekstensi berkas, tetapi juga isi dan lokasi penyimpanannya.

### 4.3 Proteksi Auth dan Permission

Backend menggunakan kombinasi kuki JWT, token CSRF, RBAC, dan resource policy. Frontend juga memiliki guard role dan permission, tetapi keputusan final tetap berada pada backend. Pola ini penting karena UI hanya mencegah akses dari sisi pengalaman pengguna, sedangkan backend menentukan apakah aksi benar-benar boleh dijalankan.

## BAB V HASIL PENGUJIAN API

| jenis pengujian | hasil terakhir |
| --- | --- |
| Build TypeScript backend | Lulus melalui `npm.cmd run build` pada 7 Juni 2026. |
| Sinkronisasi OpenAPI | Lulus, 203 skema. |
| Pengujian kontrak | Lulus, 14 pengujian. |
| Pemeriksaan migrasi | Lulus, 16 migrasi dan 11 patch SQL. |
| Migrasi basis data | Lulus; `npm.cmd run db:migrate` melaporkan schema sudah mutakhir. |
| Smoke test | Lulus; `npm.cmd run phase6:smoke` berhasil pada 30 dari 30 skenario. |
| Uji kesetaraan HTTP | Lulus; `npm.cmd run phase6:http-parity` berhasil pada 20 dari 20 skenario. |

## BAB VI CATATAN INTEGRASI FRONTEND

- Frontend menggunakan autentikasi berbasis kuki, bukan token bearer yang disimpan bebas pada penyimpanan lokal.
- Permintaan yang mengubah data harus membawa token CSRF.
- Alias legacy tetap tersedia, yaitu `/api/users`, `/api/usulan-penelitian`, dan `/api/usulan-pengabdian`.
- Bentuk respons lama dipertahankan. Perbedaan yang ditemukan saat UAT harus diperlakukan sebagai bug, kecuali telah disetujui sebagai tambahan baru.
- Unggah dan unduh berkas harus diuji dengan berkas nyata karena pengujian otomatis tidak mencakup seluruh variasi binary.
- Halaman admin untuk koordinator sudah dibuat berbasis domain: Koordinator Penelitian hanya jalur penelitian, Koordinator Pengabdian hanya jalur pengabdian, dan Admin PRPM tetap dapat seluruh jalur.

## BAB VII REFERENSI TEKNIS

| sumber | penggunaan |
| --- | --- |
| OpenAPI Initiative. (2024). *OpenAPI Specification v3.0.4*. Linux Foundation. https://spec.openapis.org/oas/v3.0.4.html | Rujukan standar dokumentasi HTTP API. |
| Schwaber, K., & Sutherland, J. (2020). *The Scrum Guide*. Scrum.org. https://scrumguides.org/scrum-guide.html | Rujukan metodologi *Agile Scrum* pada laporan utama. |
| Le, H. T., Shar, L. K., Bianculli, D., Briand, L., & Nguyen, D. C. (2022). Automated reverse engineering of role-based access control policies of web applications. *Journal of Systems and Software*. https://doi.org/10.1016/j.jss.2021.111109 | Rujukan validasi RBAC lintas implementasi. |
| Laverdiere, M.-A., Julien, K., & Merlo, E. (2021). RBAC protection-impacting changes identification. *Information and Software Technology*. https://doi.org/10.1016/j.infsof.2021.106630 | Rujukan risiko perubahan privilege pada aplikasi web. |
