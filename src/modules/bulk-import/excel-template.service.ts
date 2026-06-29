import ExcelJS from "exceljs";
import { Op } from "sequelize";
import { HttpError } from "../../core/errors/http-error.js";
import { BidangFokus } from "../bidangfokus/bidangfokus.model.js";
import { Output } from "../output/output.model.js";
import { Mahasiswa } from "../proposal/mahasiswa.model.js";
import { Prodi } from "../prodi/prodi.model.js";
import { Skema } from "../skema/skema.model.js";
import { TahunAkademik } from "../tahunakademik/tahunakademik.model.js";
import { User } from "../user/user.model.js";
import type { TemplateAnggotaItem } from "./bulk-import.schema.js";

export const SHEET_TEMPLATE = "Template_Usulan";
export const TEMPLATE_ANGGOTA_ROLE_HEADER = "Peran Template";

const DATA_ROW_START = 2;
const DATA_ROW_END = 201;
const TEMPLATE_PROTECTION_PASSWORD = "sipriti-import-template";
const VALID_DURATIONS = ["6 bulan", "1 tahun", "2 tahun", "3 tahun"];
const TIPE_USULAN_OPTIONS = ["Penelitian", "Pengabdian"] as const;

export const TEMPLATE_HEADERS = [
  { key: "kode_import", header: "Kode Import Usulan", width: 22 },
  { key: "tipe_usulan", header: "Tipe Usulan", width: 18 },
  { key: "judul", header: "Judul Usulan", width: 72 },
  { key: "bidang_fokus", header: "Bidang Fokus", width: 28 },
  { key: "skema", header: "Skema", width: 28 },
  { key: "sumber_dana", header: "Sumber Dana", width: 24 },
  { key: "jumlah_dana", header: "Jumlah Dana (Rp)", width: 22 },
  { key: "tahun_pelaksanaan", header: "Tahun Pelaksanaan", width: 20 },
  { key: "tahun_akademik", header: "Tahun Akademik", width: 24 },
  { key: "output", header: "Output", width: 34 },
  { key: "anggota", header: "Anggota", width: 48 },
  { key: "peran", header: "Peran", width: 16 },
  { key: "bidang_tugas", header: "Bidang Tugas", width: 34 },
] as const;

export const META_HEADERS = TEMPLATE_HEADERS;

interface GenerateTemplateOptions {
  allowedTipeUsulanOptions: string[];
  selectedAnggota: TemplateAnggotaItem[];
}

