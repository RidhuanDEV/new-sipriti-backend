# Laporan Tugas Akhir SIPRITI PRPM ITI

Judul tugas akhir: Rancang Bangun Sistem Informasi Pengelolaan Penelitian, Pengabdian Masyarakat, dan Kekayaan Intelektual pada Pusat Riset dan Pengabdian Masyarakat Institut Teknologi Indonesia.

Nama: Ridhuan Rangga Kusuma  
NPM: 1152200025  
Program Studi: Teknik Informatika  
Tanggal penyusunan: 7 Juni 2026

## Abstrak

Pusat Riset dan Pengabdian Masyarakat Institut Teknologi Indonesia membutuhkan sistem informasi yang mampu menyatukan pengelolaan penelitian, pengabdian kepada masyarakat, kekayaan intelektual, publikasi kelembagaan, laporan, pemantauan, dan arsip administrasi. Permasalahan utama yang diangkat dalam tugas akhir ini bukan hanya perpindahan dari proses manual ke sistem digital, melainkan bagaimana sistem dibangun agar alur kerja kelembagaan dapat dijalankan secara tertib, dapat diaudit, dan memiliki pengendalian akses yang jelas. Penelitian ini menggunakan pendekatan rancang bangun dengan kerangka kerja *Agile Scrum*. Setiap kebutuhan diturunkan menjadi *Product Backlog*, dipilih ke dalam beberapa *Sprint*, lalu diverifikasi melalui pengujian fungsional, pemeriksaan kesetaraan kontrak layanan, serta validasi peran pengguna.

Hasil penelitian menunjukkan bahwa sistem SIPRITI berhasil dibangun dengan arsitektur aplikasi web berbasis React, Express.js, TypeScript, Sequelize, MySQL, Zod, autentikasi berbasis kuki JWT, proteksi CSRF, *Role-Based Access Control* (RBAC), validasi unggahan berkas, dan pencatatan audit. Pemeriksaan akhir terhadap basis data `new_sipriti_db` membuktikan bahwa aktor Admin PRPM, Dosen, Ketua Proposal, Kaprodi, Koordinator Penelitian, Koordinator Pengabdian, Reviewer, Operator PRPM, dan Pengunjung telah terakomodasi dalam rancangan sistem. Dua peran koordinator dipisahkan secara tegas: Koordinator Penelitian hanya berlaku pada usulan penelitian, sedangkan Koordinator Pengabdian hanya berlaku pada usulan pengabdian. Pengujian otomatis menunjukkan 203 skema API tersinkron, 14 pengujian kontrak lulus, 16 migrasi dan 11 patch SQL valid, 30 skenario *smoke test* lulus, serta 20 skenario kesetaraan HTTP antara backend lama dan backend baru lulus. Dengan demikian, sistem telah memenuhi sasaran teknis untuk digunakan pada tahap UAT dengan frontend asli.

Kata kunci: SIPRITI, PRPM, sistem informasi, penelitian, pengabdian kepada masyarakat, kekayaan intelektual, RBAC, *Agile Scrum*, REST API.

## Daftar Lampiran Teknis

| jenis lampiran | berkas |
| --- | --- |
| Checklist verifikasi akhir | `FINAL_VERIFICATION_CHECKLIST.md` |
| Dokumentasi API | `API_DOCUMENTATION_SKRIPSI.md` |
| Skenario UAT fitur lengkap | `UAT_FULL_FEATURE_TEST_CASES.md` |
| Audit gap RBAC final | `RBAC_LOGIC_FINAL_GAP.md` |
| Diagram konteks sistem | `diagrams/01-system-context.mmd` |
| Diagram arsitektur backend | `diagrams/02-backend-architecture.mmd` |
| Diagram use case | `diagrams/03-use-case.mmd` |
| Diagram aktivitas alur proposal | `diagrams/04-proposal-workflow-activity.mmd` |
| Diagram urutan autentikasi dan proposal | `diagrams/05-auth-proposal-sequence.mmd` |
| Diagram deployment | `diagrams/06-deployment.mmd` |
| Diagram aliran data | `diagrams/07-data-flow.mmd` |
| ERD DBML | `diagrams/08-erd.dbml` |
| Diagram matriks aktor dan RBAC | `diagrams/09-rbac-actor-matrix.mmd` |

# BAB I PENDAHULUAN

## 1.1 Latar Belakang

Perguruan tinggi tidak dapat melepaskan diri dari kebutuhan tata kelola data yang tertib. Penelitian, pengabdian kepada masyarakat, publikasi, laporan kegiatan, dan kekayaan intelektual bukan sekadar dokumen administratif; seluruhnya menjadi bukti kinerja akademik yang digunakan untuk pelaporan, akreditasi, serta evaluasi mutu kelembagaan. Pada lembaga seperti Pusat Riset dan Pengabdian Masyarakat Institut Teknologi Indonesia, kebutuhan tersebut menuntut sistem yang mampu menyimpan data secara terpusat, menampilkan informasi publik, dan mengendalikan proses internal secara konsisten.

Sejumlah penelitian terdahulu telah menunjukkan bahwa sistem informasi berbasis web dapat meningkatkan efektivitas pengelolaan penelitian dan pengabdian. Afriansyah (2022) menekankan masalah pengarsipan dan pencarian dokumen pada lembaga penelitian dan pengabdian yang masih dikelola secara konvensional. Anata et al. (2024) menunjukkan bahwa aplikasi web membantu proses administrasi dan pelaporan kegiatan akademik. Imam Syafii dan Ridha (2023) juga menegaskan pentingnya sistem yang mampu mengelola penyimpanan serta distribusi informasi penelitian dan pengabdian secara lebih terstruktur.

Kebutuhan PRPM ITI memiliki tingkat kerumitan yang lebih luas karena sistem tidak hanya mengelola data akhir, tetapi juga mengatur siklus hidup usulan. Seorang dosen dapat membuat proposal, mengundang anggota, mengisi bagian substansi, menyusun jadwal, memasukkan luaran, mengelola RAB, mengirim usulan, menerima revisi, mengunggah laporan, hingga menghasilkan PDF final. Di sisi lain, Kaprodi, Koordinator Penelitian, Koordinator Pengabdian, Reviewer, Admin PRPM, dan Operator PRPM memiliki hak serta batasan yang berbeda. Jika batasan ini tidak ditanamkan ke dalam rancangan sistem, proses digital justru dapat membuka risiko akses data yang tidak semestinya.

