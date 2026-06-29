# Naskah Presentasi Seminar Metodologi Skripsi
**Judul:** Rancang Bangun Sistem Informasi Pengelolaan Penelitian, Pengabdian Masyarakat, dan Kekayaan Intelektual pada Pusat Riset dan Pengabdian Masyarakat Institut Teknologi Indonesia

---

## 1. Pembukaan dan Metodologi Agile Scrum (Slide 1)
"Selamat pagi Bapak/Ibu Dewan Penguji dan Dosen Pembimbing. Senang sekali rasanya pada kesempatan ini saya dapat mempresentasikan metodologi yang digunakan dalam pengembangan sistem SIPRITI. 

Penelitian ini diimplementasikan menggunakan metodologi **Agile Scrum**. Secara teori dan praktik, Agile Scrum dipilih karena merupakan kerangka kerja yang sangat iteratif dan adaptif untuk pengembangan perangkat lunak. Alur kerjanya terstruktur namun fleksibel, di mana proses diawali dengan mengumpulkan kebutuhan kelembagaan ke dalam daftar *Product Backlog* berupa *User Stories*. Setiap kebutuhan tersebut kemudian direncanakan pengerjaannya di fase *Sprint Planning*, dieksekusi secara teknis pada fase *Sprint Development*, dan dievaluasi kualitasnya melalui *Sprint Review* serta *Retrospective*. Jadi, progres pengembangan sistem ini berjalan secara bertahap dan selalu siap mengakomodasi kebutuhan operasional PRPM secara terukur.

Nah, untuk menjalankan kerangka kerja Scrum ini dengan baik, langkah awal yang harus ditegaskan adalah pembagian peran di dalam proyek ini."

---

## 2. Struktur Pembagian Peran Agile Scrum (Slide 2)
"Bapak dan Ibu Dewan Penguji, dalam proyek Tugas Akhir ini, meskipun pengerjaannya bersifat mandiri, saya tetap mengimplementasikan pembagian peran Agile Scrum secara fungsional untuk menjaga keabsahan metodologi dan objektivitas pengembangan.

Pertama, peran **Product Owner** dipegang secara aktif oleh Kepala Pusat Riset dan Pengabdian Masyarakat (PRPM) ITI beserta Staf Administrasinya. Merekalah pemilik kebutuhan sistem yang sesungguhnya, penentu prioritas backlog, serta yang memberikan verifikasi akhir kesesuaian fitur berdasarkan kriteria penerimaan (*Acceptance Criteria*).

Kedua, peran **Scrum Master** saya jalankan sendiri untuk memfasilitasi jalannya seremonial Scrum mulai dari Sprint Planning hingga Retrospective berjalan sesuai aturan main metodologi.

Dan ketiga, peran **Development Team** juga berada di tangan saya untuk mengeksekusi penulisan kode program secara teknis. Pembagian peran ini memastikan sistem dibangun berdasarkan umpan balik nyata dari pihak PRPM, bukan sekadar asumsi pribadi saya.

Setelah struktur peran terjalin, proses Scrum dimulai dengan mengumpulkan data awal untuk menyusun daftar prioritas kebutuhan sistem."

---

## 3. Pengumpulan Data Observasi Awal (Slide 3)
"Langkah pertama yang saya lakukan tentu saja adalah observasi awal untuk pengumpulan data. Dari hasil observasi kebutuhan operasional PRPM, saya menarik intisari fungsi-fungsi utama dan mengubahnya menjadi poin-poin fitur yang menjadi fondasi *User Story* sistem kita. 

Beberapa poin fitur krusial yang diidentifikasi pada tahap awalan ini meliputi:
*   **Autentikasi & Sesi:** Keamanan akses terenkripsi bagi seluruh pengguna.
*   **RBAC (Role-Based Access Control):** Pengaturan dan pembatasan hak akses lintas peran secara ketat.
*   **Pembuatan Proposal:** Alur pengajuan usulan penelitian dan pengabdian masyarakat.
*   **Hibah Internal:** Proses seleksi dan meneruskan usulan ke program pendanaan internal.
*   **Kekayaan Intelektual (HKI):** Pencatatan dan pengelolaan luaran intelektual dosen.
*   **Integrasi Data Riset:** Penarikan otomatis informasi profil penelitian dari web riset terkemuka seperti Google Scholar, BIMA, dan RIS.

