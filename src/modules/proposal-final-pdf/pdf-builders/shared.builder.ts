import type { Content } from "pdfmake/interfaces.js";

/**
 * Shared PDF builder utilities for the proposal-final-pdf module.
 *
 * Layout constants:
 *   A4 width      = 595.28 pt
 *   Left margin   = 72 pt (1 inch)
 *   Right margin  = 72 pt (1 inch)
 *   Usable width  = 451.28 pt  ← every table widths[] MUST sum to this
 */

export const cmToPt = (cm: number): number => Math.round(cm * 28.3465);
export const ONE_INCH_CM = 2.54;
export const ONE_INCH_PT = cmToPt(ONE_INCH_CM); // 72 pt

/** A4 usable width after 1-inch margins on both sides (pt). */
export const USABLE_WIDTH_PT = 595.28 - ONE_INCH_PT * 2; // ≈ 451.28

export const safeText = (value: unknown, fallback = "-"): string => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
};

export const formatCurrencyIDR = (value: unknown): string => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numeric);
};

export const formatNumberID = (value: unknown): string => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return "0";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(
    numeric,
  );
};

export const toBodyCell = (
  text: unknown,
  alignment: "left" | "center" | "right" | "justify" = "left",
  style = "tableText",
): any => ({
  text: safeText(text, "-"),
  style,
  alignment,
});

export const toTableHeaderCell = (
  text: string,
  options: any = {},
): any => ({
  text,
  style: "tableHeader",
  alignment: "center",
  ...options,
});

/**
 * Build the second header line based on proposal type.
 */
export const buildHeaderSecondLine = (proposalType: string): string => {
  if (safeText(proposalType, "").toLowerCase() === "pengabdian") {
    return "PENGABDIAN KEPADA MASYARAKAT INSTITUT TEKNOLOGI INDONESIA";
  }
  return "PENELITIAN HIBAH INTERNAL INSTITUT TEKNOLOGI INDONESIA";
};

/**
 * Build the two-column header block.
 */
export const buildProposalHeaderContent = (
  logoDataUrl: string | null | undefined,
  proposalType: string,
  tahunDokumen?: string | number | null,
): any => {
  const logoNode: any = logoDataUrl
    ? {
        image: logoDataUrl,
        width: 48,
        alignment: "center",
        margin: [0, 16, 0, 0],
      }
    : { text: "", width: 48 };

  const tahun = tahunDokumen
    ? String(tahunDokumen)
    : String(new Date().getFullYear());

  return {
    columns: [
      { width: 48, stack: [logoNode], alignment: "left" },
      {
        stack: [
          {
            text: "USULAN PROPOSAL PENDANAAN INTERNAL PERGURUAN TINGGI KEGIATAN",
            margin: [0, 24, 0, 0],
          },
          { text: buildHeaderSecondLine(proposalType) },
          { text: `TAHUN ${tahun}` },
        ],
        style: "headerTitle",
        bold: true,
        fontSize: 10,
        lineHeight: 1,
        width: "*",
        alignment: "center",
      },
    ],
    columnGap: 4,
    margin: [ONE_INCH_PT, 0, ONE_INCH_PT, 0],
  };
};

/**
 * Build signature image node or blank placeholder.
 */
export const buildSignatureVisualNode = (
  signatureImageDataUrl: string | null | undefined,
  placeholderBreakCount = 4,
): any => {
  if (signatureImageDataUrl) {
    return {
      image: signatureImageDataUrl,
      fit: [110, 60],
      alignment: "center",
      margin: [0, 8, 0, 8],
    };
  }
  return { text: "\n".repeat(Math.max(placeholderBreakCount, 1)) };
};

// ─────────────────────────────────────────────────────────────────────────────
// TIM PELAKSANA
// 5 cols: No(20) | Institusi(100) | Nama(115) | Posisi(80) | Tugas(136) = 451
// ─────────────────────────────────────────────────────────────────────────────

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