Aspek pengendalian akses menjadi titik penting penelitian ini. Le et al. (2022) menjelaskan bahwa kebijakan RBAC pada aplikasi web sering tersebar pada beberapa bagian implementasi, sehingga perlu ditelusuri dari perilaku sistem, bukan hanya dari tabel peran. Laverdiere et al. (2021) juga menunjukkan bahwa perubahan hak akses dapat berdampak langsung pada perlindungan aplikasi. Dengan latar tersebut, SIPRITI dirancang tidak hanya sebagai aplikasi administrasi, tetapi sebagai sistem informasi yang menggabungkan kontrak API, kebijakan akses, alur kerja proposal, dan pencatatan audit secara terpadu.

Research gap yang diisi oleh penelitian ini terletak pada tiga hal. Pertama, penelitian terdahulu banyak membahas digitalisasi pengelolaan penelitian dan pengabdian, tetapi belum banyak menempatkan pemisahan aktor koordinator berdasarkan domain penelitian dan pengabdian sebagai bagian utama rancangan RBAC. Kedua, sebagian sistem sejenis belum membahas strategi menjaga kesetaraan kontrak API ketika sistem baru harus tetap digunakan oleh frontend lama. Ketiga, dokumentasi pengembangan sering berhenti pada deskripsi fitur, belum menyajikan hubungan antara backlog, sprint, hasil pengujian, gap, dan kesiapan UAT secara terstruktur. Penelitian ini mengisi celah tersebut melalui rancang bangun SIPRITI dengan metode *Agile Scrum*, audit RBAC end-to-end, dan verifikasi kesetaraan backend lama terhadap backend baru.

## 1.2 Rumusan Masalah

Berdasarkan latar belakang tersebut, rumusan masalah penelitian disusun sebagai berikut.

| kode | rumusan masalah |
| --- | --- |
| RM-1 | Bagaimana merancang dan membangun sistem informasi PRPM berbasis web yang dapat mengelola penelitian, pengabdian kepada masyarakat, kekayaan intelektual, publikasi kelembagaan, laporan, pemantauan, dan dashboard secara terpadu? |
| RM-2 | Bagaimana menerapkan metode *Agile Scrum* agar proses pengembangan sistem dapat ditelusuri melalui *Product Backlog*, *Sprint Backlog*, *Increment*, *Sprint Review*, dan *Sprint Retrospective*? |
| RM-3 | Bagaimana menerapkan RBAC yang membedakan hak akses Admin PRPM, Dosen, Ketua Proposal, Kaprodi, Koordinator Penelitian, Koordinator Pengabdian, Reviewer, Operator PRPM, dan Pengunjung? |
| RM-4 | Bagaimana memastikan backend baru tetap sesuai dengan kontrak endpoint, bentuk permintaan, bentuk respons, izin akses, dan logika alur kerja backend lama? |
| RM-5 | Bagaimana hasil rancang bangun sistem diverifikasi melalui pengujian fungsional, dokumentasi API, pemeriksaan migrasi basis data, uji kesetaraan HTTP, dan UAT? |

## 1.3 Tujuan Penelitian

Tujuan penelitian diturunkan langsung dari rumusan masalah agar arah penelitian tetap terukur.

| kode | tujuan penelitian |
| --- | --- |
| TP-1 | Menghasilkan sistem informasi SIPRITI yang mendukung pengelolaan data dan alur kerja PRPM ITI secara terpadu. |
| TP-2 | Menerapkan kerangka kerja *Agile Scrum* sebagai metode pengembangan sistem yang terdokumentasi melalui backlog, sprint, increment, review, dan retrospective. |
| TP-3 | Mengimplementasikan RBAC dan kebijakan kepemilikan sumber daya yang membedakan setiap aktor sesuai tanggung jawabnya. |
| TP-4 | Mempertahankan kesesuaian kontrak backend baru terhadap backend lama agar frontend asli tetap dapat digunakan tanpa perubahan kontrak besar. |
| TP-5 | Menyusun bukti verifikasi berupa dokumentasi API, hasil pengujian otomatis, skenario UAT, diagram sistem, ERD, dan laporan audit gap. |

## 1.4 Manfaat Penelitian

Penelitian ini memberikan manfaat pada beberapa pihak. Bagi PRPM ITI, sistem yang dibangun dapat membantu sentralisasi data penelitian, pengabdian, kekayaan intelektual, publikasi, laporan, dan audit aktivitas. Bagi dosen dan peneliti, SIPRITI menyediakan alur pengajuan proposal yang lebih tertib mulai dari penyusunan usulan sampai laporan. Bagi Kaprodi, Koordinator Penelitian, Koordinator Pengabdian, dan Reviewer, sistem menyediakan ruang kerja yang sesuai dengan domain kewenangannya. Bagi Admin PRPM, sistem menyediakan pengelolaan master data, pengguna, hak akses, konten publik, audit log, dan import data. Bagi penulis, penelitian ini menjadi penerapan ilmu rekayasa perangkat lunak, basis data, keamanan aplikasi web, dan pengujian sistem informasi pada studi kasus nyata.

## 1.5 Batasan Masalah

Ruang lingkup penelitian dibatasi pada rancang bangun sistem berbasis web untuk PRPM ITI, meliputi modul autentikasi, pengguna, RBAC, master data, CMS, unggahan berkas, proposal penelitian, proposal pengabdian, kekayaan intelektual, laporan, PDF final, tanda tangan resmi, pemantauan, dashboard, audit log, dan import usulan. Sistem menggunakan React pada sisi frontend, Express.js dan TypeScript pada sisi backend, Sequelize sebagai ORM, serta MySQL sebagai sistem manajemen basis data. Pembahasan tidak mencakup infrastruktur *high availability*, integrasi SSO eksternal, maupun pengujian beban produksi berskala besar. UAT manual dengan pengguna akhir tetap ditempatkan sebagai tahap lanjutan setelah verifikasi otomatis selesai.

