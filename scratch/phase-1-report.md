# Phase 1 Report — Foundational Services

**Tanggal:** 2026-06-23
**Status:** ✅ SELESAI — semua task lulus typecheck, zero errors

---

## Ringkasan

Phase 1 membangun empat service/util yang menjadi fondasi untuk Phase 2 (PDF rebuild).
Semua file diport dari `sipriti_backend/` dengan konversi penuh ke TypeScript strict + ESM.

---

## Task yang Dikerjakan

### Task 1.1 — `academic-math-pdf.service.ts` ✅

**File:** `src/services/academic-math-pdf.service.ts`
**Source:** `sipriti_backend/src/services/academic-math-pdf.service.js` (186 baris)
**Output:** 200 baris TypeScript

**Yang dilakukan:**
- MathJax module-level singleton (`adaptor`, `texInput`, `svgOutput`, `mathDocument`) — init sekali saat load, bukan per-request
- ESM imports mathjax-full dengan path `.js` extension (e.g. `mathjax-full/js/mathjax.js`)
- KaTeX gate: `isKatexRenderable()` — konsistensi dengan preview frontend yang memakai KaTeX
- `logger.warn()` menggantikan `console.warn()`
- Interface TypeScript: `SvgLength`, `MathSvgPdfNode`
- Export: `normalizeLatexInput`, `buildLatexFallbackText`, `isKatexRenderable`, `renderLatexToSvg`, `readSvgLength`, `resolvePdfMathWidth`, `buildMathSvgPdfNode`, `MATH_PDF_COLOR`

---

### Task 1.2 — `richtext-parser.service.ts` ✅

**File:** `src/services/richtext-parser.service.ts`
**Source:** `sipriti_backend/src/services/richtext-parser.service.js` (830 baris)
**Output:** 744 baris TypeScript

**Yang dilakukan:**
- Import DOM types dari `domhandler` (`AnyNode`, `Element`, `Text as DomText`) — cheerio v1.2 tidak export langsung
- Sanitize pipeline: `sanitize-html` dengan allowlist tag dan attribute yang ketat
- Pre-processing unicode superscript/subscript (`⁰¹²...₀₁₂...`) → HTML `<sup>`/`<sub>` sebelum sanitize
- Image handling: SSRF-safe (external URL tidak difetch), path-traversal-safe (validasi terhadap `UPLOAD_ROOT_DIR`)
- `ensurePdfmakeSupportedImage()`: konversi gambar ke JPEG/PNG via `sharp`
- Inline content: `collectInlineParts()` → `normalizeInlineParts()` → `buildInlineContent()` dengan inheritance style (bold, italic, underline, strikethrough, sup, sub, link)
- List builder: `buildListNode()` dengan nested list support
- Table builder: `buildTableNode()` dengan header row detection; `colspan`/`rowspan` dipertahankan di sanitizer allow-list tapi tidak dikonversi ke pdfmake `colSpan`/`rowSpan` (parity dengan legacy — keduanya tidak handle ini)
- Math inline/block: `buildMathPdfNode()` → MathJax SVG atau fallback `$...$` / `$$...$$`
- `stripHtmlToPlainText()` dipertahankan dan ditingkatkan dengan unicode conversion

**Perubahan signifikan dari legacy:**
- `decodeEntities: true` dihapus dari cheerio options (tidak valid di cheerio v1.2 tanpa `xml: true`; cheerio sudah handle by default)
- DOM types menggunakan `domhandler` bukan `cheerio` namespace (API berubah di v1.x)
- Cast `as unknown as Content` digunakan untuk bridge antara pdfmake `Content` union type dan `Record<string, unknown>` internal

**Security:**
- SSRF guard: src yang dimulai `http` hanya diizinkan jika path-nya `/uploads/` atau `/api/files/path/`
- Path traversal guard: `absolutePath.startsWith(UPLOAD_ROOT_DIR + path.sep)`
- Max image per dokumen: 8 gambar
- Max image size: 2 MB

