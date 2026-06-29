# Artefak Agile Scrum Berbasis Rekayasa Balik SIPRITI

Judul tugas akhir: **Rancang Bangun Sistem Informasi Pengelolaan Penelitian, Pengabdian Masyarakat, dan Kekayaan Intelektual pada Pusat Riset dan Pengabdian Masyarakat Institut Teknologi Indonesia**

Dokumen ini menyajikan artefak *Agile Scrum* berdasarkan fitur yang benar-benar ditemukan pada sistem SIPRITI. Penyusunan dilakukan melalui rekayasa balik terhadap frontend `SIPRITI`, backend legacy `sipriti_backend`, dan naskah latar belakang tugas akhir `TugasAkhir_1152200025_RIDHUAN RANGGA KUSUMA.md`.

## Prinsip Penyusunan

Artefak ini tidak disusun sebagai daftar fitur imajiner, tetapi sebagai hasil pembacaan terhadap sistem yang sudah tersedia. Oleh karena itu, setiap *User Story* hanya diturunkan dari halaman, route, endpoint, modul, atau perilaku akses yang ditemukan pada source code. Apabila terdapat fitur yang terlihat pada sistem tetapi aktornya tidak termasuk ruang lingkup skripsi, fitur tersebut ditandai sebagai **Perlu Validasi**.

Acceptance Criteria tidak dibuat dengan jumlah tetap. Fitur sederhana diberi kriteria secukupnya, sedangkan fitur kompleks seperti review proposal, laporan, dan RBAC diberi kriteria lebih rinci karena memiliki dampak pada status, hak akses, dan alur kerja pengguna.

## Sumber Pemeriksaan Sistem

| Area | Source Code | Temuan Utama |
| --- | --- | --- |
| Frontend route | `SIPRITI/src/App.tsx` | Route publik, dashboard user, proposal penelitian, proposal pengabdian, HKI, notifikasi, profil, dan area admin. |
| Frontend guard akses | `SIPRITI/src/components/ui/ProtectedRoute.tsx` | Koordinator Penelitian dibatasi pada domain penelitian, Koordinator Pengabdian pada domain pengabdian, Kaprodi pada signature, dan Admin pada area admin utama. |
| Backend route utama | `sipriti_backend/src/routes/index.js` | Endpoint autentikasi, proposal, undangan, notifikasi, penelitian, pengabdian, HKI, upload, RBAC, review, laporan, audit log, output, dan nested proposal section. |
| Backend admin | `sipriti_backend/src/routes/admin.routes.js` | Endpoint prodi, skema, bidang fokus, daftar usulan, statistik usulan, monev, dan bulk import. |
| Backend penelitian | `sipriti_backend/src/modules/research/research.routes.js` | Endpoint daftar, opsi, tambah, ubah, detail, submit, hapus, cari, by-prodi, dan meneruskan penelitian ke hibah internal. |
| Backend pengabdian | `sipriti_backend/src/modules/pengabdian/pengabdian.routes.js` | Endpoint daftar, opsi, tambah, ubah, detail, submit, hapus, cari, by-prodi, dan meneruskan pengabdian ke hibah internal. |
| Backend review proposal | `sipriti_backend/src/modules/proposal-review/proposal-review.routes.js` | Endpoint statistik, daftar review, detail, approve, decline, daftar revisi pengguna, daftar approved pengguna, dan resubmit. |
| Backend laporan | `sipriti_backend/src/modules/laporan-usulan/laporan-usulan.routes.js` | Endpoint daftar laporan, detail laporan, unggah laporan, ubah laporan, dan validasi laporan. |
| Backend HKI | `sipriti_backend/src/modules/hki/hki.routes.js`, `sipriti_backend/src/modules/hki-review/hki-review.routes.js` | Endpoint CRUD HKI dosen, submit HKI, daftar review, statistik review, approve, dan reject HKI. |
| Backend RBAC | `sipriti_backend/src/modules/rbac/rbac.routes.js` | Endpoint role, permission, role-permission, dan user-role. |
| Backend signature | `sipriti_backend/src/modules/official-signatures/official-signatures.routes.js` | Endpoint daftar, tambah, ubah, aktif/nonaktif, hapus, restore, dan akses file signature. |
| Backend import | `sipriti_backend/src/modules/bulk-import/bulk-import.routes.js` | Endpoint unduh template Excel dan unggah file Excel untuk import usulan. |

# Identifikasi Aktor

| Aktor | Peran dalam Sistem |
| --- | --- |
| Admin | Mengelola data inti sistem, akun pengguna, role dan permission, master data, konten publik, proposal, laporan, HKI, monev, tanda tangan resmi, audit log, dan import usulan. |
| Dosen | Mengajukan proposal penelitian dan pengabdian, melengkapi bagian proposal, meneruskan usulan ke hibah internal, menerima undangan anggota, melihat status, memperbaiki usulan, mengunggah laporan, mengelola HKI, dan menerima notifikasi. |
| Koordinator Penelitian | Menangani daftar, detail, review, keputusan, dan meneruskan proposal penelitian ke hibah internal sesuai hak akses domain penelitian. |
| Koordinator Pengabdian | Menangani daftar, detail, review, keputusan, dan meneruskan proposal pengabdian ke hibah internal sesuai hak akses domain pengabdian. |
| Kaprodi | Mengakses area admin terbatas dan mengelola tanda tangan resmi program studi sesuai permission yang tersedia. |

## Catatan Aktor Perlu Validasi

| Temuan | Status | Alasan |
| --- | --- | --- |
| Pengunjung publik dapat membuka berita, pengumuman, panduan, penelitian, pengabdian, dan sentra HKI. | Perlu Validasi | Aktor publik tidak dimasukkan dalam daftar aktor yang diminta. |
| Source code memuat indikasi role lain seperti reviewer, koordinator_hki, koordinator_publikasi, dan mahasiswa. | Perlu Validasi | Role tersebut tidak termasuk aktor yang diminta pada artefak ini. |
| Kaprodi ditemukan jelas pada dashboard/settings terbatas dan signature. | Perlu Validasi | Tidak ditemukan bukti kuat bahwa Kaprodi melakukan review atau meneruskan proposal ke hibah internal pada route yang diperiksa. |

# Identifikasi Modul Sistem