## 1.6 Sistematika Penulisan

Bab I menjelaskan latar belakang, rumusan masalah, tujuan, manfaat, batasan masalah, dan sistematika penulisan. Bab II membahas penelitian terdahulu, landasan teori, RBAC, REST API, *Agile Scrum*, pengujian sistem, dan kerangka berpikir. Bab III menjelaskan metodologi penelitian berbasis *Agile Scrum*, termasuk backlog, sprint, Definition of Done, dan alat pengembangan. Bab IV menyajikan hasil implementasi, pengujian, pembahasan RBAC, serta evaluasi gap. Bab V memuat kesimpulan dan saran yang diturunkan dari hasil penelitian.

# BAB II TINJAUAN PUSTAKA

## 2.1 Penelitian Terdahulu

Tabel 2.1 menyajikan posisi penelitian ini terhadap penelitian terdahulu. Literatur yang dipilih berfokus pada sistem informasi penelitian dan pengabdian, keamanan RBAC, metode Scrum, serta pengujian fungsional.

| no | peneliti dan tahun | fokus penelitian | celah penelitian | kontribusi penelitian ini |
| --- | --- | --- | --- | --- |
| 1 | Afriansyah (2022) | Sistem informasi manajemen penelitian dan pengabdian pada P3KM Polman Negeri Babel. | Pengelolaan data dan arsip menjadi fokus utama, tetapi pembahasan RBAC granular lintas aktor belum menjadi perhatian pokok. | SIPRITI menambahkan pemisahan peran dosen, Kaprodi, koordinator, reviewer, admin, dan operator. |
| 2 | Anata et al. (2024) | Sistem informasi penelitian dan pengabdian berbasis web di perguruan tinggi. | Sistem menekankan administrasi dan pelaporan, belum menonjolkan kesetaraan kontrak API terhadap sistem lama. | SIPRITI menjaga endpoint, permintaan, respons, dan alur kerja backend lama melalui uji kesetaraan. |
| 3 | Imam Syafii dan Ridha (2023) | Rancang bangun sistem informasi penelitian dan pengabdian ITSK Sugeng Hartono. | Fokus pada penyimpanan dan distribusi informasi, belum menekankan validasi unggahan aman dan audit akses. | SIPRITI menambahkan validasi ukuran, MIME, magic byte, nama berkas UUID, path guard, dan audit log. |
| 4 | Rizal et al. (2024) | Sistem informasi P3M berbasis web untuk pemantauan tridharma. | Relevan pada domain P3M, tetapi tidak membahas strategi cutover backend lama ke backend baru. | SIPRITI menyertakan migration plan, parity report, smoke matrix, dan checklist kesiapan cutover. |
| 5 | Toscany et al. (2022) | Pengembangan sistem penelitian dan pengabdian dengan perhatian pada fleksibilitas administrator dan keamanan. | Kebutuhan fleksibilitas administrator dan pengamanan dokumen menjadi gap penting. | SIPRITI memperkuat RBAC, CSRF, kuki JWT, audit log, dan matriks izin. |
| 6 | Le et al. (2022) | Reverse engineering kebijakan RBAC pada aplikasi web. | Kebijakan akses dapat tersebar di implementasi dan tidak cukup dilihat dari satu lapisan saja. | Audit SIPRITI menelusuri basis data, route, middleware, service, policy, dan guard frontend. |
| 7 | Kadenic et al. (2023) | Kematangan tim dan komponen utama Scrum. | Scrum perlu diterapkan sebagai mekanisme empiris yang dapat ditinjau, bukan sekadar label metode. | Pengembangan SIPRITI dipetakan menjadi backlog, sprint, increment, review, dan retrospective. |
| 8 | Zidan et al. (2022) | Black-box testing dengan equivalence partitioning. | Pengujian perlu memvalidasi perilaku sistem dari sisi input dan output pengguna. | UAT SIPRITI disusun sebagai skenario black-box lintas aktor dan permission. |

Berdasarkan Tabel 2.1, penelitian terdahulu telah membahas digitalisasi pengelolaan penelitian dan pengabdian, namun belum seluruhnya menggabungkan RBAC granular, kesetaraan kontrak API terhadap sistem lama, validasi keamanan unggahan, dan dokumentasi sprint dalam satu penelitian rancang bangun. SIPRITI diposisikan sebagai solusi integratif: sistem tidak hanya menyediakan fungsi administrasi, tetapi juga menata ulang batas kewenangan aktor serta membuktikan kesesuaian perilaku backend baru terhadap backend lama.

## 2.2 Sistem Informasi Pengelolaan PRPM

Sistem informasi adalah sarana yang menghubungkan data, proses, pengguna, dan keluaran informasi. Pada konteks PRPM, sistem informasi tidak hanya berfungsi sebagai tempat penyimpanan, tetapi juga sebagai alat koordinasi kelembagaan. Penelitian mengenai sistem informasi penelitian dan pengabdian menunjukkan bahwa digitalisasi membantu proses pengarsipan, pencarian, pelaporan, dan pemantauan kegiatan akademik (Afriansyah, 2022; Rizal et al., 2024). Dengan demikian, SIPRITI dirancang sebagai sistem yang menghubungkan proses publikasi informasi, pengajuan proposal, validasi, pelaporan, dan audit.

## 2.3 REST API dan Dokumentasi OpenAPI

REST API digunakan karena frontend dan backend membutuhkan kontrak komunikasi berbasis HTTP yang stabil. Pada penelitian ini, API diposisikan sebagai perjanjian teknis antara antarmuka pengguna dan logika aplikasi. Dokumentasi OpenAPI digunakan untuk menggambarkan endpoint, parameter, bentuk respons, dan skema data secara terstandar. OpenAPI Initiative (2024) menjelaskan bahwa spesifikasi OpenAPI menyediakan format yang dapat dibaca manusia dan mesin untuk mendeskripsikan layanan HTTP. Pada SIPRITI, skema Zod disinkronkan ke dokumentasi API agar validasi kode dan dokumentasi tidak berjalan sendiri-sendiri.

## 2.4 Role-Based Access Control