/**
 * Build Tim Pelaksana table rows.
 * PRD §4.2 — 5 columns: No, Institusi, Nama, Posisi, Tugas. NIDN excluded.
 */
export const buildTimRows = (payload: TimPayload): any[][] => {
  const rows = [
    {
      no: 1,
      institusi: payload.ketua?.institusi,
      nama: payload.ketua?.nama,
      posisi:
        payload.ketua?.posisi_dalam_tim || payload.ketua?.peran || "Ketua",
      tugas: payload.ketua?.bidangTugas || payload.ketua?.bidangKeahlian,
    },
    ...(Array.isArray(payload.anggota)
      ? payload.anggota.map((a, i) => ({
          no: i + 2,
          institusi: a?.institusi,
          nama: a?.nama,
          posisi: a?.posisi_dalam_tim || a?.peran || "Anggota",
          tugas: a?.bidangTugas || a?.bidangKeahlian,
        }))
      : []),
  ];

  return rows.map((item) => [
    toBodyCell(item.no, "center", "tableTextSmall"),
    toBodyCell(item.institusi, "left", "tableTextSmall"),
    toBodyCell(item.nama, "left", "tableTextSmall"),
    toBodyCell(item.posisi, "center", "tableTextSmall"),
    toBodyCell(item.tugas, "left", "tableTextSmall"),
  ]);
};

// ─────────────────────────────────────────────────────────────────────────────
// JADWAL PENELITIAN
//
// Layout: 14 columns
//   No(20) | Kegiatan(*=215) | M1..M12 (18×12=216)  → total 451 pt
//
// Header — 2 rows with rowSpan / colSpan:
//   Row 1: [No rs=2] [Kegiatan rs=2] [Tahun XXXX cs=12] [×11 placeholders]
//   Row 2: [ph] [ph] [1][2][3][4][5][6][7][8][9][10][11][12]
//
// Body — grouped by project year (item.tahun).
//   Year 1 activities → data rows.
//   Year 2+ activities → preceded by a full-width separator row showing the
//   calendar year label.
// ─────────────────────────────────────────────────────────────────────────────

const JADWAL_MONTH_WIDTH = 12; // pt per month column
const JADWAL_NO_WIDTH = 20; // pt for No column

export interface BulanAktifPayload {
  bulan: number;
}

export interface JadwalProposalPayload {
  tahun: number;
  urutan: number;
  nama_kegiatan?: string;
  kegiatan?: string;
  bulanAktif?: BulanAktifPayload[];
}

/**
 * @param jadwalList
 * @param tahunDokumen  — calendar year of the first project year (e.g. 2026)
 */
