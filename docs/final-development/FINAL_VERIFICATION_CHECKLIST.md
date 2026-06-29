# Checklist Verifikasi Akhir Backend dan RBAC SIPRITI

Tanggal verifikasi: 7 Juni 2026  
Database baru: `new_sipriti_db`  
Database legacy: `sipriti_db`  
Judul tugas akhir: Rancang Bangun Sistem Informasi Pengelolaan Penelitian, Pengabdian Masyarakat, dan Kekayaan Intelektual pada Pusat Riset dan Pengabdian Masyarakat Institut Teknologi Indonesia.

## 1. Ringkasan Status

Verifikasi akhir menunjukkan bahwa tidak ada gap backend aktif dari sisi endpoint, bentuk respons, pemeriksaan migrasi, smoke test, dan uji kesetaraan HTTP. Role `koordinator_penelitian` dan `koordinator_pengabdian` sudah tersedia pada database baru serta sudah dibatasi berdasarkan tipe usulan pada service dan policy backend.

Satu kategori gap ditemukan pada frontend, yaitu guard route dan menu admin hybrid yang terlalu umum bagi koordinator. Gap tersebut telah diperbaiki tanpa mengubah kontrak endpoint backend. Setelah perbaikan, frontend berhasil melewati type-check dan build produksi.

## 2. Checklist Runtime dan Kontrak

| area | status | bukti |
| --- | --- | --- |
| Inventaris route aktif | Lulus | Route pada `src/routes/index.ts` memuat root, autentikasi, pengguna, RBAC, master data, CMS, proposal, workflow, dashboard, audit, upload, dan import. |
| Role database | Lulus | `new_sipriti_db` memiliki `admin`, `dosen`, `mahasiswa`, `kaprodi`, `reviewer`, `koordinator_penelitian`, `koordinator_pengabdian`, `koordinator_hki`, `koordinator_publikasi`, dan `user`. |
| Permission Koordinator Penelitian | Lulus | Memiliki `manage_penelitian`, `view_penelitian`, `review_proposal`, `approve_proposal`, `edit_usulan_by_prodi`, dan `forward_usulan_penelitian`. |
| Permission Koordinator Pengabdian | Lulus | Memiliki `manage_pengabdian`, `view_pengabdian`, `review_proposal`, `approve_proposal`, `edit_usulan_by_prodi`, dan `forward_usulan_pengabdian`. |
| Policy RBAC backend | Lulus | Service/policy proposal-review membatasi Koordinator Penelitian ke `type=penelitian` dan Koordinator Pengabdian ke `type=pengabdian`. |
| Guard RBAC frontend | Sudah diperbaiki | `ProtectedRoute` sekarang berbasis domain koordinator dan Kaprodi. |
| Visibilitas menu frontend | Sudah diperbaiki | Sub-menu proposal admin memakai permission spesifik `view_penelitian`, `view_pengabdian`, dan `view_hki`. |
| Sinkronisasi OpenAPI | Lulus | `npm.cmd run api-docs` berhasil dan menyinkronkan 203 skema Zod. |
| Pengujian kontrak backend | Lulus | `npm.cmd test` berhasil dengan 14 test lulus. |
| Pemeriksaan migrasi dan patch SQL | Lulus | `npm.cmd run phase6:migration-check` berhasil; 16 migrasi dan 11 patch SQL lulus. |
| Idempotensi migrasi database | Lulus | `npm.cmd run db:migrate` berhasil; Sequelize melaporkan schema sudah mutakhir. |
| Build TypeScript backend | Lulus | `npm.cmd run build` berhasil. |
| Smoke test berbasis database | Lulus | `npm.cmd run phase6:smoke` berhasil dengan 30/30 skenario lulus. |
| Uji kesetaraan HTTP lama/baru | Lulus | `npm.cmd run phase6:http-parity` berhasil dengan 20/20 skenario lulus. |
| Type-check frontend | Lulus | `npm.cmd run type-check` berhasil pada folder `SIPRITI`. |
| Build produksi frontend | Lulus dengan catatan | `npm.cmd run build` berhasil; Vite memberi peringatan ukuran chunk besar, bukan kegagalan logika/RBAC. |

## 3. Gap Aktif