Poin-poin inilah yang kemudian menjadi landasan kuat agar aplikasi yang dibangun memiliki pondasi operasional yang kokoh. Dari kebutuhan fungsional tersebut, saya memodelkan interaksi pengguna dengan sistem melalui Use Case Diagram."

---

## 4. Peta Navigasi Sistem via Use Case Diagram (Slide 4)
"Selanjutnya, untuk memvisualisasikan bagaimana pengguna berinteraksi dengan fitur-fitur tersebut, mari kita perhatikan pemodelan **Use Case Diagram** berikut. Diagram ini dirancang sebagai Peta Navigasi Sistem yang menunjukkan seluruh fitur utama, sekaligus menjadi alat komunikasi visual yang sangat mudah dipahami.

Di dalam pemodelan ini, elemen *Actor* mewakili 5 peran sistem, yaitu: **Admin PRPM, Dosen, Koordinator Penelitian, Koordinator Pengabdian, dan Kaprodi**. Kemudian, elemen *Oval* mewakili fungsi di dalam sistem, yang dikelilingi oleh *System Boundary*. Garis-garis penghubung secara jelas memetakan **Pembagian Hak Akses**. 

Mari kita bedah langsung pembagian hak akses aktual berdasarkan diagram ini:
Pertama, seluruh aktor terhubung pada fungsi dasar yaitu Login dan Kelola Profil. Kemudian, dari sisi operasional utama, aktor **Dosen** ditugaskan secara spesifik untuk membuat dan men-submit proposal, meneruskan usulan ke hibah internal, mengunggah laporan kemajuan dan akhir, serta mengajukan usulan HKI.  

Selanjutnya, di sisi pengelola, **Koordinator Penelitian dan Pengabdian** berfokus pada eksekusi *review* proposal dan laporan, meneruskan proposal ke hibah internal, melakukan import usulan via Excel, serta melihat Dashboard Terpusat dan Audit Log. Sementara itu, aktor **Kaprodi** memiliki akses yang sangat eksklusif, yaitu hanya untuk mengelola Tanda Tangan Resmi program studi dan memantau Audit Log. Terakhir, **Admin PRPM** bertindak sebagai pemegang kendali utama yang menguasai pengelolaan Master Data & RBAC, Review HKI, eksekusi *Crawler* data publik (Scholar, BIMA, RIS), hingga mengawal keseluruhan *use case* administratif lainnya. Pemetaan visual ini secara tegas mengunci batasan wewenang setiap aktor di dalam sistem.

Setelah peta navigasi dan wewenang ini jelas, seluruh fungsionalitas didelegasikan ke dalam fase Sprint. Mari kita lihat dinamika pengerjaan dan adaptabilitasnya."

---

## 5. Dinamika Sprint Planning & Adaptasi Scrum (Slide 5)
"Nah, sekarang mari kita bahas dinamikanya selama fase *Sprint Development*. Seperti yang kita ketahui bersama, keunggulan Agile Scrum ada pada fleksibilitasnya, dan hal ini benar-benar terbukti saat proyek berjalan dalam 6 Sprint.

Sebagai contoh nyata: Pada saat sesi *Sprint Review* di penghujung **Sprint 3**, ternyata muncul *feedback* bahwa pengelola membutuhkan fitur tambahan untuk memasukkan data usulan secara massal. Tentu saja ini adalah perubahan cakupan fitur yang cukup besar! Namun, bukannya merombak Sprint yang sedang berjalan dan membuat kekacauan, fitur **Import Excel** tersebut dengan rapi ditambahkan ke daftar *Product Backlog*, lalu ditarik perencanaannya untuk dikerjakan secara fokus di **Sprint 4**. 

Kejadian ini juga memacu saya untuk merapikan alur pembuatan proposal agar seluruhnya bisa tuntas secara linier di Sprint 3. Hasilnya? Di Sprint 4, alur kerja bisa dialihkan untuk fokus pada manajemen *review* terpusat, pelaksanaan Monev, dan tentu saja pengerjaan fitur *Import* massal tersebut.

Nah, dalam merencanakan setiap Sprint, salah satu aspek krusial adalah memperkirakan tingkat kesulitan fitur menggunakan Story Point."

