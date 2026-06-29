# Audit Gap Final RBAC dan Logika Aktor SIPRITI

Tanggal audit: 7 Juni 2026  
Basis verifikasi: database `new_sipriti_db`, source backend `new_sipriti_backend`, dan source frontend `SIPRITI`.

## 1. Ringkasan Audit

Audit akhir dilakukan untuk memastikan bahwa aktor pada sistem SIPRITI tidak disederhanakan menjadi satu peran umum. Pemeriksaan menunjukkan bahwa backend dan basis data sudah mengenali aktor yang lengkap, termasuk Koordinator Penelitian dan Koordinator Pengabdian. Kedua role tersebut memiliki permission yang berbeda sesuai domain usulan.

Gap yang ditemukan bukan berada pada backend, melainkan pada frontend. Sebelum perbaikan, guard route admin hybrid dan menu proposal masih terlalu umum. Kondisi ini dapat membuat koordinator melihat halaman lintas domain pada antarmuka, meskipun backend tetap menolak request yang tidak sesuai. Perbaikan dilakukan pada guard route dan menu admin tanpa mengubah endpoint, field permintaan, field respons, status workflow, maupun serializer backend.

## 2. Bukti Role dan Permission Database

| role | status audit | catatan permission utama |
| --- | --- | --- |
| `admin` | Lulus | Super user berbasis 145 permission; endpoint tetap melewati middleware server. |
| `dosen` | Lulus | 43 permission; membuat, mengubah draft, submit, revisi, dan resubmit sesuai ownership proposal. |
| `mahasiswa` | Lulus | 36 permission; akses pengguna/proposal sesuai permission yang tersedia. |
| `kaprodi` | Lulus | 16 permission; akses by-prodi, signature prodi, dan workflow prodi. |
| `reviewer` | Lulus | 4 permission; review sesuai assignment/permission dan tidak memiliki forward. |
| `koordinator_penelitian` | Lulus | 24 permission; memiliki `manage_penelitian`, `view_penelitian`, `review_proposal`, `approve_proposal`, `edit_usulan_by_prodi`, dan `forward_usulan_penelitian`. |
| `koordinator_pengabdian` | Lulus | 24 permission; memiliki `manage_pengabdian`, `view_pengabdian`, `review_proposal`, `approve_proposal`, `edit_usulan_by_prodi`, dan `forward_usulan_pengabdian`. |
| `koordinator_hki` | Lulus | 11 permission; akses koordinasi HKI sesuai permission HKI. |
| `koordinator_publikasi` | Lulus | 12 permission; akses koordinasi publikasi sesuai permission publikasi. |
| `user` | Lulus | 13 permission; role dasar dengan permission terbatas. |

## 3. Hasil Audit Backend

| area | status audit | bukti source | catatan |
| --- | --- | --- | --- |
| Hierarki role autentikasi | Lulus | `src/modules/auth/auth.service.ts` | Role Koordinator Penelitian dan Koordinator Pengabdian masuk dalam hierarchy koordinasi. |
| Konstanta permission | Lulus | `src/constants/permissions.constants.ts` | Permission forward, review, approve, manage, dan by-prodi tersedia eksplisit. |
| Policy proposal | Lulus | `src/modules/proposal/policies/proposal.policy.ts` | Tipe proposal dipetakan ke role koordinator dan permission manage tipe. |
| Service review proposal | Lulus | `src/modules/proposal-review/proposal-review.service.ts` | Koordinator Penelitian hanya efektif untuk `type=penelitian`; Koordinator Pengabdian hanya efektif untuk `type=pengabdian`. |
| Route review proposal | Lulus | `src/modules/proposal-review/proposal-review.routes.ts` | Endpoint review tetap melewati autentikasi, permission middleware, dan policy service. |
| Forward penelitian | Lulus | `src/modules/research/research.routes.ts` | Forward penelitian memerlukan `forward_usulan_penelitian` atau `manage_proposal`. |
| Forward pengabdian | Lulus | `src/modules/pengabdian/pengabdian.routes.ts` | Forward pengabdian memerlukan `forward_usulan_pengabdian` atau `manage_proposal`. |
| Nested section proposal | Lulus | `src/modules/proposal/proposal.routes.ts` | Endpoint bagian proposal tetap melewati permission dan ownership/resource policy. |

## 4. Temuan Gap dan Perbaikan