| Modul | Fitur yang Ditemukan | Aktor Utama |
| --- | --- | --- |
| Autentikasi dan Sesi | Login, logout, cek pengguna aktif, ubah password, update profil, dan pemilihan akses multi-role. | Semua aktor |
| Dashboard dan Notifikasi | Ringkasan status, jumlah proposal, notifikasi, jumlah notifikasi belum dibaca, dan undangan anggota. | Semua aktor |
| Manajemen Pengguna dan RBAC | Akun pengguna, role, permission, role-permission, dan user-role. | Admin |
| Master Data | Prodi, skema, bidang fokus, output/luaran, dan data opsi. | Admin |
| Proposal Penelitian | Draft, detail, update, submit, search, by-prodi, meneruskan ke hibah internal, substansi penelitian, jadwal, luaran, dan RAB. | Dosen, Admin, Koordinator Penelitian |
| Proposal Pengabdian | Draft, detail, update, submit, search, by-prodi, meneruskan ke hibah internal, substansi pengabdian, jadwal, luaran, dan RAB. | Dosen, Admin, Koordinator Pengabdian |
| Review Proposal | Daftar review, statistik review, detail review, approve, decline, revisi, resubmit, dan approved proposal. | Admin, Koordinator Penelitian, Koordinator Pengabdian, Dosen |
| Laporan Usulan | Daftar laporan, detail laporan, laporan kemajuan, laporan akhir, unggah ulang, dan validasi laporan. | Dosen, Admin, Koordinator Penelitian, Koordinator Pengabdian |
| Monitoring dan Evaluasi | Jadwal monev, opsi usulan monev, detail monev, dokumen monev, hapus lunak, dan restore. | Admin, Koordinator Penelitian, Koordinator Pengabdian, Dosen |
| Kekayaan Intelektual | Usulan HKI, detail HKI, submit HKI, review HKI, statistik HKI, approve, dan reject HKI. | Dosen, Admin |
| Tanda Tangan Resmi | Upload signature PNG, daftar signature, update, aktif/nonaktif, hapus, restore, dan akses file. | Admin, Kaprodi |
| Import Usulan | Unduh template Excel dan unggah file Excel import usulan. | Admin, Koordinator Penelitian, Koordinator Pengabdian |
| Audit Log | Daftar log aktivitas dan detail log. | Admin |
| Upload dan File | Upload berkas, richtext image, hapus richtext image, dan metadata file. | Semua aktor |
| Integrasi Data Publik | Penarikan data (crawling) dari Google Scholar, BIMA, dan RIS. | Admin |

# User Story