type MasterRow = ReadonlyArray<string>;
interface NormalizedTemplateAnggotaItem {
  noIdentitas: string;
  peran: "Ketua" | "Anggota";
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalize(value: unknown): string {
  return cellText(value).toLowerCase();
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function buildImportCode(date = new Date()): string {
  return [
    "IMP",
    `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`,
    `${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`,
  ].join("-");
}

export function buildTahunAkademikLabel(tahunAkademik: TahunAkademik): string {
  return `${tahunAkademik.tahunMulai}/${tahunAkademik.tahunSelesai} ${tahunAkademik.semester}`;
}

function normalizeAllowedTipeUsulanOptions(options: string[]): Array<"Penelitian" | "Pengabdian"> {
  const allowed = new Set(options.map((value) => normalize(value)));
  const resolved = TIPE_USULAN_OPTIONS.filter((tipe) => allowed.size === 0 || allowed.has(tipe.toLowerCase()));
  return resolved.length > 0 ? resolved : ["Penelitian", "Pengabdian"];
}

function isProposalTipe(value: string): value is "Penelitian" | "Pengabdian" {
  return value === "Penelitian" || value === "Pengabdian";
}

function sanitizeRows(rows: MasterRow[], valueIndex = 0): MasterRow[] {
  const seen = new Set<string>();
  const out: MasterRow[] = [];
  for (const row of rows) {
    const value = cellText(row[valueIndex]);
    const key = normalize(value);
    if (!value || key === "undefined" || key === "null" || seen.has(key)) continue;
    out.push(row);
    seen.add(key);
  }
  return out;
}

function normalizeSelectedAnggota(selectedAnggota: TemplateAnggotaItem[]): NormalizedTemplateAnggotaItem[] {
  const seen = new Set<string>();
  let ketuaCount = 0;
  const normalized: NormalizedTemplateAnggotaItem[] = [];
  for (const item of selectedAnggota) {
    const noIdentitas = String(item.noIdentitas).trim();
    if (seen.has(noIdentitas)) {
      throw HttpError.badRequest(`Anggota dengan identitas "${noIdentitas}" tidak boleh duplikat.`);
    }
    if (item.peran === "Ketua") ketuaCount += 1;
    seen.add(noIdentitas);
    normalized.push({ noIdentitas, peran: item.peran });
  }
  if (ketuaCount !== 1) throw HttpError.badRequest("Template wajib memiliki tepat 1 Ketua.");
  return normalized;
}

async function buildSelectedAnggotaRows(selectedAnggota: TemplateAnggotaItem[]): Promise<MasterRow[]> {
  const normalizedAnggota = normalizeSelectedAnggota(selectedAnggota);
  const identities = normalizedAnggota.map((item) => item.noIdentitas);
  const [users, mahasiswas] = await Promise.all([
    User.findAll({
      where: { nidn: { [Op.in]: identities } },
      attributes: ["nidn", "name", "institusi"],
      include: [{ model: Prodi, as: "prodiRelation", attributes: ["namaProdi"], required: false }],
      paranoid: false,
    }),
    Mahasiswa.findAll({
      where: { nrp: { [Op.in]: identities } },
      attributes: ["nrp", "nama"],
      include: [{ model: Prodi, as: "prodiRelasi", attributes: ["namaProdi"], required: false }],
    }),
  ]);
  const userMap = new Map(users.filter((user) => user.nidn).map((user) => [String(user.nidn), user]));
  const mahasiswaMap = new Map(mahasiswas.map((mahasiswa) => [mahasiswa.nrp, mahasiswa]));
  const rows: MasterRow[] = [];
  const missing: string[] = [];

  for (const selected of normalizedAnggota) {
    const user = userMap.get(selected.noIdentitas);
    if (user?.name) {
      rows.push([
        `${selected.noIdentitas} - ${user.name} - Dosen`,
        selected.noIdentitas,
        user.name,
        "Dosen",
        user.institusi ?? "",
        user.prodiRelation?.namaProdi ?? "",
        selected.peran,
      ]);
      continue;
    }

    const mahasiswa = mahasiswaMap.get(selected.noIdentitas);
    if (mahasiswa) {
      rows.push([
        `${selected.noIdentitas} - ${mahasiswa.nama} - Mahasiswa`,
        selected.noIdentitas,
        mahasiswa.nama,
        "Mahasiswa",
        "Institut Teknologi Indonesia",
        mahasiswa.prodiRelasi?.namaProdi ?? "",
        selected.peran,
      ]);
      continue;
    }
    missing.push(selected.noIdentitas);
  }
  if (missing.length > 0) {
    throw HttpError.badRequest(`Anggota tidak ditemukan di master dosen/mahasiswa: ${missing.join(", ")}`);
  }
  return sanitizeRows(rows);
}

function writeMasterSheet(workbook: ExcelJS.Workbook, name: string, headers: string[], rows: MasterRow[]): void {
  const sheet = workbook.addWorksheet(name);
  sheet.state = "veryHidden";
  sheet.addRow(headers);
  for (const row of rows) sheet.addRow([...row]);
}

function buildListFormula(sheetName: string, columnLetter: string, rowCount: number): string | null {
  if (rowCount <= 0) return null;
  return `'${sheetName}'!$${columnLetter}$2:$${columnLetter}$${rowCount + 1}`;
}

function setListValidation(cell: ExcelJS.Cell, formula: string | null): void {
  if (!formula) return;
  cell.dataValidation = { type: "list", allowBlank: true, formulae: [formula], showErrorMessage: true };
}

function unlock(cell: ExcelJS.Cell): void {
  cell.protection = { locked: false };
}

async function loadMasterRows(allowedTipeUsulanOptions: Array<"Penelitian" | "Pengabdian">, selectedAnggota: TemplateAnggotaItem[]) {
  const [bidangFokus, skemas, tahunAkademik, outputs, anggotaRows] = await Promise.all([
    BidangFokus.findAll({ attributes: ["namaBidang"], order: [["namaBidang", "ASC"]] }),
    Skema.findAll({ where: { isActive: true }, attributes: ["namaSkema", "tipe"], order: [["namaSkema", "ASC"]] }),
    TahunAkademik.findAll({ attributes: ["id", "tahunMulai", "tahunSelesai", "semester"], order: [["tahunMulai", "DESC"], ["semester", "ASC"]] }),
    Output.findAll({ attributes: ["id", "namaOutput"], order: [["namaOutput", "ASC"]] }),
    buildSelectedAnggotaRows(selectedAnggota),
  ]);

  const allowedTipe = new Set(allowedTipeUsulanOptions);
  return {
    bidangFokusRows: sanitizeRows(bidangFokus.map((item) => [item.namaBidang])),
    skemaRows: sanitizeRows(skemas.filter((skema) => isProposalTipe(skema.tipe) && allowedTipe.has(skema.tipe)).map((skema) => [skema.namaSkema, skema.tipe])),
    tahunAkademikRows: sanitizeRows(tahunAkademik.map((item) => [buildTahunAkademikLabel(item), item.id])),
    outputRows: sanitizeRows(outputs.map((item) => [item.namaOutput, item.id])),
    anggotaRows,
  };
}

export async function generateTemplateBuffer(options: GenerateTemplateOptions): Promise<Buffer> {
  const allowedTipeUsulanOptions = normalizeAllowedTipeUsulanOptions(options.allowedTipeUsulanOptions);
  const master = await loadMasterRows(allowedTipeUsulanOptions, options.selectedAnggota);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SIPRITI - Bulk Import";
  workbook.created = new Date();
  const importCode = buildImportCode(workbook.created);
  const sheet = workbook.addWorksheet(SHEET_TEMPLATE);
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  TEMPLATE_HEADERS.forEach((header, index) => {
    const column = index + 1;
    const cell = sheet.getRow(1).getCell(column);
    cell.value = header.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2B5797" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    sheet.getColumn(column).width = header.width;
  });

  writeMasterSheet(workbook, "Master_BidangFokus", ["Nama Bidang"], master.bidangFokusRows);
  writeMasterSheet(workbook, "Master_Skema", ["Nama Skema", "Tipe"], master.skemaRows);
  writeMasterSheet(workbook, "Master_TahunAkademik", ["Label", "ID"], master.tahunAkademikRows);
  writeMasterSheet(workbook, "Master_Output", ["Nama Output", "ID"], master.outputRows);
  writeMasterSheet(workbook, "Master_Anggota", ["Pilihan", "No Identitas", "Nama", "Status", "Institusi", "Prodi", TEMPLATE_ANGGOTA_ROLE_HEADER], master.anggotaRows);
  writeMasterSheet(workbook, "Master_Peran", ["Semua"], [["Ketua"], ["Anggota"]]);

  const bidangFormula = buildListFormula("Master_BidangFokus", "A", master.bidangFokusRows.length);
  const skemaFormula = buildListFormula("Master_Skema", "A", master.skemaRows.length);
  const tahunFormula = buildListFormula("Master_TahunAkademik", "A", master.tahunAkademikRows.length);
  const outputFormula = buildListFormula("Master_Output", "A", master.outputRows.length);
  const anggotaFormula = buildListFormula("Master_Anggota", "A", master.anggotaRows.length);
  const peranFormula = buildListFormula("Master_Peran", "A", 2);
  const tipeFormula = `"${allowedTipeUsulanOptions.join(",")}"`;

  for (let rowNumber = DATA_ROW_START; rowNumber <= DATA_ROW_END; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    if (rowNumber === DATA_ROW_START) row.getCell(1).value = importCode;
    for (let column = 2; column <= TEMPLATE_HEADERS.length; column += 1) {
      if (rowNumber === DATA_ROW_START || column >= 10) unlock(row.getCell(column));
    }
    row.getCell(2).dataValidation = { type: "list", allowBlank: true, formulae: [tipeFormula], showErrorMessage: true };
    setListValidation(row.getCell(4), bidangFormula);
    setListValidation(row.getCell(5), skemaFormula);
    row.getCell(7).numFmt = "#,##0";
    row.getCell(8).dataValidation = { type: "list", allowBlank: true, formulae: [`"${VALID_DURATIONS.join(",")}"`], showErrorMessage: true };
    setListValidation(row.getCell(9), tahunFormula);
    setListValidation(row.getCell(10), outputFormula);
    setListValidation(row.getCell(11), anggotaFormula);
    setListValidation(row.getCell(12), peranFormula);
    const anggota = master.anggotaRows[rowNumber - DATA_ROW_START];
    if (anggota) {
      row.getCell(11).value = anggota[0] ?? "";
      row.getCell(12).value = anggota[6] ?? "";
    }
  }

  await sheet.protect(TEMPLATE_PROTECTION_PASSWORD, {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertRows: false,
    deleteRows: false,
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
}