---

## 6. Penilaian Kompleksitas & Deret Fibonacci / Story Point (Slide 6)
"Lalu, bagaimana saya mengukur tingkat kesulitan setiap fitur tersebut? Di sinilah saya menerapkan perhitungan *Story Point* (SP) menggunakan acuan **Deret Fibonacci** (1, 2, 3, 5, 8, 13, 21). 

Mungkin Bapak/Ibu Pembimbing bertanya, mengapa saya memilih deret Fibonacci? Secara akademis dan praktis, terdapat tiga alasan mendasar. Pertama, **sifat kompleksitas perangkat lunak bersifat non-linier**; seiring bertambahnya cakupan fitur, ketidakpastian dan risiko teknisnya tidak bertambah secara linear (1, 2, 3, 4...) tetapi tumbuh secara eksponensial, yang diwakili oleh lompatan deret Fibonacci. Kedua, **Hukum Weber-Fechner**; manusia lebih sensitif membedakan rasio perbedaan secara relatif daripada absolut. Ini mengeliminasi perdebatan tidak penting dalam estimasi (misalnya, meributkan apakah fitur bernilai 7 atau 8 SP, melainkan langsung menetapkan 8 SP). Ketiga, **sebagai indikator dekomposisi tugas**; jika ada tugas bernilai 13 SP atau lebih, itu adalah sinyal merah bahwa fitur tersebut terlalu ambigu (Epic) dan wajib saya pecah menjadi bagian-bagian kecil yang terkendali.

Prinsip utama yang saya pegang dalam memberikan estimasi sangat jelas: **'Jika sebuah requirement tidak jelas dan ambigu, maka nilai SP-nya akan bertambah besar. Sebaliknya, jika requirement-nya jelas dan risiko kesalahan pengerjaannya minim, maka nilai SP-nya lebih kecil dan akurat.'**

Berdasarkan analisis tersebut, rentang nilai yang terbentuk adalah **3, 5, 8, dan 13**:
*   **SP 3 (Rendah):** Fitur operasional dasar berisiko minim. Contoh: Update Profil Dosen.
*   **SP 5 (Menengah):** Fitur berelasi dengan validasi middleware. Contoh: Fitur *Submit* Proposal dan Meneruskan usulan ke hibah internal.
*   **SP 8 (Tinggi):** Fitur berat yang mengikat banyak tabel relasi *database* secara dinamis atau manipulasi batch. Contohnya seperti pembuatan draf proposal utuh dan fitur *Import Excel*.
*   **SP 13 (Sangat Tinggi):** Fitur dengan ambiguitas tinggi akibat bergantung pada pihak eksternal, yaitu fitur *Crawler* data publik (Scholar, BIMA, RIS). Mengingat perubahan struktur web di luar kendali kita, risiko penanganan kesalahan (*error handling*) menjadi sangat menantang.

Dari akumulasi penilaian kompleksitas di setiap Sprint ini, berikut adalah rangkuman dari metodologi pengembangan sistem SIPRITI secara menyeluruh."

---

## 7. Rangkuman Metodologi (Slide 7)
"Sebagai kesimpulan, metodologi Agile Scrum yang diimplementasikan pada proyek SIPRITI ini berhasil merumuskan **46 User Story** dengan total akumulasi **287 Story Point**, dengan kecepatan eksekusi rata-rata sekitar ~47,8 SP per Sprint. 

Bapak/Ibu dewan penguji mungkin bertanya, mengapa pada operasional internal sistem tidak ada fungsionalitas yang dinilai lebih dari angka 8? Jawabannya kembali ke prinsip awal: karena tata kelola internal PRPM dan pemodelan basis datanya sudah diobservasi dengan sangat jelas, sehingga risiko salah kaprah dapat dilapisi sejak awal. Angka 13 secara khusus disisihkan untuk fitur *Crawler* demi mewaspadai ketidakpastian data pihak ketiga.

Akhir kata, pendekatan iteratif ini berhasil memastikan bahwa setiap fitur dibangun murni untuk menjawab kebutuhan kelembagaan PRPM Institut Teknologi Indonesia secara efisien, adaptif, dan tepat guna. 

Namun, bagaimana proses pengujian fitur-fitur ini dilakukan secara nyata bersama PRPM? Mari kita lihat fase *Sprint Review*."