| ID | Aktor | User Story | Prioritas MoSCoW | Story Point | Modul |
| --- | --- | --- | --- | --- | --- |
| US-01 | Semua aktor | Sebagai pengguna sistem, saya ingin masuk dan keluar dari sistem menggunakan akun yang valid sehingga saya hanya dapat mengakses fitur sesuai identitas dan hak akses saya. | Must Have | 5 | Autentikasi dan Sesi |
| US-02 | Semua aktor | Sebagai pengguna yang memiliki lebih dari satu akses, saya ingin memilih akses yang akan digunakan sehingga tampilan dan menu sistem sesuai dengan peran yang sedang saya jalankan. | Must Have | 3 | Autentikasi dan Sesi |
| US-03 | Semua aktor | Sebagai pengguna sistem, saya ingin memperbarui profil dan mengganti kata sandi sehingga data akun saya tetap benar dan keamanan akun dapat dijaga. | Must Have | 3 | Autentikasi dan Sesi |
| US-04 | Dosen | Sebagai Dosen, saya ingin melihat ringkasan status usulan saya pada dashboard sehingga saya dapat mengetahui perkembangan proposal dan laporan secara cepat. | Must Have | 3 | Dashboard dan Notifikasi |
| US-05 | Admin, Koordinator Penelitian, Koordinator Pengabdian, Kaprodi | Sebagai pengguna area administrasi, saya ingin melihat dashboard administrasi sesuai hak akses saya sehingga saya dapat memantau pekerjaan yang menjadi tanggung jawab saya. | Must Have | 5 | Dashboard dan Notifikasi |
| US-06 | Dosen, Koordinator Penelitian, Koordinator Pengabdian, Kaprodi | Sebagai pengguna sistem, saya ingin menerima dan membaca notifikasi sehingga saya mengetahui undangan, perubahan status, atau tindakan yang perlu dilakukan. | Must Have | 5 | Dashboard dan Notifikasi |
| US-07 | Dosen | Sebagai Dosen, saya ingin menerima atau menolak undangan menjadi anggota proposal sehingga keterlibatan saya dalam proposal dapat dikonfirmasi secara jelas. | Must Have | 5 | Dashboard dan Notifikasi |
| US-08 | Dosen | Sebagai Dosen pengusul, saya ingin mencari calon anggota proposal sehingga saya dapat menyusun tim proposal berdasarkan data anggota yang tersedia. | Must Have | 3 | Proposal Penelitian dan Pengabdian |
| US-09 | Admin | Sebagai Admin, saya ingin mengelola akun pengguna sehingga pengguna sistem dapat dibuat, diperbarui, dinonaktifkan, atau dipulihkan sesuai kebutuhan administrasi. | Must Have | 8 | Manajemen Pengguna dan RBAC |
| US-10 | Admin | Sebagai Admin, saya ingin mengelola role dan permission sehingga hak akses setiap aktor dapat dikendalikan secara terstruktur. | Must Have | 8 | Manajemen Pengguna dan RBAC |
| US-11 | Admin | Sebagai Admin, saya ingin mengelola data program studi sehingga data kelembagaan yang digunakan pada proposal dan tanda tangan selalu sesuai. | Must Have | 5 | Master Data |
| US-12 | Admin | Sebagai Admin, saya ingin mengelola skema usulan sehingga proposal penelitian dan pengabdian dapat diklasifikasikan sesuai skema yang berlaku. | Must Have | 5 | Master Data |
| US-13 | Admin | Sebagai Admin, saya ingin mengelola bidang fokus sehingga usulan dapat dikaitkan dengan fokus penelitian atau pengabdian yang tepat. | Must Have | 3 | Master Data |
| US-15 | Admin | Sebagai Admin, saya ingin mengelola output atau luaran proposal sehingga pilihan luaran yang digunakan pada proposal dapat dikendalikan dari sistem. | Must Have | 5 | Master Data |
| US-21 | Dosen | Sebagai Dosen, saya ingin membuat draft proposal penelitian sehingga ide penelitian saya dapat dicatat dan dilanjutkan sebelum dikirim untuk review. | Must Have | 8 | Proposal Penelitian |
| US-22 | Dosen | Sebagai Dosen, saya ingin melengkapi bagian proposal penelitian sehingga substansi, jadwal, luaran, dan RAB penelitian tersusun sebelum diajukan. | Must Have | 8 | Proposal Penelitian |
| US-23 | Dosen | Sebagai Dosen, saya ingin mengirim proposal penelitian sehingga proposal dapat masuk ke alur review PRPM. | Must Have | 5 | Proposal Penelitian |
| US-24 | Dosen | Sebagai Dosen, saya ingin melihat detail dan memperbaiki proposal penelitian sehingga proposal revisi dapat diperbaiki tanpa membuat usulan baru. | Must Have | 5 | Proposal Penelitian |
| US-25 | Dosen | Sebagai Dosen, saya ingin membuat draft proposal pengabdian sehingga rencana pengabdian kepada masyarakat dapat dicatat sebelum diajukan. | Must Have | 8 | Proposal Pengabdian |
| US-26 | Dosen | Sebagai Dosen, saya ingin melengkapi bagian proposal pengabdian sehingga substansi, jadwal, luaran, dan RAB pengabdian tersusun sebelum diajukan. | Must Have | 8 | Proposal Pengabdian |
| US-27 | Dosen | Sebagai Dosen, saya ingin mengirim proposal pengabdian sehingga proposal dapat masuk ke alur review PRPM. | Must Have | 5 | Proposal Pengabdian |
| US-28 | Dosen | Sebagai Dosen, saya ingin melihat detail dan memperbaiki proposal pengabdian sehingga proposal revisi dapat diperbaiki tanpa membuat usulan baru. | Must Have | 5 | Proposal Pengabdian |
| US-29 | Koordinator Penelitian | Sebagai Koordinator Penelitian, saya ingin melihat daftar dan detail proposal penelitian sehingga saya dapat memeriksa usulan dalam tanggung jawab penelitian. | Must Have | 5 | Review Proposal |
| US-30 | Admin, Koordinator Penelitian | Sebagai Admin atau Koordinator Penelitian, saya ingin menyetujui atau menolak proposal penelitian sehingga keputusan review penelitian dapat dicatat sesuai alur PRPM. | Must Have | 8 | Review Proposal |
| US-31 | Dosen, Admin, Koordinator Penelitian | Sebagai Dosen, Admin, atau Koordinator Penelitian, saya ingin meneruskan proposal penelitian ke hibah internal sehingga proposal dapat berkembang menjadi program hibah internal sesuai alur PRPM. | Must Have | 5 | Review Proposal |
| US-32 | Koordinator Penelitian | Sebagai Koordinator Penelitian, saya ingin memperbarui usulan penelitian berdasarkan prodi apabila diizinkan sehingga koreksi administratif dapat dilakukan pada domain penelitian. | Should Have | 5 | Proposal Penelitian |
| US-33 | Koordinator Pengabdian | Sebagai Koordinator Pengabdian, saya ingin melihat daftar dan detail proposal pengabdian sehingga saya dapat memeriksa usulan dalam tanggung jawab pengabdian. | Must Have | 5 | Review Proposal |
| US-34 | Admin, Koordinator Pengabdian | Sebagai Admin atau Koordinator Pengabdian, saya ingin menyetujui atau menolak proposal pengabdian sehingga keputusan review pengabdian dapat dicatat sesuai alur PRPM. | Must Have | 8 | Review Proposal |
| US-35 | Dosen, Admin, Koordinator Pengabdian | Sebagai Dosen, Admin, atau Koordinator Pengabdian, saya ingin meneruskan proposal pengabdian ke hibah internal sehingga proposal dapat berkembang menjadi program hibah internal sesuai alur PRPM. | Must Have | 5 | Review Proposal |
| US-36 | Koordinator Pengabdian | Sebagai Koordinator Pengabdian, saya ingin memperbarui usulan pengabdian berdasarkan prodi apabila diizinkan sehingga koreksi administratif dapat dilakukan pada domain pengabdian. | Should Have | 5 | Proposal Pengabdian |
| US-37 | Admin | Sebagai Admin, saya ingin mengelola proposal usulan secara terpusat (seluruh tipe) sehingga PRPM dapat memantau dan mengatur proposal dari satu area administrasi. | Must Have | 8 | Review Proposal |
| US-38 | Dosen | Sebagai Dosen, saya ingin mengunggah laporan kemajuan dan laporan akhir sehingga kewajiban pelaporan atas proposal yang disetujui dapat dipenuhi melalui sistem. | Must Have | 8 | Laporan Usulan |
| US-39 | Admin, Koordinator Penelitian, Koordinator Pengabdian | Sebagai pengelola review laporan, saya ingin memvalidasi laporan usulan sehingga status laporan dapat diputuskan dan tercatat dalam alur monitoring PRPM. | Must Have | 8 | Laporan Usulan |
| US-40 | Admin, Koordinator Penelitian, Koordinator Pengabdian | Sebagai pengelola monev, saya ingin mengelola jadwal dan dokumen monitoring evaluasi sehingga pelaksanaan monev internal dapat terdokumentasi. | Should Have | 8 | Monitoring dan Evaluasi |
| US-41 | Dosen | Sebagai Dosen, saya ingin melihat informasi monitoring dan evaluasi sehingga saya mengetahui jadwal atau status monev atas usulan yang berkaitan dengan saya. | Should Have | 3 | Monitoring dan Evaluasi |
| US-42 | Dosen | Sebagai Dosen, saya ingin mengelola usulan kekayaan intelektual sehingga luaran HKI saya dapat diajukan, diperbarui, dan dikirim untuk proses administrasi. | Must Have | 8 | Kekayaan Intelektual |
| US-43 | Admin | Sebagai Admin, saya ingin meninjau dan memutuskan usulan HKI sehingga status HKI dapat disetujui atau ditolak berdasarkan kelengkapan administrasi. | Should Have | 8 | Kekayaan Intelektual |
| US-44 | Kaprodi | Sebagai Kaprodi, saya ingin mengelola tanda tangan resmi program studi sehingga dokumen sistem dapat menggunakan tanda tangan yang benar dan aktif. | Must Have | 5 | Tanda Tangan Resmi |
| US-45 | Admin | Sebagai Admin, saya ingin mengelola seluruh tanda tangan resmi sehingga kebutuhan dokumen administratif dapat dikendalikan dari area admin. | Should Have | 5 | Tanda Tangan Resmi |
| US-46 | Admin, Koordinator Penelitian, Koordinator Pengabdian | Sebagai pengelola usulan, saya ingin melakukan import usulan melalui template Excel sehingga data usulan dapat dimasukkan secara massal. | Should Have | 8 | Import Usulan |
| US-47 | Admin | Sebagai Admin, saya ingin melihat audit log sehingga aktivitas penting pada sistem dapat ditelusuri untuk pengawasan dan audit. | Should Have | 5 | Audit Log |
| US-48 | Dosen, Admin, Koordinator Penelitian, Koordinator Pengabdian | Sebagai pengguna yang berwenang, saya ingin mengunduh atau melihat dokumen final proposal sehingga proposal dapat digunakan sebagai arsip resmi. | Must Have | 5 | Review Proposal |
| US-49 | Semua aktor | Sebagai pengguna yang berwenang, saya ingin mengunggah dan mengelola file sesuai konteks fitur sehingga dokumen, gambar, atau lampiran dapat disimpan dengan aman. | Must Have | 5 | Upload dan File |
| US-50 | Admin | Sebagai Admin, saya ingin melakukan penarikan data (crawling) publikator dari Google Scholar sehingga data profil publikasi dosen dapat diperbarui secara otomatis. | Should Have | 13 | Integrasi Data Publik |
| US-51 | Admin | Sebagai Admin, saya ingin melakukan penarikan data (crawling) dari BIMA (Bima Kemdikbud) sehingga data hibah eksternal dosen dapat tersinkronisasi. | Should Have | 13 | Integrasi Data Publik |
| US-52 | Admin | Sebagai Admin, saya ingin melakukan penarikan data (crawling) dari RIS (Research Information System) sehingga portofolio riset dosen lebih lengkap. | Should Have | 13 | Integrasi Data Publik |

