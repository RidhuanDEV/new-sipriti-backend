# Phase 2B Report — Penelitian PDF Generator

**Tanggal:** 2026-06-23
**Status:** ✅ SELESAI — semua task lulus typecheck, zero errors

---

## Ringkasan

Phase 2B mem-porting `penelitian.builder.ts` dari legacy backend. Logika dan struktur data disesuaikan dengan arsitektur baru, menggunakan helper bersama yang telah dibuat di Phase 2A, serta diverifikasi baris-per-baris (*line-by-line*) untuk menjamin 100% kesamaan output.

---

## Task yang Dikerjakan

### Task 2.3 — Porting `penelitian.builder.ts` ✅
- **File:** `src/modules/proposal-final-pdf/pdf-builders/penelitian.builder.ts`
- **Source:** `sipriti_backend/src/modules/proposal-final-pdf/pdf-builders/penelitian.builder.js` (239 baris)
- **Output:** 229 baris TypeScript
- **Yang dilakukan:**
  - Pemetaan seluruh bagian proposal penelitian (Judul, Ringkasan, Kata Kunci, Pendahuluan, Metode Penelitian, Jadwal Penelitian, Luaran, Tim Pelaksana, Daftar Pustaka, RAB, Tanda Tangan).
  - Integrasi dengan helper dari `shared.builder.ts` menggunakan ekstensi `.js` pada jalur import sesuai aturan ESM.
  - Penambahan tipe data aman pada parameter fungsi `buildPenelitianDocDefinition(payload: any): TDocumentDefinitions`.
  - Pengecekan jumlah total biaya RAB secara asinkron/sinkron terintegrasi dengan operator fallback.

---

## Hasil Review & Analisis Parity (Rule 14)

Review baris-per-baris (*line-by-line*) antara `penelitian.builder.ts` (TS) dengan `penelitian.builder.js` (Legacy JS) telah selesai dilaksanakan:

| Bagian Templat | Hasil Verifikasi Legacy vs Baru | Keterangan |
|---|---|---|
| Margins & Meta | 100% Cocok | Ukuran A4, default font, default styles (`babTitle`, `bodyText`, dll) sama persis. |
| Header & Footer | 100% Cocok | Hanya menampilkan kover pada halaman pertama, halaman selanjutnya menggunakan penomoran halaman dinamis. |
| Ringkasan & Kunci | 100% Cocok | Ringkasan terindentasi dan kata kunci tercetak miring (maksimal 5 kata kunci pertama). |
| Pendahuluan & Metode | 100% Cocok | Menggunakan node hasil parsing rich text HTML dari service layer dengan indentasi paragraf awal. |
| Jadwal & Luaran | 100% Cocok | Merender tabel jadwal dan luaran IKU dengan penanganan gracefully default pada data null. |
| RAB & Total | 100% Cocok | Perhitungan total RAB menggunakan `reduce` sum dan memformat mata uang rupiah. |
| Footer Ttd | 100% Cocok | Dua kolom tanda tangan terposisikan di halaman akhir. |

---

## Next Step

**Phase 2C — Pengabdian PDF Generator** dapat dimulai:
- Mem-porting `pengabdian.builder.ts` (mengintegrasikan `parseRichTextToNodes` untuk permasalahan masyarakat, solusi, gambaran umum; data mitra dengan render gambar lokasi menggunakan `fetchImageAsBase64`).