---

## 8. Eksekusi Sprint Review & Deployment Online (Slide 8)
"Bapak dan Ibu Dewan Penguji, karena tidak memungkinkannya pertemuan tatap muka secara rutin dengan pihak PRPM, saya mengadaptasi pelaksanaan *Sprint Review* melalui metode **Deployment Online**.

Setiap kali sebuah Sprint selesai dan inkremen produk telah siap diuji, saya mendistribusikan (*deploy*) rilis sistem tersebut ke *server production* di lingkungan ITI, yang dapat diakses langsung pada alamat **PRPM.ITI.AC.ID**. Melalui tautan tersebut, Kepala PRPM dan Staf Admin dapat langsung melakukan uji coba sistem secara *online*. Umpan balik dari hasil *review* tersebut langsung saya catat untuk dibahas pada fase *Retrospective* dan ditindaklanjuti pada siklus Sprint berikutnya.

Selanjutnya, untuk mendukung fungsionalitas tersebut agar dapat berjalan stabil di *server production*, mari kita bedah arsitektur dan pilihan teknologi yang mendasarinya."

---

## 9. Arsitektur & Pemilihan Teknologi Inti / Tech Stack (Slide 9)
"Bapak dan Ibu Dewan Penguji, untuk merealisasikan seluruh alur kerja Scrum tersebut menjadi aplikasi yang andal, saya merancang sistem ini dengan arsitektur Client-Server menggunakan teknologi inti yang saling melengkapi.

Di sisi pengguna atau frontend, saya memilih **React.js** dikombinasikan dengan **Tailwind CSS**. Kombinasi ini memberikan performa antarmuka yang sangat responsif melalui pemanfaatan Virtual DOM, struktur komponen yang modular sehingga mudah dirawat, serta kemudahan penataan gaya visual modern.

Untuk sisi server atau backend, saya mengimplementasikan **Express.js** yang bertindak sebagai mesin RESTful API. Express dipilih karena sifatnya yang ringan, berkinerja tinggi, dan sangat fleksibel dalam menangani validasi hak akses lintas peran melalui *middleware* otorisasi.

Sedangkan untuk penyimpanan data, sistem ini menggunakan **MySQL** sebagai RDBMS utama, menjamin integritas transaksi dan penyimpanan dokumen administratif yang stabil.

Terkait penyimpanan data di MySQL tersebut, mari kita lihat bagaimana struktur relasi data dimodelkan melalui Entity Relationship Diagram."

---

## 10. Pemodelan Basis Data & Landasan RDBMS via ERD (Slide 10)
"Mari kita perhatikan rancangan basis data sistem melalui **Entity Relationship Diagram** atau ERD berikut. Sistem ini mengadopsi model **RDBMS (Relational Database Management System)** yang kokoh.

Mengapa RDBMS sangat krusial di sini? Alasan utamanya adalah **integritas referensial dan konsistensi data**. Aktivitas Tri Dharma Perguruan Tinggi memiliki hubungan data yang sangat erat; sebagai contoh, satu proposal usulan penelitian harus terikat secara ketat dengan skema, bidang fokus, program studi, dosen pengusul, serta laporan kemajuan dan akhir yang relevan.

Dengan RDBMS, kita dapat menerapkan aturan *Foreign Key Constraints* untuk mencegah data yatim piatu (*orphan data*). Selain itu, desain tabel dirancang dengan prinsip normalisasi untuk mengeliminasi redundansi data serta mencegah terjadinya anomali saat ada proses penambahan, pembaruan, atau penghapusan data. Struktur relasional ini memastikan data akreditasi yang disajikan PRPM selalu valid, aman, dan dapat dipertanggungjawabkan secara akademis."

---

## 11. Analisis SWOT Sistem SIPRITI (Slide 11)
"Bapak dan Ibu Dewan Penguji, dari serangkaian tahapan pengembangan tersebut, saya telah merangkum analisis SWOT yang menjadi tolok ukur objektif terkait kesiapan sistem SIPRITI sebelum diluncurkan secara penuh.