# Acceptance Criteria

| ID User Story | Acceptance Criteria |
| --- | --- |
| US-01 | Sistem menerima login dengan kredensial yang valid. |
| US-01 | Sistem menolak login dengan kredensial yang tidak sesuai. |
| US-01 | Sistem dapat menampilkan data pengguna aktif setelah login. |
| US-01 | Pengguna dapat logout dan sesi tidak lagi digunakan untuk mengakses halaman terlindungi. |
| US-02 | Sistem menampilkan pilihan akses bagi pengguna yang memiliki lebih dari satu role. |
| US-02 | Sistem mengarahkan pengguna ke dashboard sesuai akses yang dipilih. |
| US-02 | Menu dan route yang tampil mengikuti role aktif pengguna. |
| US-03 | Pengguna dapat melihat data profil miliknya sendiri. |
| US-03 | Pengguna dapat memperbarui field profil yang diizinkan. |
| US-03 | Pengguna dapat mengganti kata sandi melalui validasi yang ditentukan sistem. |
| US-04 | Dashboard menampilkan ringkasan status proposal milik dosen. |
| US-04 | Dashboard menampilkan jumlah proposal berdasarkan kategori status. |
| US-04 | Data dashboard tidak menampilkan proposal milik pengguna lain. |
| US-05 | Admin dapat melihat ringkasan administrasi sistem. |
| US-05 | Koordinator Penelitian hanya dapat mengakses area admin yang relevan dengan domain penelitian. |
| US-05 | Koordinator Pengabdian hanya dapat mengakses area admin yang relevan dengan domain pengabdian. |
| US-05 | Kaprodi hanya dapat mengakses area admin yang diperbolehkan, khususnya signature dan pengaturan terbatas. |
| US-06 | Pengguna dapat melihat daftar notifikasi miliknya. |
| US-06 | Sistem menampilkan jumlah notifikasi yang belum dibaca. |
| US-06 | Pengguna dapat menandai satu notifikasi atau seluruh notifikasi sebagai sudah dibaca. |
| US-07 | Dosen dapat melihat undangan proposal yang ditujukan kepadanya. |
| US-07 | Dosen dapat menerima undangan sehingga status keanggotaan berubah menjadi diterima. |
| US-07 | Dosen dapat menolak undangan sehingga status keanggotaan berubah menjadi ditolak. |
| US-07 | Hasil penerimaan atau penolakan undangan tidak mengubah data proposal lain yang tidak terkait. |
| US-08 | Dosen dapat mencari calon anggota berdasarkan kata kunci yang tersedia pada sistem. |
| US-08 | Sistem menampilkan hasil pencarian anggota yang relevan dengan kriteria pencarian. |
| US-08 | Hasil pencarian dapat digunakan sebagai dasar pemilihan anggota proposal. |
| US-09 | Admin dapat melihat daftar akun pengguna. |
| US-09 | Admin dapat mencari atau memfilter akun pengguna. |
| US-09 | Admin dapat melihat detail akun pengguna. |
| US-09 | Admin dapat memperbarui data akun pengguna sesuai field administrasi. |
| US-09 | Admin dapat menonaktifkan akun pengguna. |
| US-09 | Admin dapat memulihkan akun pengguna yang dinonaktifkan. |
| US-10 | Admin dapat melihat daftar role dan permission. |
| US-10 | Admin dapat membuat role atau permission sesuai kebutuhan sistem. |
| US-10 | Admin dapat mengubah data role. |
| US-10 | Admin dapat mengatur permission yang melekat pada role. |
| US-10 | Admin dapat menetapkan role kepada pengguna. |
| US-10 | Sistem menjaga agar perubahan role dan permission memengaruhi akses route dan menu sesuai aturan RBAC. |
| US-11 | Admin dapat melihat daftar program studi. |
| US-11 | Admin dapat menambahkan atau memperbarui data program studi. |
| US-11 | Data program studi yang aktif dapat digunakan pada proposal, pengguna, dan tanda tangan. |
| US-12 | Admin dapat melihat daftar skema usulan. |
| US-12 | Admin dapat menambahkan atau memperbarui skema usulan. |
| US-12 | Skema yang tersedia dapat digunakan pada formulir proposal penelitian dan pengabdian. |
| US-13 | Admin dapat melihat daftar bidang fokus. |
| US-13 | Admin dapat menambahkan atau memperbarui bidang fokus. |
| US-13 | Bidang fokus dapat digunakan sebagai metadata usulan. |
| US-15 | Admin dapat melihat daftar luaran yang tersedia. |
| US-15 | Admin dapat menambahkan jenis luaran baru. |
| US-15 | Data luaran yang ditambahkan tersimpan dan dapat digunakan pada formulir proposal. |
| US-15 | Sistem menjaga luaran sebagai referensi yang konsisten untuk proposal. |
| US-21 | Dosen dapat membuat proposal penelitian baru. |
| US-21 | Sistem menyimpan proposal penelitian awal sebagai draft. |
| US-21 | Data dasar penelitian divalidasi sebelum disimpan. |
| US-21 | Proposal draft hanya dapat dikelola oleh pengguna yang berwenang. |
| US-22 | Dosen dapat mengisi substansi proposal penelitian. |
| US-22 | Dosen dapat mengisi jadwal kegiatan penelitian. |
| US-22 | Dosen dapat mengisi luaran proposal penelitian. |
| US-22 | Dosen dapat mengisi RAB penelitian. |
| US-22 | Sistem menyimpan setiap bagian sebagai data yang terhubung dengan proposal yang sama. |
| US-23 | Dosen dapat mengirim proposal penelitian dari status draft. |
| US-23 | Sistem menolak submit apabila data wajib belum terpenuhi. |
| US-23 | Status proposal penelitian berubah sesuai alur submit. |
| US-23 | Proposal yang sudah dikirim masuk ke daftar review pihak berwenang. |
| US-24 | Dosen dapat melihat daftar dan detail proposal penelitian miliknya. |
| US-24 | Dosen dapat memperbarui proposal penelitian yang masih boleh diedit. |
| US-24 | Dosen dapat melihat proposal yang membutuhkan revisi. |
| US-24 | Dosen dapat mengirim ulang proposal penelitian setelah revisi. |
| US-25 | Dosen dapat membuat proposal pengabdian baru. |
| US-25 | Sistem menyimpan proposal pengabdian awal sebagai draft. |
| US-25 | Data dasar pengabdian divalidasi sebelum disimpan. |
| US-25 | Proposal draft hanya dapat dikelola oleh pengguna yang berwenang. |
| US-26 | Dosen dapat mengisi substansi proposal pengabdian. |
| US-26 | Dosen dapat mengisi jadwal kegiatan pengabdian. |
| US-26 | Dosen dapat mengisi luaran proposal pengabdian. |
| US-26 | Dosen dapat mengisi RAB pengabdian. |
| US-26 | Sistem menyimpan setiap bagian sebagai data yang terhubung dengan proposal yang sama. |
| US-27 | Dosen dapat mengirim proposal pengabdian dari status draft. |
| US-27 | Sistem menolak submit apabila data wajib belum terpenuhi. |
| US-27 | Status proposal pengabdian berubah sesuai alur submit. |
| US-27 | Proposal yang sudah dikirim masuk ke daftar review pihak berwenang. |
| US-28 | Dosen dapat melihat daftar dan detail proposal pengabdian miliknya. |
| US-28 | Dosen dapat memperbarui proposal pengabdian yang masih boleh diedit. |
| US-28 | Dosen dapat melihat proposal yang membutuhkan revisi. |
| US-28 | Dosen dapat mengirim ulang proposal pengabdian setelah revisi. |
| US-29 | Koordinator Penelitian dapat melihat daftar proposal penelitian yang perlu diperiksa. |
| US-29 | Sistem menampilkan detail proposal penelitian dan bagian pendukungnya. |
| US-29 | Sistem menolak akses Koordinator Penelitian ke daftar proposal pengabdian yang bukan domainnya. |
| US-30 | Admin atau Koordinator Penelitian dapat melihat proposal penelitian yang menunggu review. |
| US-30 | Sistem menampilkan detail proposal penelitian sebelum keputusan diberikan. |
| US-30 | Admin atau Koordinator Penelitian dapat menyetujui proposal penelitian. |
| US-30 | Admin atau Koordinator Penelitian dapat menolak proposal penelitian. |
| US-30 | Catatan atau alasan wajib tersedia saat proposal ditolak atau dikembalikan untuk revisi. |
| US-30 | Status proposal berubah sesuai keputusan review. |
| US-30 | Dosen dapat melihat hasil review pada daftar status atau daftar revisi. |
| US-30 | Keputusan review tercatat sebagai bagian dari riwayat proses proposal. |
| US-31 | Dosen, Admin, atau Koordinator Penelitian dapat meneruskan proposal penelitian ke hibah internal sesuai endpoint. |
| US-31 | Sistem memeriksa status proposal sebelum penerusan ke hibah internal dilakukan. |
| US-31 | Proposal yang belum memenuhi kondisi workflow tidak dapat diteruskan. |
| US-31 | Status atau tahapan proposal berubah setelah penerusan ke hibah internal berhasil. |
| US-31 | Penerusan penelitian ke hibah internal tidak berlaku untuk proposal pengabdian. |
| US-32 | Koordinator Penelitian dapat membuka daftar usulan penelitian berdasarkan prodi apabila memiliki permission. |
| US-32 | Koordinator Penelitian dapat memperbarui data administratif proposal penelitian yang diizinkan. |
| US-32 | Sistem tetap membatasi perubahan berdasarkan status proposal dan domain penelitian. |
| US-33 | Koordinator Pengabdian dapat melihat daftar proposal pengabdian yang perlu diperiksa. |
| US-33 | Sistem menampilkan detail proposal pengabdian dan bagian pendukungnya. |
| US-33 | Sistem menolak akses Koordinator Pengabdian ke daftar proposal penelitian yang bukan domainnya. |
| US-34 | Admin atau Koordinator Pengabdian dapat melihat proposal pengabdian yang menunggu review. |
| US-34 | Sistem menampilkan detail proposal pengabdian sebelum keputusan diberikan. |
| US-34 | Admin atau Koordinator Pengabdian dapat menyetujui proposal pengabdian. |
| US-34 | Admin atau Koordinator Pengabdian dapat menolak proposal pengabdian. |
| US-34 | Catatan atau alasan wajib tersedia saat proposal ditolak atau dikembalikan untuk revisi. |
| US-34 | Status proposal berubah sesuai keputusan review. |
| US-34 | Dosen dapat melihat hasil review pada daftar status atau daftar revisi. |
| US-34 | Keputusan review tercatat sebagai bagian dari riwayat proses proposal. |
| US-35 | Dosen, Admin, atau Koordinator Pengabdian dapat meneruskan proposal pengabdian ke hibah internal sesuai endpoint. |
| US-35 | Sistem memeriksa status proposal sebelum penerusan ke hibah internal dilakukan. |
| US-35 | Proposal yang belum memenuhi kondisi workflow tidak dapat diteruskan. |
| US-35 | Status atau tahapan proposal berubah setelah penerusan ke hibah internal berhasil. |
| US-35 | Penerusan pengabdian ke hibah internal tidak berlaku untuk proposal penelitian. |
| US-36 | Koordinator Pengabdian dapat membuka daftar usulan pengabdian berdasarkan prodi apabila memiliki permission. |
| US-36 | Koordinator Pengabdian dapat memperbarui data administratif proposal pengabdian yang diizinkan. |
| US-36 | Sistem tetap membatasi perubahan berdasarkan status proposal dan domain pengabdian. |
| US-37 | Admin dapat melihat dan mengelola proposal usulan secara terpusat. |
| US-37 | Admin dapat memfilter pengelolaan proposal usulan berdasarkan parameter yang tersedia. |
| US-37 | Admin dapat melihat statistik proposal usulan. |
| US-37 | Admin dapat membuka detail usulan berdasarkan tipe dan id. |
| US-38 | Dosen dapat mengunggah laporan kemajuan. |
| US-38 | Dosen dapat mengunggah laporan akhir. |
| US-38 | Sistem membedakan jenis laporan berdasarkan konteks pengajuan. |
| US-38 | Dosen dapat mengunggah ulang laporan yang masih dapat diperbaiki. |
| US-38 | File laporan divalidasi sebelum diterima sistem. |
| US-39 | Pengelola dapat melihat daftar laporan yang perlu divalidasi. |
| US-39 | Pengelola dapat membuka detail laporan dan proposal terkait. |
| US-39 | Pengelola dapat memberi keputusan validasi laporan. |
| US-39 | Status laporan berubah sesuai keputusan validasi. |
| US-39 | Dosen dapat mengetahui status laporan setelah divalidasi. |
| US-39 | Koordinator hanya memvalidasi laporan sesuai domain permission yang dimiliki. |
| US-40 | Pengelola dapat membuat jadwal monev. |
| US-40 | Pengelola dapat memilih usulan sebagai objek monev. |
| US-40 | Pengelola dapat memperbarui data monev. |
| US-40 | Pengelola dapat mengunggah dokumen monev. |
| US-40 | Pengelola dapat menghapus lunak dan memulihkan data monev. |
| US-41 | Dosen dapat membuka halaman monitoring dan evaluasi. |
| US-41 | Sistem menampilkan informasi monev yang berkaitan dengan usulan dosen. |
| US-41 | Sistem tidak menampilkan informasi monev yang tidak berhak diakses dosen. |
| US-42 | Dosen dapat melihat daftar dan detail HKI miliknya. |
| US-42 | Dosen dapat membuat usulan HKI. |
| US-42 | Dosen dapat memperbarui usulan HKI yang masih dapat diedit. |
| US-42 | Dosen dapat mengunggah lampiran HKI sesuai kebutuhan form. |
| US-42 | Dosen dapat mengirim usulan HKI untuk proses administrasi. |
| US-43 | Admin dapat melihat statistik dan daftar HKI untuk review. |
| US-43 | Admin dapat membuka detail HKI. |
| US-43 | Admin dapat menyetujui HKI. |
| US-43 | Admin dapat menolak HKI. |
| US-43 | Status HKI berubah sesuai keputusan review. |
| US-44 | Kaprodi dapat membuka halaman signature sesuai pembatasan route. |
| US-44 | Kaprodi dapat melihat daftar tanda tangan yang berhubungan dengan kewenangannya. |
| US-44 | Kaprodi dapat memperbarui tanda tangan apabila memiliki permission yang sesuai. |
| US-44 | Signature yang aktif dapat digunakan untuk kebutuhan dokumen sistem. |
| US-45 | Admin dapat membuat signature dengan file PNG. |
| US-45 | Admin dapat memperbarui data dan file signature. |
| US-45 | Admin dapat mengaktifkan atau menonaktifkan signature. |
| US-45 | Admin dapat menghapus lunak dan memulihkan signature. |
| US-45 | Admin dapat mengakses file signature yang tersimpan. |
| US-46 | Pengelola dapat mengunduh template Excel import usulan. |
| US-46 | Pengelola dapat mengunggah file Excel sesuai format yang diterima sistem. |
| US-46 | Sistem menolak file yang bukan format Excel yang diizinkan. |
| US-46 | Import hanya dapat dilakukan oleh role dengan permission manajemen penelitian atau pengabdian. |
| US-46 | Hasil import memberikan informasi keberhasilan atau kesalahan pemrosesan. |
| US-47 | Admin dapat melihat daftar audit log. |
| US-47 | Admin dapat membuka detail audit log. |
| US-47 | Akses audit log dibatasi oleh permission yang sesuai. |
| US-48 | Pengguna berwenang dapat mengakses dokumen final proposal berdasarkan tipe usulan. |
| US-48 | Sistem menolak akses dokumen final apabila pengguna tidak berhak melihat proposal. |
| US-48 | Dokumen final menggunakan data proposal yang tersimpan di sistem. |
| US-49 | Pengguna berwenang dapat mengunggah file sesuai konteks fitur. |
| US-49 | Sistem menyediakan upload gambar richtext untuk konten yang membutuhkannya. |
| US-49 | Pengguna dapat menghapus gambar richtext yang tidak digunakan. |
| US-49 | Sistem menyediakan metadata file sesuai hak akses pengguna. |
| US-49 | File yang diunggah diproses sesuai validasi keamanan yang berlaku pada modul terkait. |
| US-50 | Sistem menyediakan fitur crawling data publikasi Google Scholar berdasarkan ID Scholar dosen. |
| US-50 | Hasil crawling disimpan sebagai portofolio publikasi dosen yang terhubung ke profilnya. |
| US-51 | Sistem menyediakan fitur crawling data hibah eksternal BIMA berdasarkan NIDN dosen. |
| US-51 | Hasil crawling disimpan sebagai riwayat hibah eksternal dosen di sistem. |
| US-52 | Sistem menyediakan fitur crawling data portofolio riset dari RIS. |
| US-52 | Data RIS yang ditarik divalidasi dan diintegrasikan dengan database lokal. |

