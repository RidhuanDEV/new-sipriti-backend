# Gap Runtime RBAC dan Permission Resource Page

Tanggal verifikasi: 08 Juni 2026

## Ringkasan

Audit dilakukan karena admin tidak dapat mengakses beberapa resource page frontend walaupun seharusnya memiliki seluruh permission. Pemeriksaan juga menemukan endpoint seperti `/api/capaian/deskripsi` masih dapat mengembalikan `FORBIDDEN`, serta beberapa endpoint mengembalikan `DATABASE_ERROR`.

## Temuan dan Perbaikan

| ID | Area | Temuan | Dampak | Perbaikan | Status |
|---|---|---|---|---|---|
| RBAC-01 | Frontend route guard | `RBACContext` dan `ProtectedRoute` sempat memiliki admin-bypass. | Admin bisa lolos karena role, bukan karena permission aktual. Ini tidak sesuai refactor permission-based. | Bypass admin dihapus. `can`, `canAny`, `canAll`, dan `ProtectedRoute.requiredPermissions` sekarang murni membaca daftar permission user. | FIXED |
| RBAC-02 | Auth legacy backend | Respons login backend lama dapat menghasilkan `role: []` karena mapper membaca `user.roles`, sedangkan query login hanya include relasi `role`. | Frontend dapat kehilangan konteks role saat login walaupun database punya `user_roles`. | Query login include relasi `roles`; mapper juga fallback dari `user.role` jika `user.roles` kosong. | FIXED |
| RBAC-03 | Endpoint capaian | `/api/capaian/deskripsi` pada backend lama masih memakai `manage_capaian`. Pada `sipriti_db`, permission tersebut sudah tidak ada, sementara `view_capaian` tersedia. | Admin atau user berizin `view_capaian` tetap ditolak saat membuka halaman kelola capaian. | GET deskripsi capaian memakai `view_capaian`; PUT deskripsi capaian memakai `edit_capaian`. Perubahan diterapkan pada backend lama dan backend baru. | FIXED |
| RBAC-04 | Endpoint resource admin | Beberapa route resource masih memakai `manage_*`, misalnya user, RBAC, output, publikasi, monev, signature, landing slider, prodi, skema, bidang fokus, dan tahun akademik. | Permission granular dari frontend tidak selalu cocok dengan backend. | Route guard backend baru dan sebagian backend lama dipetakan ke `view_*`, `create_*`, `edit_*`, `delete_*`, `assign_roles`, dan `assign_permissions` sesuai fungsi endpoint. | FIXED |
| RBAC-05 | Data permission DB | `new_sipriti_db` dan `sipriti_db` belum seragam untuk permission granular seperti `create_user`, `edit_user`, `delete_user`, `view_signature`, `edit_capaian`, dan beberapa permission resource lain. | Route guard granular dapat gagal jika permission belum tersedia di tabel `permissions`. | Ditambahkan migration, SQL patch idempotent, dan update seeder RBAC Phase 6. SQL patch belum bisa diaplikasikan ulang saat verifikasi akhir karena MySQL tidak mendengar pada port `3306`. | PATCH READY |
| DB-01 | Runtime database | Saat verifikasi akhir, `localhost:3306` tidak listen. | Endpoint yang membutuhkan database berpotensi mengembalikan `DATABASE_ERROR`; smoke HTTP tidak dapat dipastikan final. | Jalankan MySQL, lalu apply `new_sipriti_backend/sql/patch-08-jun-2026-phase6-granular-rbac-completion.sql` ke `sipriti_db` dan `new_sipriti_db`, kemudian restart backend agar route patch aktif. | BLOCKED BY DB |

## Artefak Patch

| Artefak | Fungsi |
|---|---|
| `new_sipriti_backend/src/database/migrations/20260608090000-seed-phase6-granular-permissions.ts` | Migration idempotent untuk permission granular Phase 6. |
| `new_sipriti_backend/sql/patch-08-jun-2026-phase6-granular-rbac-completion.sql` | SQL patch manual/idempotent untuk permission granular dan grant admin. |
| `new_sipriti_backend/src/database/rbac-source.ts` | Sumber seed RBAC Phase 6. |
| `new_sipriti_backend/src/database/seeders/20260524000000-seed-roles-permissions.ts` | Seeder instalasi baru agar selaras dengan patch Phase 6. |

## Verifikasi yang Sudah Lulus

| Gate | Hasil |
|---|---|
| Frontend `npm.cmd run type-check` | PASS |
| Frontend `npm.cmd run lint` | PASS |
| Frontend `npm.cmd test -- --run` | PASS |
| Frontend `npm.cmd run build` | PASS |
| Backend baru `npm.cmd run build` | PASS |
| Backend baru `npm.cmd run api-docs` | PASS |
| Backend baru `npm.cmd test` | PASS |

## Verifikasi Lanjutan Setelah MySQL Aktif

| Langkah | Ekspektasi |
|---|---|
| Apply SQL patch ke `sipriti_db` dan `new_sipriti_db` | Semua permission granular tersedia dan role admin mendapat grant. |
| Restart backend pada port yang dipakai frontend | Route guard baru aktif. |
| Login admin dan panggil `/api/auth/me` | Respons memuat `role: ["admin"]` dan permission granular. |
| GET `/api/capaian/deskripsi` | HTTP 200 untuk admin dengan `view_capaian`. |
| PUT `/api/capaian/deskripsi` | Tidak forbidden untuk admin dengan `edit_capaian`; validasi payload tetap berjalan. |
| Buka resource page admin frontend | Sidebar dan route page terbuka berdasarkan permission `view_*`, bukan role-bypass. |

