# Skenario User Acceptance Testing Fitur Lengkap SIPRITI

Judul tugas akhir: Rancang Bangun Sistem Informasi Pengelolaan Penelitian, Pengabdian Masyarakat, dan Kekayaan Intelektual pada Pusat Riset dan Pengabdian Masyarakat Institut Teknologi Indonesia.  
Tanggal penyusunan: 7 Juni 2026  
Jenis dokumen: Instrumen UAT, pengujian black-box end-to-end, dan validasi RBAC.

## 1. Tujuan UAT

User Acceptance Testing disusun untuk menilai apakah SIPRITI dapat digunakan oleh pengguna akhir sesuai kebutuhan operasional PRPM ITI. Pengujian ini melengkapi pengujian otomatis backend, karena keberhasilan kompilasi dan kesetaraan respons belum cukup untuk memastikan bahwa alur pengguna nyata berjalan lancar. UAT dilaksanakan menggunakan frontend asli, akun role aktual atau data fixture, basis data `new_sipriti_db`, berkas unggahan nyata, dan skenario lintas peran.

## 2. Peran Penguji

| kode | peran | fokus pengujian |
| --- | --- | --- |
| A01 | Pengunjung | Portal publik, berita, pengumuman, panduan, dan capaian. |
| A02 | Dosen atau Peneliti | Login, proposal pribadi, undangan anggota, laporan, HKI, dan dashboard pengguna. |
| A03 | Ketua Proposal | Submit, revisi, resubmit, laporan, dan PDF final. |
| A04 | Kaprodi | Tanda tangan prodi dan akses prodi sesuai assignment. |
| A05 | Koordinator Penelitian | Review, persetujuan/penolakan, edit by prodi, forward, import, laporan, dan dashboard untuk usulan penelitian. |
| A06 | Koordinator Pengabdian | Review, persetujuan/penolakan, edit by prodi, forward, import, laporan, dan dashboard untuk usulan pengabdian. |
| A07 | Reviewer | Review proposal dan validasi laporan sesuai permission. |
| A08 | Admin PRPM | Master data, CMS, RBAC, seluruh proposal, dashboard admin, dan audit log. |
| A09 | Operator PRPM | Import usulan, monev, dan unggahan dokumen pendukung. |

## 3. Kriteria Penerimaan Umum

| aspek | kriteria diterima |
| --- | --- |
| Fungsi | Keluaran aktual sama dengan keluaran yang diharapkan pada skenario. |
| Kontrak API | Respons tidak kehilangan atau mengubah field dari kontrak legacy. |
| RBAC | Admin dapat menjalankan aksi administratif; role lain hanya sesuai permission dan policy sumber daya. |
| Domain koordinator | Koordinator Penelitian tidak dapat menjalankan alur pengabdian, dan Koordinator Pengabdian tidak dapat menjalankan alur penelitian. |
| Keamanan | Akses tanpa login, tanpa CSRF, atau tanpa permission ditolak. |
| Data | Perubahan tersimpan pada basis data dan tampil pada halaman terkait. |
| Berkas | Berkas valid dapat diunggah/diunduh; berkas tidak valid ditolak dengan pesan yang dapat dipahami. |
| Audit | Aktivitas penting tercatat pada audit log bila modul mendukung pencatatan. |
| Kegunaan | Pengguna dapat menyelesaikan tugas tanpa langkah yang membingungkan atau tidak masuk akal. |

## 4. Matriks Skenario UAT