# Product Backlog

| ID | User Story Ringkas | Aktor | Prioritas | Story Point |
| --- | --- | --- | --- | --- |
| US-01 | Login, cek sesi, dan logout | Semua aktor | Must Have | 5 |
| US-02 | Pemilihan akses multi-role | Semua aktor | Must Have | 3 |
| US-03 | Pengelolaan profil dan kata sandi | Semua aktor | Must Have | 3 |
| US-04 | Dashboard ringkasan dosen | Dosen | Must Have | 3 |
| US-05 | Dashboard administrasi sesuai role | Admin, Koordinator Penelitian, Koordinator Pengabdian, Kaprodi | Must Have | 5 |
| US-06 | Notifikasi pengguna | Dosen, Koordinator Penelitian, Koordinator Pengabdian, Kaprodi | Must Have | 5 |
| US-07 | Konfirmasi undangan anggota proposal | Dosen | Must Have | 5 |
| US-08 | Pencarian anggota proposal | Dosen | Must Have | 3 |
| US-09 | Manajemen akun pengguna | Admin | Must Have | 8 |
| US-10 | Manajemen role dan permission | Admin | Must Have | 8 |
| US-11 | Manajemen prodi | Admin | Must Have | 5 |
| US-12 | Manajemen skema usulan | Admin | Must Have | 5 |
| US-13 | Manajemen bidang fokus | Admin | Must Have | 3 |
| US-15 | Manajemen output atau luaran | Admin | Must Have | 5 |
| US-21 | Draft proposal penelitian | Dosen | Must Have | 8 |
| US-22 | Substansi, jadwal, luaran, dan RAB penelitian | Dosen | Must Have | 8 |
| US-23 | Submit proposal penelitian | Dosen | Must Have | 5 |
| US-24 | Detail, edit, dan resubmit proposal penelitian | Dosen | Must Have | 5 |
| US-25 | Draft proposal pengabdian | Dosen | Must Have | 8 |
| US-26 | Substansi, jadwal, luaran, dan RAB pengabdian | Dosen | Must Have | 8 |
| US-27 | Submit proposal pengabdian | Dosen | Must Have | 5 |
| US-28 | Detail, edit, dan resubmit proposal pengabdian | Dosen | Must Have | 5 |
| US-29 | Daftar dan detail review proposal penelitian | Koordinator Penelitian | Must Have | 5 |
| US-30 | Approve atau decline proposal penelitian | Admin, Koordinator Penelitian | Must Have | 8 |
| US-31 | Meneruskan proposal penelitian ke hibah internal | Dosen, Admin, Koordinator Penelitian | Must Have | 5 |
| US-33 | Daftar dan detail review proposal pengabdian | Koordinator Pengabdian | Must Have | 5 |
| US-34 | Approve atau decline proposal pengabdian | Admin, Koordinator Pengabdian | Must Have | 8 |
| US-35 | Meneruskan proposal pengabdian ke hibah internal | Dosen, Admin, Koordinator Pengabdian | Must Have | 5 |
| US-37 | Pengelolaan proposal usulan terpusat | Admin | Must Have | 8 |
| US-38 | Upload laporan kemajuan dan laporan akhir | Dosen | Must Have | 8 |
| US-39 | Validasi laporan usulan | Admin, Koordinator Penelitian, Koordinator Pengabdian | Must Have | 8 |
| US-42 | Pengelolaan usulan HKI oleh dosen | Dosen | Must Have | 8 |
| US-44 | Pengelolaan signature oleh Kaprodi | Kaprodi | Must Have | 5 |
| US-48 | Dokumen final proposal | Dosen, Admin, Koordinator Penelitian, Koordinator Pengabdian | Must Have | 5 |
| US-49 | Upload dan pengelolaan file | Semua aktor | Must Have | 5 |
| US-32 | Edit usulan penelitian by-prodi | Koordinator Penelitian | Should Have | 5 |
| US-36 | Edit usulan pengabdian by-prodi | Koordinator Pengabdian | Should Have | 5 |
| US-40 | Monitoring dan evaluasi internal | Admin, Koordinator Penelitian, Koordinator Pengabdian | Should Have | 8 |
| US-41 | Informasi monev untuk dosen | Dosen | Should Have | 3 |
| US-43 | Review HKI oleh Admin | Admin | Should Have | 8 |
| US-45 | Pengelolaan signature oleh Admin | Admin | Should Have | 5 |
| US-46 | Import usulan melalui Excel | Admin, Koordinator Penelitian, Koordinator Pengabdian | Should Have | 8 |
| US-47 | Audit log | Admin | Should Have | 5 |
| US-50 | Crawler data publikasi Google Scholar | Admin | Should Have | 13 |
| US-51 | Crawler data hibah BIMA | Admin | Should Have | 13 |
| US-52 | Crawler data portofolio RIS | Admin | Should Have | 13 |

