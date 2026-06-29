# Phase 0 Report — Pre-flight Setup

**Tanggal:** 2026-06-23
**Status:** ✅ SELESAI — semua check lulus, tidak ada blocker

---

## Environment

| Item | Nilai |
|---|---|
| Node.js | v22.23.0 |
| Platform | Linux |
| Backend port | 3000 (new) / 3001 (legacy) |

---

## Checklist Hasil

### 0.1 — mathjax-full ESM import
- **Status: ✅ PASS**
- Import ESM path (`mathjax-full/js/mathjax.js`, `input/tex.js`, `output/svg.js`, `adaptors/liteAdaptor.js`, `handlers/html.js`) semua berhasil
- Render test `E = mc^2` → SVG berhasil dihasilkan
- Tidak perlu install ulang

### 0.2 — pdfmake ESM import
- **Status: ✅ PASS**
- `import PdfPrinter from "pdfmake"` berjalan normal sebagai ESM default import
- `typeof PdfPrinter === "function"` = true

### 0.3 — Font files tersedia
- **Status: ✅ PASS — semua 8 file font tersedia**

| Font | Path | Status |
|---|---|---|
| NotoSans Regular | `fonts/noto/static/NotoSans-Regular.ttf` | ✅ |
| NotoSans Bold | `fonts/noto/static/NotoSans-Bold.ttf` | ✅ |
| NotoSans Italic | `fonts/noto/static/NotoSans-Italic.ttf` | ✅ |
| NotoSans BoldItalic | `fonts/noto/static/NotoSans-BoldItalic.ttf` | ✅ |
| Tinos Regular | `fonts/Tinos/Tinos-Regular.ttf` | ✅ |
| Tinos Bold | `fonts/Tinos/Tinos-Bold.ttf` | ✅ |
| Tinos Italic | `fonts/Tinos/Tinos-Italic.ttf` | ✅ |
| Tinos BoldItalic | `fonts/Tinos/Tinos-BoldItalic.ttf` | ✅ |

- Font path yang dipakai di PDF builder: `fonts/noto/static/` dan `fonts/Tinos/`
- Tidak perlu copy dari legacy (font sudah identik di kedua backend)

### 0.4 — @types/pdfmake
- **Status: ✅ PASS**
- `node_modules/@types/pdfmake/` tersedia dengan `index.d.ts` dan `interfaces.d.ts`
- Import `Content`, `TDocumentDefinitions`, `TFontDictionary` dari `"pdfmake/interfaces.js"` akan berfungsi

### 0.5 — mathjax-full TypeScript types
- **Status: ✅ PASS**
- `node_modules/mathjax-full/ts/` tersedia — built-in TypeScript types dari library
- `node_modules/mathjax-full/js/` tersedia — compiled JS untuk runtime import

### 0.6 — LaporanUsulan model field check
- **Status: ✅ PASS — semua field tersedia dan tipenya match**

| Field | TypeScript Type | DB ENUM |
|---|---|---|
| `haki_proposal_id` | `string` | — |
| `jenis_laporan` | `"laporan_kemajuan" \| "laporan_akhir"` | ENUM |
| `scope_tipe` | `"umum" \| "hibah_internal"` | ENUM |
| `status_laporan` | `"Lengkapi Dokumen" \| "Pending" \| "Revisi" \| "Sesuai"` | ENUM |

- `FINAL_REPORT_GATE` di Task 1.3 akan match persis:
  - `JENIS_LAPORAN: "laporan_akhir"` ✅
  - `SCOPE_TIPE: "hibah_internal"` ✅
  - `STATUS_LAPORAN: "Sesuai"` ✅

### 0.7 — File legacy yang perlu dibaca (pre-reading selesai)
- **Status: ✅ SELESAI — semua file sudah dibaca selama analysis**
- `academic-math-pdf.service.js` (186 baris) — dipahami
- `richtext-parser.service.js` (830 baris) — dipahami
- `finalReportEligibility.js` (77 baris) — dipahami
- `proposal-final-pdf/` semua file (~1964 baris total) — dipahami
- `notificationHelper.js` — dipahami

### Tambahan: pdfmake + font end-to-end test
- **Status: ✅ PASS**
- Generate PDF dengan NotoSans dan Tinos berhasil: buffer 8403 bytes
- Siap digunakan di Phase 2

### Tambahan: katex import
- **Status: ✅ PASS**
- `import katex from "katex"` — ESM default import berhasil
- Version: 0.16.45
- Render test: OK

---

## UUID Policy (update dari plan)

Per keputusan 2026-06-23:
- **UUID tetap v4** menggunakan `randomUUID()` dari `node:crypto`
- Tidak ada migrasi ke v7 — produksi sudah berjalan dengan v4
- Task 4.1 (UUID v4→v7) telah **dihapus** dari PORTING_PLAN.md
- `generateUuidV7()` yang sudah ada di beberapa model new backend: dibiarkan (tidak di-rollback, tidak diperluas ke file baru)
- File baru yang dibuat dalam porting ini: gunakan `randomUUID()` untuk ID yang dibuat secara eksplisit

---

## Blocker

**Tidak ada blocker.** Semua dependency siap.

---

## Next Step

**Phase 1 — Foundational Services** dapat dimulai:

1. **Task 1.1** — Buat `src/services/academic-math-pdf.service.ts`
2. **Task 1.2** — Lengkapi `src/services/richtext-parser.service.ts`
3. **Task 1.3** — Buat `src/modules/laporan-usulan/final-report-eligibility.util.ts`
4. **Task 1.4** — Buat `src/services/richtext-image-lifecycle.service.ts`