RBAC merupakan pendekatan pengendalian akses yang memetakan hak pengguna berdasarkan peran dan izin. Pada aplikasi web, RBAC perlu diuji secara hati-hati karena perubahan kecil pada peran atau izin dapat memengaruhi perlindungan data (Laverdiere et al., 2021). Le et al. (2022) menunjukkan bahwa kebijakan RBAC sering tersembunyi dalam logika aplikasi. Temuan tersebut relevan dengan SIPRITI karena izin tidak hanya disimpan pada tabel `roles`, `permissions`, dan `role_permissions`, tetapi juga diterapkan pada middleware, service, policy, dan guard frontend.

## 2.5 Agile Scrum

Scrum merupakan kerangka kerja empiris yang menekankan transparansi, inspeksi, dan adaptasi (Schwaber & Sutherland, 2020). Kadenic et al. (2023) menunjukkan bahwa keberhasilan Scrum tidak hanya bergantung pada penggunaan istilah Scrum, tetapi juga pada kedewasaan penerapan peran, artefak, acara, dan nilai Scrum. Pada tugas akhir ini, Scrum digunakan sebagai metode pengembangan sistem karena kebutuhan SIPRITI berubah secara bertahap dan setiap bagian sistem harus dapat diperiksa melalui increment yang berjalan.

## 2.6 Pengujian Black-box dan UAT

Pengujian black-box berfokus pada perilaku sistem dari sisi input dan output tanpa memeriksa struktur internal kode. Zidan et al. (2022) menggunakan equivalence partitioning untuk menyusun kelas pengujian berdasarkan variasi input. Pada SIPRITI, prinsip tersebut digunakan untuk menyusun UAT lintas aktor: Pengunjung, Dosen, Ketua Proposal, Kaprodi, Koordinator Penelitian, Koordinator Pengabdian, Reviewer, Admin PRPM, dan Operator PRPM. Pengujian ini penting karena keberhasilan sistem tidak cukup dinilai dari keberhasilan build, tetapi harus dilihat dari kemampuan pengguna menyelesaikan tugas operasional.

## 2.7 Kerangka Berpikir

Kerangka berpikir penelitian dimulai dari masalah tata kelola PRPM, dilanjutkan dengan studi pustaka, perumusan kebutuhan, penyusunan *Product Backlog*, pelaksanaan sprint, pengujian increment, pembahasan hasil, dan penarikan kesimpulan. Alur konseptual tersebut divisualisasikan pada lampiran diagram konteks sistem, diagram use case, diagram aktivitas proposal, diagram aliran data, ERD, dan matriks RBAC aktor.

# BAB III METODOLOGI PENELITIAN

## 3.1 Jenis dan Pendekatan Penelitian

Penelitian ini merupakan penelitian terapan dengan pendekatan rancang bangun sistem. Objek yang dikembangkan adalah sistem informasi SIPRITI untuk PRPM ITI. Metode pengembangan yang digunakan adalah *Agile Scrum* karena sistem dibangun melalui beberapa increment yang dapat diuji secara bertahap. Scrum dipilih bukan sebagai formalitas istilah, melainkan sebagai cara kerja untuk menjaga agar kebutuhan, implementasi, dan hasil pengujian selalu dapat diperiksa pada akhir setiap sprint (Schwaber & Sutherland, 2020; Kadenic et al., 2023).

## 3.2 Tempat dan Lingkungan Penelitian

Penelitian dilakukan pada konteks kebutuhan Pusat Riset dan Pengabdian Masyarakat Institut Teknologi Indonesia. Pengembangan dan verifikasi sistem dilakukan pada lingkungan lokal dengan dua basis data: `sipriti_db` sebagai sumber kebenaran backend lama dan `new_sipriti_db` sebagai target backend baru. Lingkungan ini dipilih agar kontrak sistem lama dan sistem baru dapat dibandingkan tanpa mengganggu data produksi.

## 3.3 Peran dalam Scrum

Penerapan Scrum pada tugas akhir disesuaikan dengan konteks penelitian individual. Penyesuaian dilakukan pada pelaku, bukan pada prinsip Scrum. Scrum Guide memperbolehkan penggunaan Scrum pada berbagai konteks selama peran, artefak, dan acara intinya tetap dipahami (Schwaber & Sutherland, 2020).

| peran Scrum | padanan dalam penelitian | tanggung jawab |
| --- | --- | --- |
| *Product Owner* | Kebutuhan PRPM dan arahan dosen pembimbing | Menentukan prioritas kebutuhan dan memvalidasi manfaat sistem. |
| *Scrum Master* | Penulis | Menjaga proses sprint, mencatat hambatan, dan memastikan Definition of Done terpenuhi. |
| *Developers* | Penulis | Merancang, mengimplementasikan, menguji, dan mendokumentasikan sistem. |
| Pemangku kepentingan | PRPM, dosen, koordinator, reviewer, admin | Memberikan konteks domain dan menjadi calon pelaksana UAT. |

## 3.4 Product Backlog

Product Backlog disusun dari rumusan masalah, kebutuhan operasional PRPM, dan hasil pembacaan backend lama. Setiap item backlog diarahkan pada satu keluaran yang dapat diuji.

| kode | backlog | prioritas | kriteria penerimaan |
| --- | --- | --- | --- |
| PB-01 | Fondasi konfigurasi, struktur modul, response, error, audit, dan keamanan dasar. | Tinggi | Aplikasi dapat dibangun, konfigurasi terbaca, dan respons API konsisten. |
| PB-02 | Autentikasi, pengguna, multi-role, RBAC, CSRF, dan alias pengguna legacy. | Tinggi | Login, session, role, permission, dan endpoint user berjalan sesuai kontrak lama. |
| PB-03 | Master data prodi, skema, bidang fokus, tahun akademik, output, dan sertifikat mutu. | Tinggi | Data dapat dikelola dan tersedia sebagai pilihan pada formulir proposal. |
| PB-04 | Unggahan berkas, richtext, berkas publik, CMS, dan portal informasi. | Tinggi | Berkas valid diterima, berkas berbahaya ditolak, dan konten publik dapat dibaca. |
| PB-05 | Proposal inti penelitian dan pengabdian, undangan anggota, notifikasi, nested section, dan pencarian anggota. | Tinggi | Endpoint proposal lama dan aliasnya tetap bekerja dengan respons yang sama. |
| PB-06 | Review, laporan, PDF final, tanda tangan, HKI, pemantauan, dashboard, audit log, dan import usulan. | Tinggi | Alur kerja lanjutan berjalan sesuai role, status, dan efek samping legacy. |
| PB-07 | Kesiapan cutover, smoke test, kesetaraan HTTP, rollback, dokumentasi API, dan UAT. | Tinggi | Tidak ada gap kontrak aktif dan dokumen final siap dipakai untuk UAT. |
| PB-08 | Koreksi aktor Koordinator Penelitian dan Koordinator Pengabdian pada RBAC serta dokumentasi. | Tinggi | Koordinator hanya melihat dan menjalankan alur sesuai domain penelitian atau pengabdian. |