| id | kategori | status | deskripsi | dampak | tindak lanjut |
| --- | --- | --- | --- | --- | --- |
| RBAC-FE-001 | Guard route frontend | Sudah diperbaiki | Guard admin hybrid sebelumnya terlalu umum untuk path proposal, detail, monev, dan signature. | Koordinator dapat melihat route lintas domain sebelum backend menolak request. | Sudah dibuat berbasis domain di `SIPRITI/src/components/ui/ProtectedRoute.tsx`; lanjut validasi manual pada frontend asli. |
| RBAC-FE-002 | Visibilitas menu frontend | Sudah diperbaiki | Sub-menu proposal memakai `view_proposal` sebagai alternatif umum. | Menu lintas domain dapat muncul bagi role koordinator. | Sudah diganti ke permission spesifik di `SIPRITI/src/components/admin/NavMenu.tsx`. |
| LOGIC-GAP | Logika backend | Tidak ditemukan | Tidak ada mismatch logic backend baru dari audit source, query role database, build, OpenAPI, test, smoke, dan parity. | Tidak ada tindakan backend saat ini. | Lanjut UAT frontend asli dengan akun role aktual. |
| LEGACY-DEFECT-001 | Defect legacy | Terdokumentasi | Legacy `GET /api/admin/usulan` pernah gagal lokal karena `TahunAkademik` tidak terdefinisi pada service lama. Backend baru mempertahankan respons bekerja. | Bukan bug backend baru; bug-for-bug parity tidak disalin. | Tetap terdokumentasi pada `docs/migration/phase6-parity-gap.md`. |

## 4. Bukti Perintah Verifikasi

```powershell
cd "D:\Ridhuan Ngoding Moment\React\PRPM\new_sipriti_backend"
npm.cmd run build
npm.cmd run api-docs
npm.cmd test
npm.cmd run phase6:migration-check
npm.cmd run db:migrate
npm.cmd run phase6:smoke
npm.cmd run phase6:http-parity

cd "D:\Ridhuan Ngoding Moment\React\PRPM\SIPRITI"
npm.cmd run type-check
npm.cmd run build
```

## 5. Checklist UAT Manual dengan Frontend Asli

| skenario | aktor | status awal | hasil yang diharapkan |
| --- | --- | --- | --- |
| Login dan pemilihan role admin | Admin PRPM | Siap diuji | Admin melihat seluruh menu sesuai permission dan seluruh request tetap melewati middleware backend. |
| Review penelitian | Koordinator Penelitian | Siap diuji | Halaman dan endpoint penelitian dapat diakses; workflow pengabdian ditolak. |
| Forward penelitian | Koordinator Penelitian | Siap diuji | Forward penelitian berhasil untuk proposal valid; forward pengabdian ditolak. |
| Review pengabdian | Koordinator Pengabdian | Siap diuji | Halaman dan endpoint pengabdian dapat diakses; workflow penelitian ditolak. |
| Forward pengabdian | Koordinator Pengabdian | Siap diuji | Forward pengabdian berhasil untuk proposal valid; forward penelitian ditolak. |
| Tanda tangan prodi | Kaprodi | Siap diuji | Kaprodi hanya mengelola tanda tangan sesuai prodi/assignment. |
| Review sesuai assignment | Reviewer | Siap diuji | Reviewer dapat memberi review sesuai assignment; forward ditolak. |
| Kepemilikan proposal | Dosen/Ketua | Siap diuji | Create, edit draft, submit, revisi, dan resubmit mengikuti ownership dan status workflow. |
| Akses URL langsung yang dilarang | Semua role terbatas | Siap diuji | Route frontend tidak memberi akses lintas role; backend tetap mengembalikan 401/403 saat permission tidak cukup. |
| Audit log | Admin/Koordinator yang berwenang | Siap diuji | Aksi penting menghasilkan catatan audit sesuai endpoint yang dijalankan. |

## 6. Kesimpulan Verifikasi

Backend baru berada pada posisi siap UAT dari sisi kontrak endpoint, RBAC server, migrasi, smoke test, dan uji kesetaraan HTTP lama/baru. Frontend RBAC telah diselaraskan agar tidak memberikan akses tampilan lintas domain kepada Koordinator Penelitian dan Koordinator Pengabdian. Tahap berikutnya adalah UAT manual dengan frontend asli menggunakan akun role aktual dan data proposal yang merepresentasikan status Draft, Pending, Reviewed, Forwarded, Approved, Declined, Revisi, dan Resubmit.