export const buildJadwalTimelineTable = (
  jadwalList: JadwalProposalPayload[],
  tahunDokumen?: string | number | null,
): any => {
  if (!Array.isArray(jadwalList) || jadwalList.length === 0) {
    return {
      text: "Belum ada jadwal kegiatan yang tersedia.",
      fontSize: 9,
      italics: true,
      color: "#6B7280",
      margin: [0, 4, 0, 4],
    };
  }

  const baseYear = Number(tahunDokumen) || new Date().getFullYear();

  // ── Group activities by project year (item.tahun = 1, 2, 3 …) ──────────────
  const groups: Record<number, JadwalProposalPayload[]> = {};
  jadwalList
    .slice()
    .sort((a, b) => a.tahun - b.tahun || a.urutan - b.urutan)
    .forEach((item) => {
      const thn = item.tahun || 1;
      if (!groups[thn]) groups[thn] = [];
      groups[thn].push(item);
    });

  const sortedProjectYears = Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const ph: Record<string, never> = {}; // placeholder cell for rowSpan / colSpan

  const monthHeaderCell = (num: number): any => ({
    text: String(num),
    style: "tableHeader",
    alignment: "center",
    fontSize: 9,
  });

  const yearLabelCell = (calYear: number, colSpan = 12): any => ({
    text: `Tahun ${calYear}`,
    colSpan,
    style: "tableHeader",
    alignment: "center",
    fillColor: "#FFFFFF",
  });

  const checkCell = (isAktif: boolean): any => ({
    text: "",
    alignment: "center",
    fontSize: 9,
    fillColor: isAktif ? "#FFFF00" : undefined,
    style: "tableTextSmall",
  });

  // ── Build body rows ────────────────────────────────────────────────────────
  const firstProjectYear = sortedProjectYears[0] ?? 1;
  const firstCalYear = baseYear + firstProjectYear - 1;

  // Row 1 of header: No (rowSpan 2), Kegiatan (rowSpan 2), Year label (colSpan 12)
  const headerRow1: any[] = [
    { ...toTableHeaderCell("No"), rowSpan: 2 },
    { ...toTableHeaderCell("Kegiatan"), rowSpan: 2 },
    yearLabelCell(firstCalYear, 12),
    ...Array(11).fill(ph),
  ];

  // Row 2 of header: placeholders for rowSpan columns, then month numbers 1–12
  const headerRow2: any[] = [
    ph,
    ph,
    ...Array.from({ length: 12 }, (_, i) => monthHeaderCell(i + 1)),
  ];

  const body: any[][] = [headerRow1, headerRow2];

  let rowCounter = 1;

  sortedProjectYears.forEach((projectYear, yearIdx) => {
    const calYear = baseYear + projectYear - 1;

    // For years after the first, insert a full-width separator row
    if (yearIdx > 0) {
      body.push([
        {
          text: `Tahun ${calYear}`,
          colSpan: 14,
          style: "tableHeader",
          alignment: "center",
          fillColor: "#F3F4F6",
        },
        ...Array(13).fill(ph),
      ]);
    }

    // Activity rows for this project year
    (groups[projectYear] ?? []).forEach((item) => {
      const aktifSet = new Set((item.bulanAktif || []).map((b) => b.bulan));
      body.push([
        toBodyCell(rowCounter++, "center", "tableTextSmall"),
        toBodyCell(
          item.nama_kegiatan || item.kegiatan,
          "left",
          "tableTextSmall",
        ),
        ...Array.from({ length: 12 }, (_, i) => checkCell(aktifSet.has(i + 1))),
      ]);
    });
  });

  return {
    table: {
      headerRows: 2,
      widths: [
        JADWAL_NO_WIDTH, // No (20)
        "*", // Kegiatan — auto-fill (safe: outer table has explicit width)
        ...Array(12).fill(JADWAL_MONTH_WIDTH), // Jan–Des (12 × 12 = 144)
      ],
      body,
      dontBreakRows: true,
    },
    margin: [0, 4, 0, 8],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// LUARAN
// 5 cols: No(20) | Jenis Luaran(110) | Target Capaian(100) | IKU(100) | TgtCapIKU(121) = 451
// ─────────────────────────────────────────────────────────────────────────────

export interface LuaranProposalPayload {
  namaLuaran?: string;
  jenis_luaran?: string;
  targetCapaian?: string;
  target_capaian?: string;
  ikuTerkait?: string;
  iku_terkait?: string;
  targetCapaianIku?: string;
  target_capaian_iku?: string;
}

/**
 * Build Luaran table rows.
 * PRD §7 — 5 columns: No, Jenis Luaran, Target Capaian, IKU Terkait, Target Capaian IKU.
 */
export const buildLuaranRows = (
  luaran: LuaranProposalPayload[] = [],
): any[][] => {
  if (!Array.isArray(luaran) || luaran.length === 0) {
    return [
      [
        toBodyCell("1", "center", "tableTextSmall"),
        toBodyCell("-", "left", "tableTextSmall"),
        toBodyCell("-", "left", "tableTextSmall"),
        toBodyCell("-", "left", "tableTextSmall"),
        toBodyCell("-", "left", "tableTextSmall"),
      ],
    ];
  }

  return luaran.map((item, index) => [
    toBodyCell(index + 1, "center", "tableTextSmall"),
    toBodyCell(
      item?.namaLuaran || item?.jenis_luaran,
      "left",
      "tableTextSmall",
    ),
    toBodyCell(
      item?.targetCapaian || item?.target_capaian,
      "left",
      "tableTextSmall",
    ),
    toBodyCell(item?.ikuTerkait || item?.iku_terkait, "left", "tableTextSmall"),
    // PRD alias: target_capaian_iku
    toBodyCell(
      item?.targetCapaianIku || item?.target_capaian_iku,
      "left",
      "tableTextSmall",
    ),
  ]);
};

// ─────────────────────────────────────────────────────────────────────────────
// RAB
// 7 cols: No(20) | Uraian(*) | Sat(38) | Vol(30) | BiayaSatuan(72) | Pajak(35) | Jml(80) = 451
// Fixed total = 20+38+30+72+35+80 = 275 → * ≈ 176 pt
// ─────────────────────────────────────────────────────────────────────────────

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

/**
 * Build RAB table rows.
 * PRD §10 — 7 columns: No, Uraian Belanja, Sat, Vol, Biaya Satuan, Pajak, Jumlah Dibayarkan.
 */
export const buildRabRows = (
  rab: RabProposalPayload[] = [],
): any[][] => {
  if (!Array.isArray(rab) || rab.length === 0) {
    return [
      [
        toBodyCell("1", "center", "tableTextSmall"),
        toBodyCell("-", "left", "tableTextSmall"),
        toBodyCell("-", "center", "tableTextSmall"),
        toBodyCell("0", "center", "tableTextSmall"),
        toBodyCell("0", "right", "tableTextSmall"),
        toBodyCell("-", "center", "tableTextSmall"),
        toBodyCell("0", "right", "tableTextSmall"),
      ],
    ];
  }

  return rab.map((item, index) => [
    toBodyCell(index + 1, "center", "tableTextSmall"),
    // PRD alias: uraian_belanja
    toBodyCell(
      item?.uraian_belanja || item?.uraianBelanja || item?.item,
      "left",
      "tableTextSmall",
    ),
    toBodyCell(item?.satuan, "center", "tableTextSmall"),
    toBodyCell(formatNumberID(item?.volume), "center", "tableTextSmall"),
    toBodyCell(
      formatCurrencyIDR(item?.biayaSatuan || item?.biaya_satuan),
      "right",
      "tableTextSmall",
    ),
    toBodyCell(safeText(item?.pajak), "center", "tableTextSmall"),
    // PRD alias: jumlah_dibayarkan
    toBodyCell(
      formatCurrencyIDR(
        item?.jumlah_dibayarkan ||
          item?.jumlahDibayarkan ||
          item?.totalBiaya ||
          item?.total_biaya,
      ),
      "right",
      "tableTextSmall",
    ),
  ]);
};

// ─────────────────────────────────────────────────────────────────────────────
// SIGNATURE FOOTER
// ─────────────────────────────────────────────────────────────────────────────

export interface PihakMengetahuiPayload {
  prodi?: string;
  signatureImageDataUrl?: string;
  nama?: string;
  nidn?: string;
}

export interface TtdFooterPayload {
  pihakMengetahui?: PihakMengetahuiPayload;
  lokasiTtd?: string;
  tanggalCetak?: string;
  ketua?: {
    nama?: string;
    nidn?: string;
  };
}

/**
 * Build the signature/footer block (unchanged layout, borderless table).
 */
export const buildTtdFooter = (payload: TtdFooterPayload): any => {
  return {
    margin: [0, 36, 0, 0],
    table: {
      widths: [160, 130, 160],
      body: [
        [
          {
            stack: [
              { text: "Mengetahui", bold: true },
              {
                text: `Kaprodi ${safeText(payload.pihakMengetahui?.prodi)}`,
                bold: true,
                margin: [0, 2, 0, 0],
              },
              buildSignatureVisualNode(
                payload.pihakMengetahui?.signatureImageDataUrl,
                5,
              ),
              { text: safeText(payload.pihakMengetahui?.nama) },
              { text: `NIDN. ${safeText(payload.pihakMengetahui?.nidn)}` },
            ],
            style: "signatureText",
            alignment: "center",
          },
          { text: "" },
          {
            stack: [
              {
                text: `${safeText(payload.lokasiTtd)}, ${safeText(payload.tanggalCetak)}`,
              },
              { text: "Ketua Tim Pengusul", bold: true },
              { text: "\n".repeat(4) },
              { text: safeText(payload.ketua?.nama) },
              { text: `NIDN. ${safeText(payload.ketua?.nidn)}` },
            ],
            style: "signatureText",
            alignment: "center",
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// OUTER TABLE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a single label row for the outer proposal table.
 * @param text - Section label, e.g. "RINGKASAN"
 * @returns Single-element array (one cell spanning full width)
 */
export const buildSectionLabelRow = (text: string): any[] => [
  {
    text,
    bold: true,
    fontSize: 10,
    fillColor: "#F3F4F6",
    alignment: "left",
    margin: [4, 3, 4, 3],
  },
];

/**
 * Wrap all proposal section rows into a single outer bordered table.
 * @param sectionRows - Array of single-cell rows from buildSectionLabelRow + content rows
 * @returns pdfmake table node
 */
export const buildOuterTable = (sectionRows: any[][]): any => ({
  table: {
    widths: [USABLE_WIDTH_PT - 2], // subtract 2pt for left+right vLine borders
    body: sectionRows,
    dontBreakRows: false,
  },
  layout: {
    hLineWidth: (i: number, node: any) =>
      i === 0 || i === node.table.body.length ? 1.5 : 0.5,
    vLineWidth: () => 1,
    hLineColor: () => "#000000",
    vLineColor: () => "#000000",
    paddingLeft: () => 0,
    paddingRight: () => 0,
    paddingTop: (i: number) => (i === 0 ? 0 : 4),
    paddingBottom: () => 8,
  },
  margin: [0, 0, 0, 12],
});

/**
 * Prepend indent spaces to the first text of each paragraph node.
 * Skips images, tables, lists, and other non-text nodes.
 * @param nodes - pdfmake content nodes
 * @returns
 */
const INDENT_PREFIX = "      ";
export const applyFirstLineIndent = (nodes: any[]): any[] => {
  if (!Array.isArray(nodes) || nodes.length === 0) return nodes;

  return nodes.map((node) => {
    if (!node) return node;

    // Check if it is a primitive string
    if (typeof node === "string") {
      return INDENT_PREFIX + node;
    }

    // Check if it has an structural layout or is an image (do not indent)
    const objNode = node as any;
    if (
      objNode.image ||
      objNode.table ||
      objNode.ul ||
      objNode.ol ||
      objNode.columns
    ) {
      return node;
    }

    if (objNode.text !== undefined) {
      if (typeof objNode.text === "string") {
        return { ...objNode, text: INDENT_PREFIX + objNode.text };
      }
      if (Array.isArray(objNode.text)) {
        const [first, ...rest] = objNode.text;
        if (typeof first === "string") {
          return { ...objNode, text: [INDENT_PREFIX + first, ...rest] };
        }
        if (
          first &&
          typeof first === "object" &&
          typeof (first as any).text === "string"
        ) {
          return {
            ...objNode,
            text: [
              { ...first, text: INDENT_PREFIX + (first as any).text },
              ...rest,
            ],
          };
        }
      }
    }
    if (objNode.stack && Array.isArray(objNode.stack)) {
      return { ...objNode, stack: applyFirstLineIndent(objNode.stack) };
    }
    return node;
  });
};