| id | kategori | status | deskripsi gap | dampak | perbaikan |
| --- | --- | --- | --- | --- | --- |
| RBAC-FE-001 | Guard route frontend | Sudah diperbaiki | Guard admin hybrid sebelumnya mengizinkan beberapa base path admin secara terlalu luas, termasuk proposal, detail proposal, monev laporan, dan signature. | Koordinator berpotensi melihat halaman lintas domain di UI sebelum backend menolak request. | `ProtectedRoute` dibuat berbasis domain: Koordinator Penelitian hanya jalur penelitian, Koordinator Pengabdian hanya jalur pengabdian, Kaprodi hanya signature, sedangkan dashboard/import/settings menjadi jalur bersama. |
| RBAC-FE-002 | Visibilitas menu frontend | Sudah diperbaiki | Menu proposal admin memakai permission array dengan semantik `some()`, sehingga `view_proposal` dapat menampilkan sub-menu lintas domain. | UI dapat memberi tampilan yang lebih luas daripada permission spesifik role. | Sub-menu proposal diganti memakai permission spesifik `view_penelitian`, `view_pengabdian`, dan `view_hki`. |
| RBAC-BE-001 | Guard endpoint backend | Lulus | Tidak ditemukan mismatch tipe koordinator pada route, service, atau policy backend. | Tidak ada bug backend. | Tidak ada patch backend diperlukan. |
| RBAC-DB-001 | Seed role dan permission | Lulus | Role dan permission koordinator sudah ada di `new_sipriti_db`. | Tidak diperlukan migrasi baru. | Tidak ada patch SQL atau migration baru diperlukan. |

## 5. Matriks Perilaku yang Harus Dipertahankan

| aktor | penelitian | pengabdian | forward | catatan |
| --- | --- | --- | --- | --- |
| Admin PRPM | Bisa seluruh aksi sesuai permission admin. | Bisa seluruh aksi sesuai permission admin. | Bisa forward seluruh tipe melalui permission luas. | Tetap melewati middleware server dan audit. |
| Koordinator Penelitian | Bisa review, approve/reject, by-prodi, dan forward penelitian. | Ditolak untuk workflow pengabdian. | Hanya `forward_usulan_penelitian`. | Backend service memeriksa tipe proposal. |
| Koordinator Pengabdian | Ditolak untuk workflow penelitian. | Bisa review, approve/reject, by-prodi, dan forward pengabdian. | Hanya `forward_usulan_pengabdian`. | Backend service memeriksa tipe proposal. |
| Kaprodi | Akses by-prodi/signature sesuai prodi. | Akses by-prodi/signature sesuai prodi. | Tidak menjadi koordinator forward kecuali permission eksplisit tersedia. | Scope prodi tetap wajib. |
| Reviewer | Bisa review sesuai assignment/permission. | Bisa review sesuai assignment/permission. | Tidak boleh forward. | Forward tidak diberikan oleh permission reviewer. |
| Dosen/Ketua | Membuat, mengubah draft, submit, revisi, dan resubmit sesuai ownership. | Membuat, mengubah draft, submit, revisi, dan resubmit sesuai ownership. | Tidak boleh forward. | Ownership tetap diperiksa di service/policy. |

## 6. Catatan Verifikasi

| verifikasi | status | catatan |
| --- | --- | --- |
| Query role dan permission database | Lulus | `new_sipriti_db` aktif dan role koordinator tersedia. |
| Audit source backend | Lulus | Tidak ditemukan gap endpoint atau logic tipe koordinator. |
| Audit source frontend | Sudah diperbaiki | Dua gap UI RBAC ditemukan dan sudah dipatch. |
| Build backend | Lulus | `npm.cmd run build` berhasil. |
| Sinkronisasi OpenAPI | Lulus | `npm.cmd run api-docs` berhasil dan menyinkronkan 203 skema Zod. |
| Pengujian kontrak backend | Lulus | `npm.cmd test` berhasil dengan 14 test lulus. |
| Pemeriksaan migrasi fase 6 | Lulus | `npm.cmd run phase6:migration-check` berhasil; 16 migrasi dan 11 patch SQL valid. |
| Migrasi basis data | Lulus | `npm.cmd run db:migrate` berhasil; Sequelize melaporkan schema sudah mutakhir. |
| Smoke test fase 6 | Lulus | `npm.cmd run phase6:smoke` berhasil dengan 30/30 skenario lulus. |
| Uji kesetaraan HTTP fase 6 | Lulus | `npm.cmd run phase6:http-parity` berhasil dengan 20/20 skenario lulus. |
| Type-check frontend | Lulus | `npm.cmd run type-check` berhasil pada frontend `SIPRITI`. |
| Build produksi frontend | Lulus dengan catatan | `npm.cmd run build` berhasil; Vite memberi peringatan ukuran chunk besar, bukan error RBAC/logika. |

## 7. Kesimpulan Audit

Backend baru sudah menjaga pemisahan logika Koordinator Penelitian dan Koordinator Pengabdian pada lapisan server. Gap yang ditemukan hanya berada pada tampilan dan guard frontend, kemudian telah diperbaiki agar UI tidak lebih longgar daripada RBAC server. Dengan hasil verifikasi tersebut, tidak ada gap backend aktif pada endpoint dan logika koordinator. Tahap berikutnya adalah UAT manual menggunakan frontend asli dan akun role aktual.