*   **Strengths (Kekuatan):**
    Sistem telah menggunakan arsitektur modern berbasis React.js & Express.js dengan antarmuka yang sangat responsif. Adanya implementasi Role-Based Access Control (RBAC) yang ketat memastikan keamanan data sesuai dengan wewenang jabatan. Alur *Agile Scrum* juga menjamin fitur-fitur yang dibangun benar-benar sesuai dengan kebutuhan operasional PRPM.
*   **Weaknesses (Kelemahan):**
    Karena dikembangkan secara mandiri (*solo developer*), modul penarikan data masih bergantung kuat pada antarmuka *website* eksternal dan belum mengakomodasi format jurnal internasional yang beragam.
*   **Opportunities (Peluang):**
    Pondasi RESTful API pada sistem ini membuka peluang besar untuk kemudahan integrasi layanan (API-to-API) di masa depan, baik dengan sistem akademik ITI (Siakad) maupun *platform* Dikti secara langsung.
*   **Threats (Ancaman):**
    Ancaman teknis terbesar adalah perubahan struktur HTML secara tiba-tiba di situs web SINTA, BIMA, atau Google Scholar yang dapat menyebabkan malfungsi pada fitur *Crawler/Scraping* data publik."

---

## 12. Tantangan Pengembangan & Deployment (Slide 12)
"Sebagai babak akhir dari presentasi ini, mewujudkan sistem yang kompleks hingga tahap *live* di *server production* tentu memberikan pembelajaran dan tantangan tersendiri yang sangat signifikan:

*   **Tantangan Kebutuhan yang Berubah-ubah dan Adaptif:**
    Karakteristik proyek berbasis Scrum menuntut sistem dan pengembangnya untuk tetap adaptif. Tantangannya adalah ketika terdapat perubahan kebutuhan dari *Product Owner* di tengah jalan—seperti penambahan fitur pengunggahan massal—maka perubahan tersebut wajib diakomodir secara tangkas dengan penyesuaian skala prioritas pada *Product Backlog* tanpa merusak integritas *Sprint* saat itu.
*   **Tantangan Agile Scrum Mandiri (Solo Developer):**
    Menjalankan seremonial Scrum seorang diri menuntut disiplin tingkat tinggi. Tanpa adanya anggota tim lain untuk saling mengingatkan, konsistensi dalam mengeksekusi *Daily Scrum* (sebagai refleksi mandiri) dan menjaga pembagian peran agar tetap objektif menjadi tantangan mental sekaligus manajerial yang harus saya atasi agar kerangka metodologi tetap berjalan sah.
*   **Tantangan Deployment ke Lingkungan Production:**
    Karena sistem ini langsung di-*deploy* ke *hosting production* ITI (PRPM.ITI.AC.ID) untuk keperluan *Sprint Review* secara *online*, setiap proses rilis kode ditangani dengan sangat hati-hati. Konfigurasi pada *environment production* membutuhkan **Standard Operating Procedure (SOP) yang ketat** agar tidak ada kesalahan konfigurasi (misalnya salah menghubungkan ke basis data *live*) yang berpotensi menyebabkan *downtime* atau mengganggu akses uji coba pihak PRPM.

Seluruh tantangan tersebut berhasil diatasi melalui kedisiplinan pencatatan jurnal harian, adaptabilitas yang tinggi, serta manajemen *deployment* yang terstruktur."

---

## 13. Penutup & Terima Kasih (Slide 13)
"Sekian presentasi saya terkait pengembangan sistem SIPRITI menggunakan kerangka kerja Agile Scrum. Besar harapan saya bahwa sistem ini dapat memberikan kontribusi nyata bagi kelancaran operasional Pusat Riset dan Pengabdian Masyarakat (PRPM) Institut Teknologi Indonesia.

Terima kasih atas waktu dan perhatian Bapak dan Ibu Dewan Penguji serta Dosen Pembimbing. Waktu dan sesi selanjutnya saya kembalikan kepada penguji."

---

## Simulasi Tanya-Jawab Metodologi dengan Dosen Penguji

Berikut adalah kumpulan pertanyaan kritis terkait metodologi penelitian (Agile Scrum) yang berpotensi ditanyakan oleh Dewan Penguji, beserta jawaban strategis dan akademis yang menunjukkan pemahaman mendalam:

### Pertanyaan 1: "Mengapa Anda memilih Agile Scrum dibandingkan Waterfall, padahal Anda mengerjakan tugas akhir ini sendirian (single developer)? Bukankah Scrum itu dirancang untuk kolaborasi tim?"
**Jawaban Mahasiswa:**
> "Benar Bapak/Ibu Penguji, secara historis Scrum dirancang untuk tim lintas fungsi. Namun, alasan saya mengadopsi Scrum dalam pengerjaan mandiri ini adalah demi memanfaatkan **pendekatan iteratif, adaptif, dan manajemen prioritas berbasis nilai (value-driven)**. 
> 
> Dengan memecah sistem SIPRITI yang kompleks ini menjadi 6 Sprint (masing-masing 2 minggu), saya dapat mempertahankan fokus pengembangan dan menghasilkan inkrementasi produk yang berfungsi (*working software*) di setiap akhir sprint. Selain itu, kebutuhan operasional di PRPM sangat dinamis; contohnya ketika ada umpan balik untuk menambahkan fitur *Import Excel* pada akhir Sprint 3. Jika saya menggunakan model sekuensial seperti *Waterfall*, penyesuaian di tengah jalan ini akan memaksa saya merombak fase analisis dari awal yang sangat tidak efisien. Di sini Scrum bertindak sebagai instrumen kontrol progres yang adaptif bagi saya."

### Pertanyaan 2: "Bagaimana Anda menentukan Story Point untuk masing-masing User Story? Apakah ini hanya tebakan subjektif Anda saja?"
**Jawaban Mahasiswa:**
> "Penentuan Story Point dalam tugas akhir ini tidak dilakukan secara subjektif/tebakan liar, melainkan didasarkan pada parameter terukur: **kompleksitas logika bisnis, jumlah tabel relasi database yang terpengaruh, serta tingkat ketidakpastian/ketergantungan pihak ketiga**. 
> 
> Skala deret Fibonacci (3, 5, 8, 13) membantu saya melakukan perbandingan risiko secara objektif. Sebagai contoh, CRUD satu tabel yang jalurnya jelas diestimasi 3 SP. Fitur *core* dengan validasi otorisasi multi-role (RBAC) dinilai 8 SP karena kerumitan integrasi datanya. Sedangkan fitur *Crawler* dinilai 13 SP karena memiliki tingkat ketidakpastian paling tinggi karena bergantung pada kestabilan struktur HTML website eksternal (Scholar, BIMA, RIS) yang sewaktu-waktu dapat berubah di luar kendali sistem kita. 
> 
> Dari sisi validasi User Story, saya melakukan konfirmasi langsung kepada pihak PRPM selaku *de facto Product Owner* di setiap sesi *Sprint Review* untuk memastikan fungsionalitas yang dibangun benar-benar menyelesaikan kebutuhan mereka."

### Pertanyaan 3: "Dalam Agile Scrum, ada peran Scrum Master, Product Owner, dan Dev Team. Bagaimana Anda membagi peran tersebut ketika Anda berjalan sendirian?"
**Jawaban Mahasiswa:**
> "Meskipun bertindak sebagai pengembang tunggal, pemisahan peran tetap berjalan secara fungsional. Saya berperan sebagai **Scrum Master** untuk menjaga kedisiplinan alur metodologi (planning, development, review, retrospective) dan **Dev Team** saat menulis kode program. 
> 
> Namun, untuk peran **Product Owner**, saya tidak memegangnya sendiri. Saya menempatkan Kepala PRPM dan staf admin PRPM sebagai *Product Owner* and *Key Stakeholders*. Merekalah yang memvalidasi prioritas kebutuhan pada *Product Backlog* dan memberikan persetujuan akhir (*Acceptance Criteria*) saat sesi *Sprint Review*. Dengan kolaborasi ini, objektivitas dan kualitas sistem tetap terjaga secara profesional."