**sharp dependency fix:**
- `sharp@0.34.5` memerlukan `npm approve-scripts sharp` untuk mengaktifkan native binding di linux-x64
- Sudah di-approve dan diverifikasi: `import('sharp')` berhasil

---

### Task 1.3 — `final-report-eligibility.util.ts` ✅

**File:** `src/utils/final-report-eligibility.util.ts`
**Source:** `sipriti_backend/src/lib/finalReportEligibility.js` (77 baris)
**Output:** 73 baris TypeScript

**Yang dilakukan:**
- `FINAL_REPORT_GATE` dengan `as const` untuk type narrowing yang tepat
- `buildFinalReportValidationMap(proposalIds)` → `Map<string, boolean>` — batch check
- `isFinalReportValidatedForProposal(proposalId)` → `boolean` — single check
- Type guard `(id): id is string` untuk filter hasil `findAll` dengan `raw: true`
- Model import dari `"../modules/proposal/laporan-usulan.model.js"`

---

### Task 1.4 — `richtext-image-lifecycle.service.ts` ✅

**File:** `src/services/richtext-image-lifecycle.service.ts`
**Source:** `sipriti_backend/src/services/richtext-image-lifecycle.service.js` (111 baris)
**Output:** 111 baris TypeScript

**Yang dilakukan:**
- `getRichtextFilenameFromSource(src)` — parse filename dari `/uploads/richtext/` atau `/api/files/path/richtext/` URL
- `extractRichtextUploadFilenames(html)` — regex scan `<img src>` dari HTML, return `Set<string>`
- `collectRemovedRichtextImageFilenames(prev, next)` — diff previous vs next HTML values
- `deleteRichtextImagesBestEffort(filenames, user)` — best-effort async deletion

**Perbedaan dari legacy:**
- Legacy: `deleteRichtextImage(filename, null)` — upload service menerima null user
- New backend: `uploadService.deleteRichtextImage(filename, user)` mensyaratkan `AuthenticatedUserContext`
- **Solusi:** Parameter `user: AuthenticatedUserContext | null = null`
  - Jika `user` ada: delegate ke `uploadService.deleteRichtextImage()` (includes audit log)
  - Jika `user` null: `resolveUploadPath()` + `deleteFileSafe()` langsung (no audit, matches legacy semantics)

---

## Hasil Typecheck

```
Full project typecheck (npx tsc --noEmit): 0 errors ✅
```

Semua 4 file baru plus seluruh project existing pass tanpa error.

---

## Dependency yang Diverifikasi

| Dep | Status |
|---|---|
| `mathjax-full` ESM imports | ✅ |
| `katex` ESM default import | ✅ |
| `sanitize-html` + `@types/sanitize-html` | ✅ |
| `cheerio` v1.2.0 | ✅ |
| `domhandler` (types: `AnyNode`, `Element`, `Text`) | ✅ |
| `sharp` v0.34.5 (linux-x64 native binding) | ✅ (after approve-scripts) |
| `pdfmake/interfaces.js` (`Content` type) | ✅ |

---

## Files Dibuat

| File | Baris | Task |
|---|---|---|
| `src/services/academic-math-pdf.service.ts` | 199 | 1.1 |
| `src/services/richtext-parser.service.ts` | 744 | 1.2 |
| `src/utils/final-report-eligibility.util.ts` | 73 | 1.3 |
| `src/services/richtext-image-lifecycle.service.ts` | 111 | 1.4 |

---

## Next Step

**Phase 2 — PDF Rebuild** dapat dimulai secara modular:

1. **Phase 2A** — PDF Setup & Shared Layouts (Setup direktori dan porting `shared.builder.ts`)
2. **Phase 2B** — Penelitian PDF Generator (Porting `penelitian.builder.ts` dengan parser LaTeX/rich text)
3. **Phase 2C** — Pengabdian PDF Generator (Porting `pengabdian.builder.ts` beserta gambar lokasi mitra)
4. **Phase 2D** — Service, Routes & Gates (Rebuild `proposal-final-pdf.service.ts` dan routing/RBAC)

Source legacy: `sipriti_backend/src/modules/proposal-final-pdf/` (~1964 baris total)