| id | modul | aktor | prasyarat | langkah uji | data uji | hasil yang diharapkan | prioritas | status pelaksanaan |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UAT-AUTH-001 | Login | A02-A08 | Pengguna aktif tersedia | Masuk menggunakan username dan password valid | Akun aktif | Pengguna masuk, kuki JWT dan CSRF tersedia, dashboard sesuai role terbuka | Tinggi | Siap diuji |
| UAT-AUTH-002 | Login gagal | A02-A08 | Pengguna aktif tersedia | Masuk menggunakan password salah | Username valid, password salah | Login ditolak dengan pesan legacy | Tinggi | Siap diuji |
| UAT-AUTH-003 | Logout | A02-A08 | Pengguna sudah login | Klik tombol logout | Session aktif | Session terhapus dan endpoint terlindungi kembali mengembalikan 401 | Tinggi | Siap diuji |
| UAT-AUTH-004 | Profil | A02 | Pengguna sudah login | Ubah profil lalu simpan | Nama, institusi, dan prodi valid | Profil berubah dan field respons tetap sesuai kontrak legacy | Sedang | Siap diuji |
| UAT-AUTH-005 | Ubah password | A02 | Pengguna sudah login | Ubah password dengan password lama valid | Password lama dan baru | Password berubah dan login ulang dengan password baru berhasil | Tinggi | Siap diuji |
| UAT-RBAC-001 | Daftar role | A08 | Admin login | Buka halaman kelola hak akses | Akun admin | Role dan kelompok permission tampil sesuai basis data | Tinggi | Siap diuji |
| UAT-RBAC-002 | Penambahan role | A08 | Pengguna target tersedia | Tambahkan role ke pengguna | Pengguna dosen dan role reviewer | Role bertambah dan permission efektif berubah | Tinggi | Siap diuji |
| UAT-RBAC-003 | Akses RBAC ditolak | A02 | Dosen tanpa izin admin | Akses halaman RBAC | Akun dosen biasa | Akses ditolak 403 atau diarahkan oleh frontend | Tinggi | Siap diuji |
| UAT-RBAC-004 | Akses global admin | A08 | Admin login | Buka penelitian, pengabdian, RBAC, CMS, dan audit | Akun admin | Seluruh halaman administratif terbuka dan endpoint tidak mengembalikan 403 | Tinggi | Siap diuji |
| UAT-RBAC-005 | Guard Koordinator Penelitian | A05 | Koordinator Penelitian login | Buka `/admin/kelola-proposal/penelitian` | Akun koordinator penelitian | Halaman penelitian terbuka | Tinggi | Siap diuji |
| UAT-RBAC-006 | Tolak domain pengabdian untuk Koordinator Penelitian | A05 | Koordinator Penelitian login | Buka `/admin/kelola-proposal/pengabdian` | Akun koordinator penelitian | Frontend menolak/redirect dan backend menolak bila request langsung dikirim | Tinggi | Siap diuji |
| UAT-RBAC-007 | Guard Koordinator Pengabdian | A06 | Koordinator Pengabdian login | Buka `/admin/kelola-proposal/pengabdian` | Akun koordinator pengabdian | Halaman pengabdian terbuka | Tinggi | Siap diuji |
| UAT-RBAC-008 | Tolak domain penelitian untuk Koordinator Pengabdian | A06 | Koordinator Pengabdian login | Buka `/admin/kelola-proposal/penelitian` | Akun koordinator pengabdian | Frontend menolak/redirect dan backend menolak bila request langsung dikirim | Tinggi | Siap diuji |
| UAT-MASTER-001 | CRUD prodi | A08 | Admin login | Tambah, ubah, dan hapus prodi uji | Kode prodi unik | Data prodi berubah dan dropdown ikut terbarui | Sedang | Siap diuji |
| UAT-MASTER-002 | CRUD skema | A08 | Admin login | Tambah skema penelitian/pengabdian/HKI | Nama skema unik | Skema tersimpan dan muncul pada formulir proposal | Sedang | Siap diuji |
| UAT-MASTER-003 | Tahun akademik | A08 | Admin login | Buat tahun akademik baru | Tahun mulai, tahun selesai, semester | Tahun muncul pada pilihan proposal | Sedang | Siap diuji |
| UAT-CMS-001 | Berita publik | A01/A08 | Admin login | Admin membuat berita, pengunjung membuka detail | Judul, isi, kategori, gambar opsional | Slug terbentuk dan detail publik dapat dibuka | Tinggi | Siap diuji |
| UAT-CMS-002 | Pengumuman publik | A01/A08 | Admin login | Admin membuat pengumuman, pengunjung membuka daftar | Judul, isi, lampiran opsional | Pengumuman tampil pada daftar dan detail | Tinggi | Siap diuji |
| UAT-CMS-003 | Panduan publik | A01/A08 | Admin login | Admin membuat panduan dengan berkas | PDF valid | Panduan tampil dan berkas dapat diunduh | Tinggi | Siap diuji |
| UAT-CMS-004 | Slider halaman depan | A01/A08 | Admin login | Unggah slider desktop dan mobile | Gambar valid | Slider aktif tampil pada halaman depan | Sedang | Siap diuji |
| UAT-CMS-005 | Capaian | A01/A08 | Admin login | Ubah deskripsi capaian dan cek halaman publik | Konten teks | Deskripsi berubah dan statistik tetap terbaca | Sedang | Siap diuji |
| UAT-UPLOAD-001 | Unggah gambar valid | A08 | Login dan CSRF valid | Unggah gambar CMS | PNG/JPEG valid | Berkas tersimpan dengan URL publik aman | Tinggi | Siap diuji |
| UAT-UPLOAD-002 | Tolak MIME palsu | A08 | Login dan CSRF valid | Unggah berkas berekstensi gambar tetapi isi bukan gambar | `.png` berisi teks | Unggahan ditolak oleh validasi MIME/magic byte | Tinggi | Siap diuji |
| UAT-UPLOAD-003 | Unggah richtext | A08 | Login dan editor aktif | Unggah gambar dari editor richtext | PNG/JPEG valid | URL richtext dikembalikan dan dapat ditampilkan | Sedang | Siap diuji |
| UAT-PROP-001 | Buat penelitian | A02 | Dosen login | Buat usulan penelitian baru | Judul, skema, tahun, dana, ketua | Proposal tersimpan dengan status Draft | Tinggi | Siap diuji |
| UAT-PROP-002 | Buat pengabdian | A02 | Dosen login | Buat usulan pengabdian baru | Data pengabdian valid | Proposal tersimpan dengan tipe Pengabdian | Tinggi | Siap diuji |
| UAT-PROP-003 | Substansi proposal | A03 | Proposal Draft tersedia | Isi substansi penelitian/pengabdian | Ringkasan, pendahuluan, metode | Bagian substansi tersimpan dan tampil ulang tanpa field hilang | Tinggi | Siap diuji |
| UAT-PROP-004 | Jadwal | A03 | Proposal Draft tersedia | Isi jadwal kegiatan multi bulan | Nama kegiatan, tahun, bulan | Jadwal dan bulan tersimpan sesuai pilihan | Tinggi | Siap diuji |
| UAT-PROP-005 | Luaran | A03 | Proposal Draft tersedia | Isi luaran dan target | Luaran, target capaian, IKU | Luaran tersimpan dan tampil di detail/PDF | Tinggi | Siap diuji |
| UAT-PROP-006 | RAB | A03 | Proposal Draft tersedia | Isi RAB beberapa komponen | Biaya, volume, pajak, sumber dana | Total RAB sesuai kalkulasi dan tersimpan | Tinggi | Siap diuji |
| UAT-PROP-007 | Pencarian anggota | A03 | Pengguna/mahasiswa tersedia | Cari anggota dengan kata kunci | Nama/NIDN/NRP | Hasil pencarian ringkas muncul sesuai kontrak legacy | Tinggi | Siap diuji |
| UAT-PROP-008 | Undang anggota | A03 | Proposal Draft tersedia | Undang anggota dosen | ID anggota | Notifikasi undangan terkirim | Tinggi | Siap diuji |
| UAT-PROP-009 | Terima undangan | A02 | Anggota menerima notifikasi | Klik terima undangan | Undangan pending | Status anggota menjadi diterima | Tinggi | Siap diuji |
| UAT-PROP-010 | Kirim proposal | A03 | Proposal lengkap | Kirim proposal | Proposal Draft lengkap | Status menjadi Pending | Tinggi | Siap diuji |
| UAT-PROP-011 | Hapus proposal | A03 | Proposal Draft milik pengguna | Hapus proposal | ID proposal | Proposal terhapus atau tidak tampil lagi sesuai legacy | Sedang | Siap diuji |
| UAT-KOORD-001 | Usulan penelitian by prodi | A05 | Koordinator Penelitian login | Buka daftar usulan penelitian by prodi | Prodi pengguna | Hanya usulan penelitian prodi terkait yang tampil | Tinggi | Siap diuji |
| UAT-KOORD-002 | Forward penelitian | A05 | Usulan penelitian pending tersedia | Forward ke PRPM | ID proposal penelitian | Status dan efek samping sesuai legacy; audit tercatat bila tersedia | Tinggi | Siap diuji |
| UAT-KOORD-003 | Tolak forward pengabdian oleh Koordinator Penelitian | A05 | Proposal pengabdian tersedia | Kirim request forward pengabdian | ID proposal pengabdian | Respons 403 dan data tidak berubah | Tinggi | Siap diuji |
| UAT-KOORD-004 | Usulan pengabdian by prodi | A06 | Koordinator Pengabdian login | Buka daftar usulan pengabdian by prodi | Prodi pengguna | Hanya usulan pengabdian prodi terkait yang tampil | Tinggi | Siap diuji |
| UAT-KOORD-005 | Forward pengabdian | A06 | Usulan pengabdian pending tersedia | Forward ke PRPM | ID proposal pengabdian | Status dan efek samping sesuai legacy; audit tercatat bila tersedia | Tinggi | Siap diuji |
| UAT-KOORD-006 | Tolak forward penelitian oleh Koordinator Pengabdian | A06 | Proposal penelitian tersedia | Kirim request forward penelitian | ID proposal penelitian | Respons 403 dan data tidak berubah | Tinggi | Siap diuji |
| UAT-REVIEW-001 | Daftar review penelitian | A05/A07/A08 | Proposal pending tersedia | Buka daftar review penelitian | Tipe penelitian | Daftar review tampil sesuai cakupan role | Tinggi | Siap diuji |
| UAT-REVIEW-002 | Daftar review pengabdian | A06/A07/A08 | Proposal pending tersedia | Buka daftar review pengabdian | Tipe pengabdian | Daftar review tampil sesuai cakupan role | Tinggi | Siap diuji |
| UAT-REVIEW-003 | Setujui proposal | A05/A06/A07/A08 | Proposal pending tersedia | Setujui proposal | Catatan opsional | Status menjadi Approved dan efek samping laporan dibuat | Tinggi | Siap diuji |
| UAT-REVIEW-004 | Tolak proposal | A05/A06/A07/A08 | Proposal pending tersedia | Tolak proposal | Catatan wajib | Status menjadi Declined dan catatan revisi tersimpan | Tinggi | Siap diuji |
| UAT-LAP-001 | Unggah laporan | A03 | Proposal approved tersedia | Unggah laporan kemajuan | PDF valid | Laporan tersimpan dengan status Pending atau sesuai legacy | Tinggi | Siap diuji |
| UAT-LAP-002 | Validasi laporan sesuai | A05/A06/A07/A08 | Laporan pending tersedia | Validasi sebagai Sesuai | Status Sesuai | Status berubah dan validator tercatat | Tinggi | Siap diuji |
| UAT-LAP-003 | Validasi laporan revisi | A05/A06/A07/A08 | Laporan pending tersedia | Validasi sebagai Revisi | Catatan revisi | Status Revisi dan catatan wajib tersimpan | Tinggi | Siap diuji |
| UAT-PDF-001 | Buat PDF pengguna | A03 | Proposal lengkap/approved | Buat PDF dari sisi pengguna | ID proposal | PDF terunduh dan berisi data proposal serta signature bila tersedia | Tinggi | Siap diuji |
| UAT-PDF-002 | Buat PDF admin | A08 | Admin login | Buat PDF dari sisi admin | ID proposal | PDF terunduh untuk admin | Tinggi | Siap diuji |
| UAT-SIGN-001 | CRUD tanda tangan admin | A08 | Memiliki `manage_signature` | Unggah tanda tangan PNG | File PNG valid, kode prodi | Tanda tangan tersimpan, aktif, dan berkas dapat dibaca | Tinggi | Siap diuji |
| UAT-SIGN-002 | Tanda tangan Kaprodi | A04 | Kaprodi login | Buka halaman tanda tangan | Prodi Kaprodi | Kaprodi hanya melihat/mengelola tanda tangan sesuai akses | Tinggi | Siap diuji |
| UAT-HKI-001 | Buat HKI | A02 | Dosen login | Buat pengajuan HKI | Judul, jenis, inventor, berkas opsional | HKI tersimpan dengan status awal | Tinggi | Siap diuji |
| UAT-HKI-002 | Setujui HKI | A07/A08 | HKI pending tersedia | Setujui HKI | Catatan opsional | Status HKI menjadi approved | Tinggi | Siap diuji |
| UAT-HKI-003 | Tolak HKI | A07/A08 | HKI pending tersedia | Tolak HKI | Catatan wajib | Status HKI menjadi rejected dan catatan tersimpan | Tinggi | Siap diuji |
| UAT-MONEV-001 | Buat monev | A09 | Operator login | Buat jadwal monev | ID proposal, tanggal, direktorat | Monev tersimpan dan tampil di daftar | Tinggi | Siap diuji |
| UAT-MONEV-002 | Unggah dokumen monev | A09 | Monev tersedia | Unggah berita acara/form/ringkasan | PDF valid | Dokumen tersimpan dan status dokumen berubah | Tinggi | Siap diuji |
| UAT-DASH-001 | Dashboard pengguna | A02 | Pengguna punya proposal/HKI | Buka dashboard pengguna | Session aktif | Jumlah dan status terbaru sesuai data pengguna | Sedang | Siap diuji |
| UAT-DASH-002 | Dashboard koordinator | A05/A06 | Koordinator login | Buka dashboard/admin dashboard terbatas | Data prodi role | Statistik sesuai role dan tidak memuat domain lain secara tidak sah | Sedang | Siap diuji |
| UAT-DASH-003 | Dashboard admin | A08 | Admin login | Buka dashboard admin | Filter tahun/tipe | Statistik proposal, HKI, pengguna, dan prodi tampil | Sedang | Siap diuji |
| UAT-AUDIT-001 | Audit log | A08 | Memiliki `view_audit_log` | Buka audit log setelah mutasi data | Aktivitas tambah/ubah | Audit menampilkan aksi, endpoint, pengguna, dan waktu | Tinggi | Siap diuji |
| UAT-BULK-001 | Unduh template penelitian | A05/A08/A09 | Login dengan `manage_penelitian` | Pilih anggota lalu unduh template import | Anggota terpilih | XLSX terunduh dengan hidden sheet Master_Anggota | Tinggi | Siap diuji |
| UAT-BULK-002 | Unduh template pengabdian | A06/A08/A09 | Login dengan `manage_pengabdian` | Pilih anggota lalu unduh template import | Anggota terpilih | XLSX terunduh dengan hidden sheet Master_Anggota | Tinggi | Siap diuji |
| UAT-BULK-003 | Import valid | A05/A06/A08/A09 | Template baru tersedia | Isi template valid lalu import | Workbook valid | Import sukses atomik dan proposal/member terbentuk | Tinggi | Siap diuji |
| UAT-BULK-004 | Tolak import karena hidden sheet diubah | A05/A06/A08/A09 | Template tersedia | Ubah hidden sheet atau anggota lalu import | Workbook dimodifikasi | Import ditolak sebagai template tamper/stale | Tinggi | Siap diuji |
| UAT-BULK-005 | Tolak ketua tidak valid | A05/A06/A08/A09 | Template tersedia | Isi tanpa ketua atau lebih dari satu ketua | Workbook tidak valid | Import ditolak dengan pesan validasi ketua | Tinggi | Siap diuji |
| UAT-SEC-001 | CSRF tidak tersedia | A02-A08 | Pengguna login | Kirim mutasi tanpa CSRF | Request POST/PUT/DELETE | Respons 403 token CSRF tidak valid/tidak ditemukan | Tinggi | Siap diuji |
| UAT-SEC-002 | Belum login | A01 | Tidak login | Akses endpoint terlindungi | `/api/auth/me`, proposal, audit | Respons 401 `Harap login terlebih dahulu` | Tinggi | Siap diuji |
| UAT-SEC-003 | Permission tidak cukup | A02 | Dosen tanpa izin admin | Akses endpoint admin/RBAC | Endpoint admin | Respons 403 dan tidak ada perubahan data | Tinggi | Siap diuji |
| UAT-SEC-004 | API langsung lintas domain | A05/A06 | Koordinator login | Kirim request langsung ke endpoint domain lawan | ID proposal lintas tipe | Respons 403 dan data tetap aman | Tinggi | Siap diuji |
| UAT-SEC-005 | Percobaan path traversal | A08 | Login dan CSRF valid | Unggah/hapus berkas dengan path manipulatif | Nama/path berbahaya | Request ditolak oleh path guard | Tinggi | Siap diuji |