## 3.5 Sprint Planning dan Sprint Backlog

Setiap sprint dirancang untuk menghasilkan increment yang dapat diperiksa. Urutan sprint mengikuti ketergantungan teknis: autentikasi dan RBAC harus selesai sebelum modul proposal, sedangkan modul proposal harus stabil sebelum review, laporan, dan PDF.

| sprint | tujuan sprint | backlog utama | keluaran |
| --- | --- | --- | --- |
| Sprint 0 | Menyiapkan fondasi migrasi dan aturan pengembangan. | PB-01 | Pedoman pengembang, struktur modul, konfigurasi awal, dan rencana migrasi. |
| Sprint 1 | Menyelesaikan autentikasi dan RBAC. | PB-02 | Login legacy, kuki JWT, CSRF, multi-role, user, role, permission, dan middleware. |
| Sprint 2 | Menyelesaikan master data. | PB-03 | Modul prodi, skema, bidang fokus, tahun akademik, output, dan pilihan data. |
| Sprint 3 | Menyelesaikan unggahan dan konten publik. | PB-04 | Upload aman, richtext, files, berita, pengumuman, panduan, landing page, dan konten publik. |
| Sprint 4 | Menyelesaikan proposal inti. | PB-05 | Penelitian, pengabdian, alias legacy, invite, notification, nested section, dan search anggota. |
| Sprint 5 | Menyelesaikan alur kerja lanjutan. | PB-06 | Review, laporan, PDF final, signature, HKI, monev, dashboard, audit, dan bulk import. |
| Sprint 6 | Menyiapkan cutover dan dokumentasi akhir. | PB-07 dan PB-08 | Smoke, parity, migration check, gap RBAC, dokumentasi API, laporan TA, dan UAT. |

## 3.6 Sprint Execution

Pelaksanaan sprint dilakukan secara bertahap dengan prinsip increment. Pada awal sprint, backlog teknis dipilih berdasarkan prioritas dan ketergantungan. Selama pengembangan, kontrak backend lama dibaca sebagai sumber kebenaran agar endpoint, field permintaan, field respons, permission, status workflow, dan efek samping tidak bergeser. Jika ditemukan perbedaan antara backend baru dan backend lama, perbedaan tersebut dicatat sebagai gap dan diperlakukan sebagai bug, kecuali jika perbedaan merupakan penguatan keamanan yang memang disetujui.

Pada Sprint 6, perhatian khusus diberikan pada aktor Koordinator Penelitian dan Koordinator Pengabdian. Hasil pemeriksaan basis data menunjukkan kedua role tersebut sudah tersedia beserta permission domain masing-masing. Pemeriksaan source backend juga menunjukkan pembatasan tipe usulan sudah berada pada service dan policy. Gap yang ditemukan berada di frontend: guard route dan menu admin masih terlalu umum. Perbaikan dilakukan dengan membatasi jalur Koordinator Penelitian ke halaman penelitian dan Koordinator Pengabdian ke halaman pengabdian.

## 3.7 Definition of Done

Sebuah backlog item dinyatakan selesai apabila memenuhi Definition of Done berikut.

| aspek | kriteria selesai |
| --- | --- |
| Kontrak API | URL endpoint, bentuk permintaan, bentuk respons, alias legacy, dan pesan utama tetap sesuai backend lama. |
| Struktur modul | Implementasi mengikuti pemisahan schema, DTO, mapper, policy, repository, service, controller, routes, dan model. |
| Keamanan | Autentikasi, CSRF, RBAC, resource policy, rate limit, validasi unggahan, dan audit log diterapkan sesuai kebutuhan modul. |
| Ketepatan tipe | Tidak menggunakan `any` atau asumsi kompatibilitas yang tidak bersumber dari kontrak nyata. |
| Pengujian | Build, dokumentasi API, pengujian kontrak, migration check, smoke test, dan uji kesetaraan HTTP lulus. |
| Dokumentasi | Gap, keputusan, API, diagram, ERD, dan UAT diperbarui setelah perubahan. |

## 3.8 Sprint Review dan Sprint Retrospective

Sprint Review dilakukan dengan memeriksa apakah increment memenuhi tujuan sprint dan tidak merusak kontrak lama. Review pada fase akhir menempatkan hasil smoke test dan uji kesetaraan HTTP sebagai bukti utama. Sprint Retrospective digunakan untuk menilai hambatan proses. Hambatan terbesar selama pengembangan adalah menjaga keseimbangan antara struktur backend baru yang lebih rapi dengan kewajiban mempertahankan perilaku legacy. Keputusan retrospektif yang diambil adalah menempatkan backend lama sebagai sumber kebenaran, menggunakan DTO dan mapper untuk menjaga respons, serta mencatat setiap gap ke dokumen migrasi.

## 3.9 Teknik Pengujian

Pengujian dilakukan melalui beberapa lapis. Pertama, build TypeScript memastikan kode dapat dikompilasi. Kedua, sinkronisasi dokumentasi API memastikan skema Zod tetap tercermin pada OpenAPI. Ketiga, pengujian kontrak memeriksa bagian kritis autentikasi dan policy. Keempat, migration static check memeriksa struktur migrasi dan patch SQL. Kelima, smoke test memeriksa endpoint kritis. Keenam, uji kesetaraan HTTP membandingkan respons backend lama dan backend baru. Terakhir, UAT disiapkan sebagai pengujian black-box manual bersama frontend asli dan akun lintas peran.

