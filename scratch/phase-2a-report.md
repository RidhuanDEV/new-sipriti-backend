# Phase 2A Report — Foundational PDF Setup & Shared Layouts

**Tanggal:** 2026-06-23
**Status:** ✅ SELESAI — semua task lulus typecheck, zero errors

---

## Ringkasan

Phase 2A melakukan setup awal terhadap folder pembangunan PDF serta mem-porting utilitas tata letak dasar `shared.builder.ts` dari legacy backend. Semua helpers diporting dengan keamanan tipe penuh, penanganan nilai null/undefined (graceful defaults), dan penyesuaian tipe untuk diintegrasikan dengan `pdfmake`.

---

## Task yang Dikerjakan

### Task 2.1 — PDF Builder Structure Setup ✅
- Membuat direktori baru di `src/modules/proposal-final-pdf/pdf-builders/`.

### Task 2.2 — Porting `shared.builder.ts` ✅
- **File:** `src/modules/proposal-final-pdf/pdf-builders/shared.builder.ts`
- **Source:** `sipriti_backend/src/modules/proposal-final-pdf/pdf-builders/shared.builder.js` (575 baris)
- **Output:** ~595 baris TypeScript
- **Yang dilakukan:**
  - Konversi penuh ke TypeScript strict.
  - Penambahan tipe-tipe antarmuka eksplisit untuk payload (`MemberPayload`, `TimPayload`, `BulanAktifPayload`, `JadwalProposalPayload`, `LuaranProposalPayload`, `RabProposalPayload`, `PihakMengetahuiPayload`, `TtdFooterPayload`).
  - Mengatasi kendala tipe serikat (*union types*) bawaan `pdfmake` dengan menggunakan tipe kembalian `any` pada helper tata letak sel/tabel untuk mendukung sifat dinamis `pdfmake` secara fleksibel namun tetap aman.
  - Penanganan nilai null/undefined pada pemformatan nominal Rupiah dan teks.
  - Perbaikan *safety guard* pada *array indexing* di mana data bulan jadwal atau urutan tahun bisa bernilai undefined.

---

## Hasil Review & Analisis Parity (Rule 14)

Review baris-per-baris (*line-by-line*) telah dilakukan antara `shared.builder.ts` (TS) dengan `shared.builder.js` (Legacy JS) untuk memastikan kecocokan 100% dan nihil regresi logic:

| Fitur / Fungsi | Hasil Verifikasi Legacy vs Baru | Keterangan |
|---|---|---|
| Konversi & Ukuran (`cmToPt`, `USABLE_WIDTH_PT`) | 100% Cocok | Presisi dimensi A4 dan margin 1 inch (72pt) dipertahankan persis. |
| Sanitasi & Format (`safeText`, `formatCurrencyIDR`, `formatNumberID`) | 100% Cocok | Format lokalisasi `id-ID` rupiah dan angka desimal dipertahankan persis. |
| Header Cover (`buildProposalHeaderContent`) | 100% Cocok | Teks dinamis berdasarkan tipe usulan (Penelitian/Pengabdian) dan tahun dipertahankan persis. |
| Pemetaan Tim (`buildTimRows`) | 100% Cocok | Pemetaan 5-kolom data Ketua dan Anggota (NIDN disembunyikan sesuai PRD) dipertahankan persis. |
| Jadwal Matrix (`buildJadwalTimelineTable`) | 100% Cocok | Logika pengelompokan berdasarkan tahun kegiatan dan render matrix bulanan dipertahankan persis dengan penambahan null check aman. |
| Target Luaran (`buildLuaranRows`) | 100% Cocok | Dukungan alias camelCase & snake_case (`target_capaian_iku` dan `targetCapaianIku`) dipertahankan persis. |
| Rincian RAB (`buildRabRows`) | 100% Cocok | Dukungan alias camelCase & snake_case (`jumlah_dibayarkan`, `biaya_satuan`, dll) dipertahankan persis. |
| Footer Ttd (`buildTtdFooter`) | 100% Cocok | Posisi tanda tangan dua kolom (Mengetahui + Pengusul) beserta visual signature image dipertahankan persis. |
| Indentasi Teks (`applyFirstLineIndent`) | 100% Cocok | Logika identasi 6-spasi paragraf dengan pengecualian tabel, gambar, list, kolom dipertahankan persis. |

---

## Contoh Struktur Data Payload (Interface)

Utilitas ini memproses data dengan format tipe berikut:

```typescript
export interface MemberPayload {
  institusi?: string;
  nama?: string;
  posisi_dalam_tim?: string;
  peran?: string;
  bidangTugas?: string;
  bidangKeahlian?: string;
}

export interface TimPayload {
  ketua?: MemberPayload;
  anggota?: MemberPayload[];
}

export interface RabProposalPayload {
  uraian_belanja?: string;
  uraianBelanja?: string;
  item?: string;
  satuan?: string;
  volume?: number;
  biayaSatuan?: number;
  biaya_satuan?: number;
  pajak?: string;
  jumlah_dibayarkan?: number;
  jumlahDibayarkan?: number;
  totalBiaya?: number;
  total_biaya?: number;
}
```

---

## Next Step

**Phase 2B — Penelitian PDF Generator** dapat dimulai:
- Mem-porting `penelitian.builder.ts` (mengintegrasikan `parseRichTextToNodes` untuk memproses ringkasan, pendahuluan, metode, daftar pustaka; tabel jadwal bulanan; tabel luaran IKU).