# Sprint Planning

Durasi skripsi ditetapkan 12 minggu. Dengan panjang sprint 2 minggu, keseluruhan pekerjaan dipetakan menjadi 6 sprint. Pembagian berikut bersifat rekonstruktif berdasarkan sistem yang sudah selesai dikembangkan, sehingga menggambarkan urutan pengembangan yang logis menurut dependensi bisnis dan kemajuan riil saat ini.

| Sprint | Minggu | Tujuan Sprint | User Story | Total Story Point |
| --- | --- | --- | --- | --- |
| Sprint 1 | Minggu 1-2 | Menyediakan fondasi akses pengguna, sesi, dashboard dasar, notifikasi, mekanisme keanggotaan, dan audit log dari awal proyek. | US-01, US-02, US-03, US-04, US-05, US-06, US-07, US-08, US-47 | 37 |
| Sprint 2 | Minggu 3-4 | Menyediakan fondasi administrasi pengguna, RBAC, master data utama, dan modul upload file. | US-09, US-10, US-11, US-12, US-13, US-15, US-49 | 39 |
| Sprint 3 | Minggu 5-6 | Menyelesaikan alur pengajuan proposal (penelitian & pengabdian), meneruskan ke hibah internal, integrasi tanda tangan resmi (signature) kaprodi/admin, pelaporan kemajuan/akhir proposal, serta dokumen final proposal. | US-21, US-22, US-23, US-24, US-25, US-26, US-27, US-28, US-31, US-35, US-38, US-44, US-45, US-48 | 85 |
| Sprint 4 (Saat Ini) | Minggu 7-8 | Menyediakan alur review proposal penelitian & pengabdian, pengelolaan proposal usulan terpusat, pelaksanaan monitoring dan evaluasi (monev) internal beserta validasinya, serta fitur import usulan via Excel (berdasarkan feedback review Sprint 3). | US-29, US-30, US-32, US-33, US-34, US-36, US-37, US-39, US-40, US-41, US-46 | 71 |
| Sprint 5 (Berikutnya) | Minggu 9-10 | Menyelesaikan pengelolaan usulan Kekayaan Intelektual (HKI) oleh dosen dan alur peninjauan (review) HKI oleh Admin. | US-42, US-43 | 16 |
| Sprint 6 | Minggu 11-12 | Mengembangkan fitur crawler untuk penarikan data publikasi dan portofolio riset dari sumber eksternal seperti Google Scholar, BIMA, dan RIS. | US-50, US-51, US-52 | 39 |