## 3.10 Alat dan Teknologi

| kategori | alat atau teknologi |
| --- | --- |
| Bahasa pemrograman | TypeScript dan JavaScript. |
| Frontend | React, Tailwind CSS, TanStack Query. |
| Backend | Node.js, Express.js, TypeScript, Sequelize, Zod. |
| Basis data | MySQL dengan `sipriti_db` dan `new_sipriti_db`. |
| Dokumentasi API | OpenAPI, Swagger UI, dan skema Zod. |
| Pengujian | Node test runner, smoke test, uji kesetaraan HTTP, dan UAT. |
| Keamanan | Helmet, CORS allowlist, kuki JWT, CSRF, RBAC, audit log, dan validasi unggahan. |

# BAB IV HASIL DAN PEMBAHASAN

## 4.1 Gambaran Umum Sistem

SIPRITI dibangun sebagai aplikasi web yang memisahkan antarmuka pengguna, layanan backend, dan basis data. Frontend bertugas menampilkan halaman sesuai peran pengguna, mengirim permintaan ke API, serta mengarahkan pengguna ketika akses tidak sesuai. Backend menjadi pusat validasi, otorisasi, transaksi, dan pembentukan respons. Basis data menyimpan data pengguna, role, permission, proposal, konten publik, laporan, audit log, dan metadata berkas.

Diagram konteks sistem, arsitektur backend, use case, alur proposal, urutan autentikasi, deployment, aliran data, ERD, dan matriks aktor disediakan pada berkas diagram terpisah agar dapat digunakan sebagai lampiran tugas akhir. Pemisahan diagram ke dalam berkas mandiri dilakukan agar laporan utama tetap terbaca, sedangkan detail teknis tetap dapat diverifikasi.

## 4.2 Hasil Implementasi per Sprint

Tabel 4.1 menunjukkan hasil implementasi per sprint. Penyajian ini penting karena pada Scrum, nilai sistem tidak hanya dinilai dari daftar fitur akhir, tetapi juga dari increment yang selesai dan dapat diuji pada setiap iterasi (Schwaber & Sutherland, 2020).

| sprint | hasil utama | bukti verifikasi |
| --- | --- | --- |
| Sprint 0 | Fondasi migrasi, pedoman pengembang, struktur modul, dan rencana eksekusi migrasi. | Dokumen `MIGRATION_EXECUTION_PLAN.md` dan pedoman pengembang. |
| Sprint 1 | Autentikasi, pengguna, role, permission, multi-role, CSRF, dan alias user. | Pengujian kontrak autentikasi dan route RBAC. |
| Sprint 2 | Master data prodi, skema, bidang fokus, tahun akademik, output, dan sertifikat mutu. | Endpoint pilihan data dan CRUD master data tersedia. |
| Sprint 3 | Unggahan aman, richtext, berkas publik, CMS, dan portal publik. | Validasi upload dan endpoint konten publik. |
| Sprint 4 | Proposal penelitian, proposal pengabdian, alias legacy, nested section, undangan, notifikasi, dan pencarian anggota. | Endpoint proposal dan alias `/api/usulan-penelitian` serta `/api/usulan-pengabdian` aktif. |
| Sprint 5 | Review, laporan, PDF final, tanda tangan resmi, HKI, pemantauan, dashboard, audit log, dan import usulan. | Endpoint workflow lanjutan dan bulk import tersedia. |
| Sprint 6 | Cutover readiness, smoke, uji kesetaraan HTTP, audit gap RBAC, dokumentasi API, laporan TA, dan UAT. | 30/30 smoke test lulus dan 20/20 uji kesetaraan HTTP lulus. |

## 4.3 Hasil RBAC dan Aktor Sistem

Audit akhir memperlihatkan bahwa seluruh aktor utama telah diakomodasi. Tabel 4.2 merangkum aktor, role basis data, dan batasan kewenangannya.

| aktor | role atau sumber kewenangan | kewenangan utama | batasan |
| --- | --- | --- | --- |
| Pengunjung | Tidak login | Membaca konten publik. | Tidak dapat mengakses endpoint terlindungi. |
| Dosen atau Peneliti | `dosen`, `mahasiswa`, atau `user` sesuai data | Membuat proposal, mengelola draft, menerima undangan, mengunggah laporan, dan mengajukan HKI. | Hanya data pribadi atau proposal yang terkait. |
| Ketua Proposal | Peran pada proposal | Submit, revisi, resubmit, laporan, dan PDF final. | Hanya proposal yang dipimpin. |
| Kaprodi | `kaprodi` | Mengelola signature dan akses prodi sesuai assignment. | Tidak otomatis menjadi koordinator penelitian atau pengabdian. |
| Koordinator Penelitian | `koordinator_penelitian` | Review, approve, edit by prodi, forward, import, laporan, dan dashboard untuk penelitian. | Tidak dapat menjalankan alur pengabdian. |
| Koordinator Pengabdian | `koordinator_pengabdian` | Review, approve, edit by prodi, forward, import, laporan, dan dashboard untuk pengabdian. | Tidak dapat menjalankan alur penelitian. |
| Reviewer | `reviewer` | Memberikan review sesuai permission atau assignment. | Tidak memiliki hak forward. |
| Admin PRPM | `admin` | Mengelola seluruh modul, RBAC, master data, konten, audit, dan workflow. | Tetap melewati middleware dan audit server. |
| Operator PRPM | Role operasional sesuai assignment | Import usulan, monev, dan dokumen pendukung. | Bergantung permission yang diberikan admin. |

Hasil query pada `new_sipriti_db` menunjukkan `admin` memiliki 145 permission, `koordinator_penelitian` memiliki 24 permission, dan `koordinator_pengabdian` memiliki 24 permission. Permission yang dimiliki kedua koordinator tidak disamakan secara buta. Koordinator Penelitian memiliki `manage_penelitian` dan `forward_usulan_penelitian`, sedangkan Koordinator Pengabdian memiliki `manage_pengabdian` dan `forward_usulan_pengabdian`. Perbedaan inilah yang menjadi dasar pembatasan domain.

