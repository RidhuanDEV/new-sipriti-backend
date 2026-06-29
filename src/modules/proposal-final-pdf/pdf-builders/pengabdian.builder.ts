import type { TDocumentDefinitions } from "pdfmake/interfaces.js";
import {
  ONE_INCH_PT,
  safeText,
  formatCurrencyIDR,
  toTableHeaderCell,
  buildProposalHeaderContent,
  buildTimRows,
  buildJadwalTimelineTable,
  buildLuaranRows,
  buildRabRows,
  buildTtdFooter,
  buildSectionLabelRow,
  buildOuterTable,
  applyFirstLineIndent,
} from "./shared.builder.js";

const W_LUARAN = [20, 100, 100, 100, "*"];
const W_TIM = [20, 90, 100, 90, "*"];
const W_RAB = [20, "*", 38, 35, 72, 36, 110];

/**
 * Build pdfmake TDocumentDefinitions for Template B — Kegiatan Pengabdian.
 *
 * @param payload
 * @returns TDocumentDefinitions
 */
export const buildPengabdianDocDefinition = (payload: any): TDocumentDefinitions => {
  const totalJumlahDibayarkan = Array.isArray(payload.rab)
    ? payload.rab.reduce(
        (sum: number, item: any) =>
          sum +
          Number(
            item?.jumlah_dibayarkan ||
              item?.jumlahDibayarkan ||
              item?.totalBiaya ||
              item?.total_biaya ||
              0,
          ),
        0,
      )
    : 0;

  return {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [ONE_INCH_PT, ONE_INCH_PT, ONE_INCH_PT, ONE_INCH_PT],
    header: (currentPage: number) => {
      if (currentPage !== 1) return null;
      return buildProposalHeaderContent(
        payload.logoDataUrl,
        "Pengabdian",
        payload.tahunDokumen,
      ) as any;
    },
    footer: (currentPage: number, pageCount: number) => ({
      text: `Halaman ${currentPage} dari ${pageCount}`,
      alignment: "right",
      fontSize: 9,
      color: "#6B7280",
      margin: [0, 24, 32, 0],
    }),
    defaultStyle: {
      font: payload.fallbackFont || "NotoSans",
      fontSize: 11,
      lineHeight: 1.5,
      color: "#000000",
    },
    styles: {
      babTitle: { fontSize: 12, bold: true, margin: [0, 12, 0, 4] },
      bodyText: { fontSize: 11, alignment: "justify" },
      tableHeader: { bold: true, fontSize: 9, alignment: "center" },
      tableText: { fontSize: 9 },
      tableTextSmall: { fontSize: 8 },
      signatureText: { fontSize: 10, alignment: "center" },
      headerTitle: {
        fontSize: 9,
        bold: true,
        alignment: "center",
        lineHeight: 1,
      },
    },
    content: [
      { text: "", margin: [0, 0, 0, 10] },

      buildOuterTable([
        // ── JUDUL ──────────────────────────────────────────────────────
        buildSectionLabelRow("JUDUL"),
        [
          {
            text: safeText(payload.judul),
            fontSize: 12,
            alignment: "left",
            margin: [8, 0, 8, 0],
          },
        ],

        // ── RINGKASAN ───────────────────────────────────────────────────
        buildSectionLabelRow("RINGKASAN"),
        [
          {
            stack: applyFirstLineIndent([
              {
                text: safeText(payload.substansiContent?.ringkasan),
                style: "bodyText",
              },
            ]),
            margin: [8, 0, 8, 0],
          },
        ],

        // ── KATA KUNCI ──────────────────────────────────────────────────
        buildSectionLabelRow("KATA KUNCI"),
        [
          {
            text:
              Array.isArray(payload.substansiContent?.kataKunci) &&
              payload.substansiContent.kataKunci.length > 0
                ? payload.substansiContent.kataKunci.slice(0, 5).join(", ")
                : "-",
            style: "bodyText",
            italics: true,
            margin: [8, 0, 8, 0],
          },
        ],

        // ── PENDAHULUAN ─────────────────────────────────────────────────
        buildSectionLabelRow("PENDAHULUAN"),
        [
          {
            stack: applyFirstLineIndent(
              payload.substansiContent?.pendahuluanNodes?.length > 0
                ? payload.substansiContent.pendahuluanNodes
                : [{ text: "-", style: "bodyText" }],
            ),
            margin: [8, 0, 8, 0],
          },
        ],

        // ── PERMASALAHAN DAN SOLUSI ─────────────────────────────────────
        buildSectionLabelRow("PERMASALAHAN DAN SOLUSI"),
        [
          {
            stack: applyFirstLineIndent(
              payload.substansiContent?.permasalahanNodes?.length > 0
                ? payload.substansiContent.permasalahanNodes
                : [{ text: "-", style: "bodyText" }],
            ),
            margin: [8, 0, 8, 0],
          },
        ],

        // ── METODE PELAKSANAAN ──────────────────────────────────────────
        buildSectionLabelRow("METODE PELAKSANAAN"),
        [
          {
            stack: applyFirstLineIndent(
              payload.substansiContent?.metodeNodes?.length > 0
                ? payload.substansiContent.metodeNodes
                : [{ text: "-", style: "bodyText" }],
            ),
            margin: [8, 0, 8, 0],
          },
        ],

        // ── JADWAL KEGIATAN ─────────────────────────────────────────────
        buildSectionLabelRow("JADWAL KEGIATAN"),
        [
          {
            stack: [
              buildJadwalTimelineTable(
                payload.jadwalList || [],
                payload.tahunDokumen,
              ),
            ],
            margin: [0, 0, 0, 0],
          },
        ],

        // ── LUARAN DAN TARGET CAPAIAN ───────────────────────────────────
        buildSectionLabelRow("LUARAN DAN TARGET CAPAIAN"),
        [
          {
            table: {
              widths: W_LUARAN,
              body: [
                [
                  toTableHeaderCell("No"),
                  toTableHeaderCell("Jenis Luaran"),
                  toTableHeaderCell("Target Capaian"),
                  toTableHeaderCell("IKU Terkait"),
                  toTableHeaderCell("Target Capaian IKU"),
                ],
                ...buildLuaranRows(payload.luaran),
              ],
              dontBreakRows: true,
            },
            margin: [0, 0, 0, 0],
          },
        ],

        // ── TIM PELAKSANA ───────────────────────────────────────────────
        buildSectionLabelRow("TIM PELAKSANA"),
        [
          {
            table: {
              widths: W_TIM,
              body: [
                [
                  toTableHeaderCell("No"),
                  toTableHeaderCell("Institusi"),
                  toTableHeaderCell("Nama"),
                  toTableHeaderCell("Posisi dalam Tim"),
                  toTableHeaderCell("Tugas"),
                ],
                ...buildTimRows(payload),
              ],
              dontBreakRows: true,
            },
            margin: [0, 0, 0, 0],
          },
        ],

        // ── DAFTAR PUSTAKA ──────────────────────────────────────────────
        buildSectionLabelRow("DAFTAR PUSTAKA"),
        [
          {
            stack:
              payload.substansiContent?.daftarPustakaNodes?.length > 0
                ? payload.substansiContent.daftarPustakaNodes
                : [{ text: "-", style: "bodyText" }],
            margin: [8, 0, 8, 0],
          },
        ],

        // ── GAMBARAN IPTEKS ─────────────────────────────────────────────
        buildSectionLabelRow("GAMBARAN IPTEKS"),
        [
          {
            stack: applyFirstLineIndent(
              payload.substansiContent?.gambaranIpteksNodes?.length > 0
                ? payload.substansiContent.gambaranIpteksNodes
                : [{ text: "-", style: "bodyText" }],
            ),
            margin: [8, 0, 8, 0],
          },
        ],

        // ── PETA LOKASI MITRA ───────────────────────────────────────────
        buildSectionLabelRow("PETA LOKASI MITRA"),
        [
          {
            stack: payload.substansiContent?.petaLokasiMitraDataUrl
              ? [
                  {
                    image: payload.substansiContent.petaLokasiMitraDataUrl,
                    width: 300,
                    alignment: "center",
                    margin: [0, 4, 0, 4],
                  },
                ]
              : payload.substansiContent?.petaLokasiMitraExternalUrl
                ? [
                    {
                      text: payload.substansiContent.petaLokasiMitraExternalUrl,
                      link: payload.substansiContent.petaLokasiMitraExternalUrl,
                      color: "#2563EB",
                      decoration: "underline",
                      style: "bodyText",
                    },
                  ]
                : [{ text: "-", style: "bodyText" }],
            margin: [8, 0, 8, 0],
          },
        ],

        // ── RINCIAN ANGGARAN BIAYA (RAB) ────────────────────────────────
        buildSectionLabelRow("RINCIAN ANGGARAN BIAYA (RAB)"),
        [
          {
            stack: [
              {
                text: "Penggunaan anggaran bisa mencakup 4 hal yaitu Teknologi dan Inovasi, biaya pelatihan, perjalanan, dan lain-lain (biaya publikasi atau lainnya). Anggaran tidak diperbolehkan untuk honorarium.",
                fontSize: 8,
                italics: true,
                color: "#6B7280",
                margin: [8, 0, 8, 4],
              },
              {
                table: {
                  widths: W_RAB,
                  body: [
                    [
                      toTableHeaderCell("No"),
                      toTableHeaderCell("Uraian Belanja"),
                      toTableHeaderCell("Sat"),
                      toTableHeaderCell("Vol"),
                      toTableHeaderCell("Biaya Satuan"),
                      toTableHeaderCell("Pajak"),
                      toTableHeaderCell("Jumlah Dibayarkan"),
                    ],
                    ...buildRabRows(payload.rab),
                    [
                      {
                        text: "Total",
                        colSpan: 6,
                        style: "tableHeader",
                        alignment: "right",
                      },
                      {},
                      {},
                      {},
                      {},
                      {},
                      {
                        text: formatCurrencyIDR(totalJumlahDibayarkan),
                        style: "tableTextSmall",
                        alignment: "right",
                        bold: true,
                      },
                    ],
                  ],
                  dontBreakRows: true,
                },
              },
            ],
            margin: [0, 0, 0, 0],
          },
        ],
      ]) as any,

      buildTtdFooter(payload) as any,
    ],
  };
};