# MVP (Minimum Viable Product)

MVP SIPRITI adalah kumpulan fitur minimum agar sistem dapat digunakan untuk pengelolaan penelitian, pengabdian, dan kekayaan intelektual secara operasional.

| Kelompok MVP | User Story | Alasan |
| --- | --- | --- |
| Akses dan akun | US-01, US-02, US-03 | Sistem harus dapat mengidentifikasi pengguna, membedakan role, dan menjaga data akun. |
| Dashboard dan notifikasi | US-04, US-05, US-06, US-07 | Pengguna perlu mengetahui status, undangan, dan pekerjaan yang harus ditindaklanjuti. |
| Fondasi administrasi | US-09, US-10, US-11, US-12, US-13, US-15 | Proposal tidak dapat berjalan stabil tanpa akun, RBAC, prodi, skema, bidang fokus, dan luaran. |
| Proposal penelitian | US-08, US-21, US-22, US-23, US-24 | Penelitian merupakan salah satu domain utama sistem. |
| Proposal pengabdian | US-25, US-26, US-27, US-28 | Pengabdian merupakan salah satu domain utama sistem. |
| Review dan meneruskan ke hibah internal | US-29, US-30, US-31, US-33, US-34, US-35, US-37 | Usulan perlu diverifikasi dan diteruskan sesuai alur PRPM. |
| Laporan | US-38, US-39 | Proposal yang disetujui membutuhkan pelaporan dan validasi laporan. |
| HKI | US-42 | Kekayaan intelektual termasuk ruang lingkup judul tugas akhir. |
| Signature dan dokumen | US-44, US-48 | Dokumen administratif membutuhkan signature dan dokumen final proposal. |
| Upload dan file | US-49 | File diperlukan oleh proposal, laporan, HKI, signature, dan konten. |

# Fitur Pengembangan Lanjutan