## 4.4 Pembahasan Logic Review dan Forward

Pemisahan Koordinator Penelitian dan Koordinator Pengabdian merupakan temuan penting karena memengaruhi keabsahan alur persetujuan. Pada sistem lama maupun sistem baru, forward bukan hanya aksi tombol. Aksi tersebut mengubah posisi usulan dalam alur kerja, sehingga harus dibatasi oleh tipe usulan, prodi, status, dan permission.

Backend menerapkan pembatasan tersebut pada beberapa lapisan. Route middleware memeriksa permission seperti `review_proposal`, `approve_proposal`, `forward_usulan_penelitian`, dan `forward_usulan_pengabdian`. Service dan policy memeriksa tipe usulan, prodi, status proposal, ketua proposal, serta kepemilikan sumber daya. Frontend menyesuaikan tampilan menu dan route agar pengguna tidak diberi akses tampilan yang lebih luas daripada kewenangan server.

Audit final menemukan bahwa backend sudah benar, tetapi frontend masih terlalu longgar pada guard admin hybrid dan sub-menu proposal. Perbaikan dilakukan dengan membatasi Koordinator Penelitian hanya pada route administratif penelitian dan Koordinator Pengabdian hanya pada route administratif pengabdian. Perbaikan ini tidak mengubah endpoint, bentuk permintaan, bentuk respons, maupun status workflow. Dengan demikian, perubahan tersebut merupakan penyelarasan UI terhadap RBAC server, bukan perubahan kontrak bisnis.

## 4.5 Hasil Pengujian

Tabel 4.3 menyajikan hasil pengujian otomatis setelah revisi RBAC dan dokumentasi.

| jenis pengujian | hasil | makna |
| --- | --- | --- |
| Build backend | Lulus | Kode backend dapat dikompilasi dan siap dijalankan. |
| Sinkronisasi OpenAPI | Lulus, 203 skema | Dokumentasi API tetap sejalan dengan skema validasi. |
| Pengujian kontrak backend | Lulus, 14 skenario | Kontrak autentikasi dan policy inti tidak rusak. |
| Pemeriksaan migrasi | Lulus, 16 migrasi dan 11 patch SQL | Struktur migrasi serta patch SQL valid secara statis. |
| Migrasi basis data | Lulus, schema sudah mutakhir | Migrasi bersifat idempotent pada `new_sipriti_db`. |
| Smoke test | Lulus, 30 dari 30 skenario | Endpoint kritis memberikan status yang sesuai. |
| Uji kesetaraan HTTP | Lulus, 20 dari 20 skenario | Respons backend baru setara dengan backend lama pada alur kritis. |
| Type-check frontend | Lulus | Perubahan RBAC frontend tidak menimbulkan kesalahan tipe. |
| Build frontend | Lulus dengan peringatan ukuran chunk | Aplikasi dapat dibangun; peringatan tidak terkait kesalahan RBAC. |

Hasil pada Tabel 4.3 menunjukkan bahwa sistem tidak hanya berhasil dikompilasi, tetapi juga memenuhi pemeriksaan kontrak dan perilaku runtime. Uji kesetaraan HTTP menjadi bukti paling penting pada konteks migrasi karena menguji apakah backend baru masih memberi bentuk respons yang dapat diterima oleh frontend lama. Sementara itu, UAT tetap diperlukan karena pengujian otomatis belum sepenuhnya mewakili pengalaman pengguna pada skenario file nyata, PDF, tanda tangan, dan workbook import.

## 4.6 Pembahasan terhadap Penelitian Terdahulu

Hasil penelitian ini sejalan dengan Afriansyah (2022), Anata et al. (2024), dan Rizal et al. (2024), yaitu sistem informasi berbasis web dapat memperbaiki pengelolaan data penelitian dan pengabdian. Perbedaannya, SIPRITI menambahkan lapisan kesetaraan kontrak API dan audit RBAC karena sistem harus tetap kompatibel dengan backend lama. Kontribusi ini memperluas pembahasan dari sekadar digitalisasi data menjadi pengendalian perilaku sistem.

Temuan RBAC pada SIPRITI juga menguatkan pandangan Le et al. (2022) bahwa kebijakan akses pada aplikasi web perlu ditelusuri dari beberapa lapisan implementasi. Jika audit hanya melihat tabel role dan permission, gap frontend guard tidak akan ditemukan. Sebaliknya, jika audit hanya melihat UI, pembatasan service dan policy backend tidak akan tampak. Karena itu, audit dilakukan secara end-to-end dari basis data, route, service, policy, hingga frontend guard.

Penerapan Scrum pada penelitian ini juga tidak berhenti pada penyebutan metode. Backlog, sprint, increment, review, dan retrospective digunakan untuk mengendalikan pekerjaan yang kompleks. Hal ini sejalan dengan Kadenic et al. (2023), yang menekankan bahwa manfaat Scrum baru terlihat ketika komponen utamanya diterapkan secara matang. Pada SIPRITI, sprint membantu menjaga urutan kerja: fondasi autentikasi harus selesai sebelum proposal, proposal harus stabil sebelum review, dan review harus stabil sebelum cutover.

## 4.7 Keterbatasan Penelitian

Penelitian ini masih memiliki keterbatasan. Pertama, UAT manual dengan pengguna akhir belum menggantikan seluruh bukti operasional lapangan karena hasil otomatis baru menguji kontrak dan skenario teknis. Kedua, pengujian beban produksi berskala besar belum dilakukan. Ketiga, deployment cloud, pemantauan produksi, dan integrasi SSO eksternal berada di luar batasan penelitian. Keterbatasan ini tidak membatalkan hasil rancang bangun, tetapi menjadi dasar perbaikan pada penelitian atau implementasi berikutnya.

# BAB V KESIMPULAN DAN SARAN

## 5.1 Kesimpulan

Berdasarkan hasil implementasi dan pengujian, kesimpulan penelitian disusun sebagai berikut.