## 5. Rekapitulasi Rencana UAT

| ringkasan | jumlah |
| --- | --- |
| Total skenario | 71 |
| Prioritas tinggi | 61 |
| Prioritas sedang | 10 |
| Belum diuji manual pada frontend asli | 71 |
| Lulus | Diisi setelah UAT |
| Gagal | Diisi setelah UAT |
| Diblokir | Diisi setelah UAT |

## 6. Format Persetujuan UAT

| pihak | nama | jabatan/peran | tanda tangan | tanggal |
| --- | --- | --- | --- | --- |
| Penguji 1 |  |  |  |  |
| Penguji 2 |  |  |  |  |
| Perwakilan PRPM |  |  |  |  |
| Perwakilan koordinator |  | Koordinator Penelitian/Pengabdian |  |  |
| Pengembang | Ridhuan Rangga Kusuma | Mahasiswa/Peneliti |  |  |

## 7. Catatan Pelaksanaan

Setiap skenario UAT harus mencatat tanggal pengujian, akun yang digunakan, data uji, hasil aktual, bukti tangkapan layar bila diperlukan, serta keputusan akhir. Jika hasil aktual berbeda dari hasil yang diharapkan, perbedaan tersebut dicatat sebagai temuan dan tidak dianggap lulus sampai diperbaiki atau disetujui sebagai perubahan kebutuhan.