| ID | Fitur | Alasan Dapat Ditunda |
| --- | --- | --- |
| US-32 | Edit usulan penelitian by-prodi | Berguna untuk koreksi administratif, tetapi workflow inti tetap dapat berjalan melalui pengusul dan Admin. |
| US-36 | Edit usulan pengabdian by-prodi | Berguna untuk koreksi administratif, tetapi workflow inti tetap dapat berjalan melalui pengusul dan Admin. |
| US-40 | Monev internal | Dapat dijalankan setelah proposal dan laporan stabil. |
| US-41 | Tampilan monev untuk dosen | Bergantung pada kesiapan modul monev. |
| US-43 | Review HKI oleh Admin | Dapat ditunda jika fase awal hanya mencatat pengajuan HKI. |
| US-45 | Signature oleh Admin | Kaprodi menjadi aktor utama signature dalam ruang lingkup yang diminta. |
| US-46 | Import usulan Excel | Mempercepat input massal, tetapi tidak menggantikan input manual. |
| US-47 | Audit log | Penting untuk audit, tetapi dapat menjadi penguatan setelah workflow utama berjalan. |
| US-50 | Crawler Google Scholar | Merupakan fitur otomatisasi profil eksternal, bukan core operasional proposal. |
| US-51 | Crawler BIMA | Merupakan fitur otomatisasi data eksternal. |
| US-52 | Crawler RIS | Merupakan fitur tambahan pelengkap portofolio dosen. |

# Ringkasan Scrum

| Komponen | Nilai |
| --- | --- |
| Total User Story | 46 |
| Total Story Point | 287 |
| Jumlah Sprint | 6 sprint |
| Durasi Total | 12 minggu |
| Rata-rata Story Point per Sprint | 47,8 |
| Estimasi Kompleksitas Sistem | Sangat Tinggi |

Kompleksitas sistem dikategorikan tinggi karena SIPRITI tidak hanya memuat pengelolaan data, tetapi juga workflow lintas aktor, pembatasan RBAC, status proposal, review dan meneruskan proposal ke hibah internal berdasarkan domain penelitian atau pengabdian, laporan, monev, HKI, upload file, import Excel, dan tanda tangan resmi. Kompleksitas terbesar berada pada modul proposal dan review karena setiap keputusan status berdampak pada hak akses, tampilan frontend, dan tindakan lanjutan pengguna.

# Catatan Validasi

| Area | Catatan |
| --- | --- |
| Aktor publik | Halaman publik benar-benar ada, tetapi aktor pengunjung publik tidak dimasukkan karena daftar aktor yang diberikan hanya berisi Admin, Dosen, Koordinator Penelitian, Koordinator Pengabdian, dan Kaprodi. |
| Reviewer terpisah | Source code memiliki indikasi permission review dan role lain, tetapi aktor Reviewer tidak dimasukkan dalam ruang lingkup permintaan. Jika pembimbing meminta aktor Reviewer, backlog perlu diturunkan ulang sebagian. |
| Kaprodi | Berdasarkan source yang dibaca, Kaprodi paling jelas terkait dashboard/settings terbatas dan signature. Klaim bahwa Kaprodi dapat review atau meneruskan proposal ke hibah internal tidak dimasukkan karena tidak ditemukan bukti route yang kuat pada ruang lingkup pemeriksaan. |
| Koordinator domain | Koordinator Penelitian dan Koordinator Pengabdian dipisah karena frontend guard dan endpoint meneruskan ke hibah internal membedakan domain penelitian dan pengabdian. |
| Import Excel | Import ditemukan pada backend dan frontend admin. Pembagian domain koordinator mengikuti permission `manage_penelitian` dan `manage_pengabdian`. |

# Penilaian Story Point (SP) Berbasis Deret Fibonacci

Dalam estimasi kompleksitas *User Story*, nilai *Story Point* (SP) yang digunakan merujuk pada **Deret Fibonacci termodifikasi** (1, 2, 3, 5, 8, 13, 21), yang merupakan standar industri dalam metodologi Agile Scrum. Prinsip utama penilaian dalam proyek ini didasarkan pada tingkat kejelasan *requirement* dan risiko kesalahan teknis:
*   **Requirement tidak jelas menjadi ambigu, maka SP bertambah besar.**
*   **Requirement jelas menjadi minim risiko salah, maka SP lebih kecil atau akurat.**

Berdasarkan analisis fungsionalitas sistem SIPRITI, rentang nilai yang digunakan adalah **3, 5, 8, dan 13**. Berikut adalah pembenaran teknis penggunaannya:

### 1. Story Point 3 (Rendah - Minor Complexity)
Diberikan pada fitur operasional dasar yang *requirement*-nya sangat jelas dan lurus (*straightforward*). Risiko kesalahannya sangat minim.
*   **Contoh:** Update profil, tampilan dashboard dosen ringkas, dan pencarian anggota (US-03, US-04, US-08).
*   **Alasan:** Operasi CRUD dasar pada satu tabel (misal: tabel `Users`) tanpa validasi bisnis lintas tabel. Requirement jelas dan risiko *bug* sangat kecil.

### 2. Story Point 5 (Menengah - Medium Complexity)
Diberikan pada fitur operasional yang memiliki relasi dengan entitas data lain, *requirement* jelas namun membutuhkan kewaspadaan lebih pada aspek validasi (seperti *upload* file) serta penjagaan batas hak akses (*middleware guard*) antar domain.
*   **Contoh:** Proses *Submit* proposal, peninjauan (review) oleh koordinator, meneruskan usulan ke hibah internal, manajemen data master, dan kelola tanda tangan resmi (US-23, US-31, US-35, US-44).
*   **Alasan:** Membutuhkan validasi kelengkapan data (misal: substansi, RAB, jadwal) dan pengecekan otorisasi spesifik (`manage_penelitian` atau `manage_pengabdian`). Risiko menengah namun *requirement*-nya sudah dapat dipetakan dengan baik.

### 3. Story Point 8 (Tinggi - High Complexity)
Diberikan pada fitur utama yang menjadi 'tulang punggung' (*core logic*) sistem. Modul ini menghubungkan banyak tabel secara simultan, menyangkut perlakuan *Role-Based Access Control* (RBAC) dinamis, atau memiliki alur persetujuan panjang.
*   **Contoh:** Pembuatan draft dan seluruh kelengkapan proposal secara utuh, sistem manajemen laporan & monev yang terikat pada keputusan final, manajemen dinamis RBAC, dan *Import* usulan via Excel (US-22, US-38, US-39, US-46).
*   **Alasan:** Terdapat kompleksitas integrasi data (*One-to-Many* / *Many-to-Many*) dan logika pengecekan hak akses `permissions` secara iteratif. Tingkat ambiguitas mulai muncul pada penanganan *error handling* untuk *batch import*.

### 4. Story Point 13 (Sangat Tinggi - Very High Complexity)
Diberikan pada fitur dengan *requirement* yang memiliki tingkat ambiguitas tinggi, ketergantungan penuh pada sistem pihak ketiga, dan risiko kesalahan (*error*) komputasi yang besar.
*   **Contoh:** Fitur *Crawler/Scraping* data publik Scholar, BIMA, dan RIS (US-50, US-51, US-52).
*   **Alasan:** Melakukan penarikan data dari situs eksternal sangat rentan terhadap perubahan struktur HTML target (*ambigu*). Sinkronisasi data ke *database* internal memerlukan logika resolusi konflik data yang rumit, sehingga *effort* dan risikonya sangat tinggi, maka diberikan SP 13.