1. Sistem informasi SIPRITI berhasil dirancang dan dibangun untuk mendukung pengelolaan penelitian, pengabdian kepada masyarakat, kekayaan intelektual, publikasi kelembagaan, laporan, pemantauan, dashboard, audit, dan import usulan pada PRPM ITI.
2. Metode *Agile Scrum* berhasil diterapkan sebagai alur pengembangan melalui penyusunan *Product Backlog*, pembagian sprint, pembentukan increment, review, retrospective, dan Definition of Done yang terukur.
3. RBAC berhasil diterapkan dengan aktor yang lengkap, meliputi Pengunjung, Dosen, Ketua Proposal, Kaprodi, Koordinator Penelitian, Koordinator Pengabdian, Reviewer, Admin PRPM, dan Operator PRPM. Pemisahan Koordinator Penelitian dan Koordinator Pengabdian telah terbukti pada permission basis data, policy backend, dan guard frontend.
4. Backend baru berhasil mempertahankan kontrak penting backend lama. Hal ini dibuktikan melalui uji kesetaraan HTTP 20 dari 20 skenario dan smoke test 30 dari 30 skenario yang lulus.
5. Sistem telah memiliki artefak verifikasi yang memadai untuk tahap UAT, meliputi dokumentasi API, diagram, ERD, checklist verifikasi, audit gap RBAC, dan skenario UAT fitur lengkap.

## 5.2 Saran

Bagi PRPM ITI, UAT sebaiknya dilakukan menggunakan akun nyata untuk setiap aktor agar validasi tidak hanya berhenti pada hasil otomatis. Skenario yang perlu diprioritaskan adalah login multi-role, pengajuan proposal, review penelitian, review pengabdian, forward, revisi, laporan, PDF, import usulan, dan audit log.

Bagi pengembangan berikutnya, sistem dapat dilengkapi dengan pengujian beban, pipeline CI/CD, pemantauan produksi, backup terjadwal, dan integrasi SSO apabila kebutuhan operasional sudah matang. Dari sisi akademik, penelitian lanjutan dapat menilai kepuasan pengguna melalui kuesioner UAT atau System Usability Scale agar kualitas sistem tidak hanya dilihat dari keberhasilan fungsi, tetapi juga dari kemudahan penggunaannya.

# Daftar Pustaka

Afriansyah, R. (2022). Sistem informasi manajemen penelitian dan pengabdian kepada masyarakat di P3KM Polman Negeri Babel. *Jurnal Sisfokom (Sistem Informasi dan Komputer)*. https://doi.org/10.32736/sisfokom.v11i1.1323

Anata, S., Widjaja, H. M., & Yonata, Y. (2024). Sistem informasi penelitian dan pengabdian kepada masyarakat berbasis web di perguruan tinggi XYZ. *Jurnal Telematika*. https://doi.org/10.61769/telematika.v19i1.654

Beck, K., Beedle, M., van Bennekum, A., Cockburn, A., Cunningham, W., Fowler, M., Grenning, J., Highsmith, J., Hunt, A., Jeffries, R., Marick, B., Martin, R. C., Mellor, S., Schwaber, K., Sutherland, J., Thomas, D., & Grenning, J. (2001). *Manifesto for agile software development*. https://agilemanifesto.org/

Choetkiertikul, M., Dam, H. K., Tran, T., & Ghose, A. (2024). Sprint2Vec: A deep characterization of sprints in iterative software development. *IEEE Transactions on Software Engineering, 50*(5), 1102-1118. https://doi.org/10.1109/TSE.2024.3509016

Dzaky, F. A., & Kurniawan, D. (2023). Implementation of Scrum framework Agile method to develop integrated asset management information system at Universitas Diponegoro inventory module. *Jurnal Masyarakat Informatika, 14*(1), 40-51. https://doi.org/10.14710/jmasif.14.1.52605

Imam Syafii, & Ridha, A. (2023). Rancang bangun sistem informasi penelitian dan pengabdian kepada masyarakat ITSK Sugeng Hartono. *Jurnal Informasi dan Teknologi*. https://doi.org/10.37034/jidt.v5i2.316

Kadenic, M. D., Koumaditis, K., & Junker-Jensen, L. (2023). Mastering scrum with a focus on team maturity and key components of scrum. *Information and Software Technology, 153*, 107079. https://doi.org/10.1016/j.infsof.2022.107079

Laverdiere, M.-A., Julien, K., & Merlo, E. (2021). RBAC protection-impacting changes identification: A case study of the security evolution of two PHP applications. *Information and Software Technology, 139*, 106630. https://doi.org/10.1016/j.infsof.2021.106630

Le, H. T., Shar, L. K., Bianculli, D., Briand, L., & Nguyen, D. C. (2022). Automated reverse engineering of role-based access control policies of web applications. *Journal of Systems and Software, 184*, 111109. https://doi.org/10.1016/j.jss.2021.111109

OpenAPI Initiative. (2024). *OpenAPI Specification v3.0.4*. Linux Foundation. https://spec.openapis.org/oas/v3.0.4.html

Rizal, M., Arifin, A., & Bahtiar, A. (2024). Sistem informasi manajemen pada Pusat Penelitian dan Pengabdian Masyarakat (P3M) Universitas Dipa Makassar berbasis web. *Jurnal Minfo Polgan*. https://doi.org/10.33395/jmp.v13i1.13537

Schwaber, K., & Sutherland, J. (2020). *The Scrum Guide: The definitive guide to Scrum: The rules of the game*. Scrum.org. https://scrumguides.org/scrum-guide.html

Toscany, A. N., Jusia, P. A., Bustami, M. I., & Saputra, C. (2022). Pengembangan sistem informasi penelitian dan pengabdian masyarakat Universitas Dinamika Bangsa. *Jurnal Ilmiah Media Sisfo*. https://doi.org/10.33998/mediasisfo.2022.16.2.1215

Zidan, M., Nur'aini, S., Wibowo, N. C. H., & Ulinuha, M. A. (2022). Black box testing pada aplikasi Single Sign On (SSO) di Diskominfostandi menggunakan teknik equivalence partitions. *Walisongo Journal of Information Technology, 4*(2), 127-137. https://doi.org/10.21580/wjit.2022.4.2.12135