### Pertanyaan 4: "Bagaimana Anda membuktikan bahwa Anda benar-benar menerapkan Agile Scrum, bukan sekadar Waterfall yang dibagi-bagi menjadi 6 bagian?"
**Jawaban Mahasiswa:**
> "Perbedaan mendasar antara Scrum dan Waterfall yang dibagi-bagi terletak pada **bagaimana nilai (value) dihantarkan dan bagaimana sistem merespons perubahan**. 
> 
> Pertama, pada akhir setiap Sprint, sistem SIPRITI menghasilkan inkrementasi produk yang **benar-benar berfungsi dan dapat diuji** (bukan sekadar dokumen rancangan). Di Sprint 1, fitur autentikasi dan audit log selesai dan langsung diuji; di Sprint 2 modul RBAC dan master data siap; dan di Sprint 3 fitur pengajuan proposal dan hibah internal tuntas. 
> 
> Kedua, adanya perubahan kebutuhan di tengah jalan—yaitu penambahan fitur *Import Excel* di Sprint 4 berdasarkan masukan stakeholders pada demo Sprint 3—adalah bukti otentik adaptabilitas Scrum. Pada Waterfall, perubahan besar seperti ini di tengah fase konstruksi akan ditolak atau memicu keterlambatan proyek secara masif. Di Scrum, ini dikelola dengan melakukan *backlog grooming* dan memasukkannya ke perencanaan Sprint berikutnya secara terkendali."

### Pertanyaan 5: "Mengapa tidak ada fitur operasional internal yang bernilai di atas 8 Story Point? Apakah sistem ini terlalu sederhana?"
**Jawaban Mahasiswa:**
> "Tidak adanya fitur internal di atas 8 SP justru menunjukkan bahwa analisis kebutuhan dan pemodelan sistem ini sudah matang sejak awal. 
> 
> Sesuai prinsip Scrum, jika sebuah *User Story* bernilai 13 SP atau lebih, artinya fitur tersebut terlalu ambigu atau terlalu besar, sehingga wajib dipecah (*decomposed*) menjadi potongan-potongan kecil berukuran 3, 5, atau 8 SP agar lebih terkelola dan minim risiko kesalahan. 
> 
> Karena seluruh proses bisnis internal PRPM telah terdokumentasi dan terstruktur dengan jelas dalam rancangan basis data relasional kami, tingkat ketidakpastian fitur internal sangat rendah. Satu-satunya fitur yang bernilai 13 SP adalah modul *Crawler/Scraping* karena faktor eksternalitas (ketergantungan pada pihak ketiga) yang tidak bisa kita kontrol, sehingga risiko kegagalannya secara natural jauh lebih tinggi."

### Pertanyaan 6: "Bagaimana Anda melaksanakan Daily Scrum dan seremonial Scrum lainnya sebagai pengembang tunggal (solo developer)? Berapa alokasi waktu dan durasi yang Anda tetapkan?"
**Jawaban Mahasiswa:**
> "Dalam konteks solo developer, seremonial Scrum disesuaikan secara fungsional tanpa menghilangkan esensi utamanya, dengan alokasi waktu yang efisien dan terukur:
> 
> 1. **Daily Scrum (Refleksi Mandiri):** Dilakukan setiap pagi selama **10 hingga 15 menit**. Karena tidak ada anggota tim lain, ini berjalan sebagai sesi refleksi mandiri terstruktur dan pencatatan jurnal harian (*Daily Journal*). Saya menjawab tiga pertanyaan inti: *Apa yang berhasil saya selesaikan kemarin? Apa yang akan saya fokuskan hari ini? Dan apakah ada hambatan teknis yang saya hadapi?* Ini menjaga saya tetap disiplin dan fokus pada target harian.
> 2. **Sprint Planning:** Dilakukan di awal setiap Sprint selama **1 jam**. Di sini saya memetakan User Stories dari Product Backlog ke dalam tugas-tugas teknis yang realistis untuk diselesaikan dalam 2 minggu ke depan.
> 3. **Sprint Review:** Dilakukan di akhir setiap Sprint selama **30 hingga 45 menit** bersama pihak PRPM selaku *de facto Product Owner*. Sesi ini berfokus pada demonstrasi inkremen fitur yang sudah selesai dikembangkan (*working software*) untuk mendapatkan persetujuan langsung.
> 4. **Sprint Retrospective:** Dilakukan di akhir Sprint selama **15 hingga 20 menit**. Saya merefleksikan proses kerja internal: apa kendala teknis terbesar yang memperlambat pengerjaan, dan perbaikan alur apa yang harus saya terapkan pada Sprint berikutnya.
> 
> Penyesuaian durasi ini membuat kerangka kerja Scrum tetap berjalan secara profesional dan terstruktur tanpa membuang waktu produktif pengembangan."
