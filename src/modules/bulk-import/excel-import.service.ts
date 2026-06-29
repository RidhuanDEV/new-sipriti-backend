import ExcelJS from "exceljs";
import { Op, type Transaction } from "sequelize";
import { sequelize } from "../../config/database.js";
import { HttpError } from "../../core/errors/http-error.js";
import { BidangFokus } from "../bidangfokus/bidangfokus.model.js";
import { Output } from "../output/output.model.js";
import { Mahasiswa } from "../proposal/mahasiswa.model.js";
import { proposalService } from "../proposal/proposal.service.js";
import type { ProposalMemberInput, ProposalMetaInput } from "../proposal/dto/proposal.dto.js";
import { Prodi } from "../prodi/prodi.model.js";
import { Skema } from "../skema/skema.model.js";
import { TahunAkademik } from "../tahunakademik/tahunakademik.model.js";
import { User } from "../user/user.model.js";
import { META_HEADERS, SHEET_TEMPLATE, TEMPLATE_ANGGOTA_ROLE_HEADER, buildTahunAkademikLabel } from "./excel-template.service.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { ProposalTipeUsulan } from "../proposal/proposal.model.js";

interface ParsedAnggota {
  noIdentitas: string;
  nama: string;
}

interface TemplateAnggotaExpected {
  displayValue: string;
  peran: "Ketua" | "Anggota";
}

interface TemplateAnggotaPolicy {
  valid: boolean;
  error: string;
  expectedByIdentity: Map<string, TemplateAnggotaExpected>;
  expectedIdentitySet: Set<string>;
}

interface MasterCache {
  bidangFokusSet: Set<string>;
  skemaMap: Map<string, { namaSkema: string; tipe: ProposalTipeUsulan }>;
  tahunAkademikMap: Map<string, string>;
  outputMap: Map<string, string>;
  anggotaIdentitySet: Set<string>;
  anggotaProdiMap: Map<string, string | null>;
}

interface DataRow {
  row: ExcelJS.Row;
  rowNumber: number;
}

interface ImportBlock {
  code: string;
  firstRowNumber: number;
  headerRow: ExcelJS.Row;
  rows: DataRow[];
}

interface ImportResultRow {
  row: number;
  judul: string;
  status: "success" | "failed";
  errors?: string[];
  proposalId?: string;
  tipeUsulan?: ProposalTipeUsulan;
}

interface ImportResult {
  totalRows: number;
  successCount: number;
  failedCount: number;
  results: ImportResultRow[];
}

interface ParsedBlock {
  errors: string[];
  meta: ProposalMetaInput;
  anggota: ProposalMemberInput[];
  tipeUsulan: ProposalTipeUsulan;
  rowNumber: number;
}

const VALID_DURATIONS = new Set(["6 bulan", "1 tahun", "2 tahun", "3 tahun"]);
const VALID_TIPE_USULAN = new Set<ProposalTipeUsulan>(["Penelitian", "Pengabdian"]);
const MAX_DATA_ROWS = 200;
const TEMPLATE_ERROR = "Unduh ulang template dan pilih anggota melalui aplikasi.";
const COLUMN = {
  KODE_IMPORT: 1,
  TIPE_USULAN: 2,
  JUDUL: 3,
  BIDANG_FOKUS: 4,
  SKEMA: 5,
  SUMBER_DANA: 6,
  JUMLAH_DANA: 7,
  TAHUN_PELAKSANAAN: 8,
  TAHUN_AKADEMIK: 9,
  OUTPUT: 10,
  ANGGOTA: 11,
  PERAN: 12,
  BIDANG_TUGAS: 13,
} as const;
const EXPECTED_HEADERS = META_HEADERS.map((header) => header.header);

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("result" in value) return String(value.result ?? "").trim();
    if ("text" in value) return String(value.text ?? "").trim();
  }
  return String(value).trim();
}

function cellToNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const parsed = Number(cellToString(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalize(value: unknown): string {
  return cellToString(value).toLowerCase();
}

function isProposalTipeUsulan(value: string): value is ProposalTipeUsulan {
  return value === "Penelitian" || value === "Pengabdian";
}

function toExcelArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(arrayBuffer).set(buffer);
  return arrayBuffer;
}

function rowValue(row: ExcelJS.Row, columnNumber: number): unknown {
  return row.getCell(columnNumber).value;
}

function validateTemplateHeaders(sheet: ExcelJS.Worksheet): string[] {
  const errors: string[] = [];
  const headerRow = sheet.getRow(1);
  EXPECTED_HEADERS.forEach((expected, index) => {
    const columnNumber = index + 1;
    const actual = cellToString(headerRow.getCell(columnNumber).value);
    if (actual !== expected) {
      errors.push(`Kolom ${columnNumber}: header harus "${expected}", ditemukan "${actual || "(kosong)"}`);
    }
  });
  headerRow.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    if (columnNumber <= EXPECTED_HEADERS.length) return;
    const actual = cellToString(cell.value);
    if (actual) errors.push(`Kolom ${columnNumber}: header tambahan "${actual}" tidak diperbolehkan`);
  });
  return errors;
}

function rowHasImportData(row: ExcelJS.Row): boolean {
  for (let column = 1; column <= EXPECTED_HEADERS.length; column += 1) {
    if (cellToString(rowValue(row, column))) return true;
  }
  return false;
}

function buildFailedResult(totalRows: number, results: ImportResultRow[]): ImportResult {
  return { totalRows, successCount: 0, failedCount: results.length, results };
}

function parseAnggotaValue(value: unknown): ParsedAnggota {
  const display = cellToString(value);
  if (!display) return { noIdentitas: "", nama: "" };
  const [identity, name = ""] = display.split(" - ");
  return { noIdentitas: cellToString(identity), nama: cellToString(name) };
}

function buildTemplateAnggotaPolicy(workbook: ExcelJS.Workbook): TemplateAnggotaPolicy {
  const sheet = workbook.getWorksheet("Master_Anggota");
  if (!sheet) return { valid: false, error: TEMPLATE_ERROR, expectedByIdentity: new Map(), expectedIdentitySet: new Set() };
  const roleHeader = cellToString(sheet.getRow(1).getCell(7).value);
  if (roleHeader !== TEMPLATE_ANGGOTA_ROLE_HEADER) {
    return { valid: false, error: TEMPLATE_ERROR, expectedByIdentity: new Map(), expectedIdentitySet: new Set() };
  }
  const expectedByIdentity = new Map<string, TemplateAnggotaExpected>();
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const displayValue = cellToString(row.getCell(1).value);
    const identity = cellToString(row.getCell(2).value);
    const peran = cellToString(row.getCell(7).value);
    if (!displayValue || !identity || (peran !== "Ketua" && peran !== "Anggota")) return;
    expectedByIdentity.set(identity, { displayValue, peran });
  });
  return {
    valid: expectedByIdentity.size > 0,
    error: TEMPLATE_ERROR,
    expectedByIdentity,
    expectedIdentitySet: new Set(expectedByIdentity.keys()),
  };
}

function hasContinuationMetadata(row: ExcelJS.Row): boolean {
  for (let column = COLUMN.TIPE_USULAN; column <= COLUMN.TAHUN_AKADEMIK; column += 1) {
    if (cellToString(rowValue(row, column))) return true;
  }
  return false;
}

function parseImportBlocks(dataRows: DataRow[]): { blocks: ImportBlock[]; results: ImportResultRow[] } {
  const blocks: ImportBlock[] = [];
  const results: ImportResultRow[] = [];
  const completedCodes = new Set<string>();
  let currentBlock: ImportBlock | null = null;

  for (const dataRow of dataRows) {
    const code = cellToString(rowValue(dataRow.row, COLUMN.KODE_IMPORT));
    const normalizedCode = normalize(code);
    if (code) {
      if (currentBlock && normalize(currentBlock.code) === normalizedCode) {
        currentBlock.rows.push(dataRow);
        continue;
      }
      if (completedCodes.has(normalizedCode)) {
        results.push({
          row: dataRow.rowNumber,
          judul: "(kode import duplikat)",
          status: "failed",
          errors: [`Kode Import Usulan "${code}" muncul lagi setelah blok lain. Gunakan satu blok berurutan untuk setiap kode.`],
        });
        currentBlock = null;
        continue;
      }
      if (currentBlock) completedCodes.add(normalize(currentBlock.code));
      currentBlock = { code, firstRowNumber: dataRow.rowNumber, headerRow: dataRow.row, rows: [dataRow] };
      blocks.push(currentBlock);
      continue;
    }
    if (!currentBlock) {
      results.push({
        row: dataRow.rowNumber,
        judul: "(kode import kosong)",
        status: "failed",
        errors: ["Baris lanjutan tidak memiliki Kode Import Usulan. Isi kode pada baris pertama setiap usulan."],
      });
      continue;
    }
    currentBlock.rows.push(dataRow);
  }
  return { blocks, results };
}

async function buildMasterCache(): Promise<MasterCache> {
  const [bidangFokus, skemas, tahunAkademik, outputs, users, mahasiswas] = await Promise.all([
    BidangFokus.findAll({ attributes: ["namaBidang"] }),
    Skema.findAll({ where: { isActive: true }, attributes: ["namaSkema", "tipe"] }),
    TahunAkademik.findAll({ attributes: ["id", "tahunMulai", "tahunSelesai", "semester"] }),
    Output.findAll({ attributes: ["id", "namaOutput"] }),
    User.findAll({ attributes: ["nidn", "prodiKode"], paranoid: false }),
    Mahasiswa.findAll({ attributes: ["nrp", "prodi_kode"] }),
  ]);
  const anggotaIdentitySet = new Set<string>();
  const anggotaProdiMap = new Map<string, string | null>();
  for (const user of users) {
    if (!user.nidn) continue;
    anggotaIdentitySet.add(user.nidn);
    anggotaProdiMap.set(user.nidn, user.prodiKode ?? null);
  }
  for (const mahasiswa of mahasiswas) {
    anggotaIdentitySet.add(mahasiswa.nrp);
    anggotaProdiMap.set(mahasiswa.nrp, mahasiswa.prodi_kode ?? null);
  }
  const skemaMap = new Map<string, { namaSkema: string; tipe: ProposalTipeUsulan }>();
  for (const skema of skemas) {
    if (!isProposalTipeUsulan(skema.tipe)) continue;
    skemaMap.set(normalize(skema.namaSkema), { namaSkema: skema.namaSkema, tipe: skema.tipe });
  }

  return {
    bidangFokusSet: new Set(bidangFokus.map((item) => normalize(item.namaBidang)).filter(Boolean)),
    skemaMap,
    tahunAkademikMap: new Map(tahunAkademik.map((item) => [normalize(buildTahunAkademikLabel(item)), item.id])),
    outputMap: new Map(outputs.map((item) => [normalize(item.namaOutput), item.id])),
    anggotaIdentitySet,
    anggotaProdiMap,
  };
}

function validateTemplateMember(
  errors: string[],
  rowNumber: number,
  anggotaValue: string,
  noIdentitas: string,
  peran: string,
  policy: TemplateAnggotaPolicy,
): void {
  if (!policy.valid) {
    errors.push(`Row ${rowNumber}: ${policy.error}`);
    return;
  }
  const expected = policy.expectedByIdentity.get(noIdentitas);
  if (!expected || expected.displayValue !== anggotaValue || expected.peran !== peran) {
    errors.push(`Row ${rowNumber}: ${policy.error}`);
  }
}

function validateBlock(
  block: ImportBlock,
  masterCache: MasterCache,
  userPermissions: Set<string>,
  templateAnggotaPolicy: TemplateAnggotaPolicy,
): ParsedBlock {
  const errors: string[] = [];
  const tipeUsulanValue = cellToString(rowValue(block.headerRow, COLUMN.TIPE_USULAN));
  const judul = cellToString(rowValue(block.headerRow, COLUMN.JUDUL));
  const bidangFokus = cellToString(rowValue(block.headerRow, COLUMN.BIDANG_FOKUS));
  const skemaLabel = cellToString(rowValue(block.headerRow, COLUMN.SKEMA));
  const sumberDana = cellToString(rowValue(block.headerRow, COLUMN.SUMBER_DANA));
  const jumlahDana = cellToNumber(rowValue(block.headerRow, COLUMN.JUMLAH_DANA));
  const tahunPelaksanaan = normalize(rowValue(block.headerRow, COLUMN.TAHUN_PELAKSANAAN));
  const tahunAkademikLabel = cellToString(rowValue(block.headerRow, COLUMN.TAHUN_AKADEMIK));
  const tipeUsulan: ProposalTipeUsulan = isProposalTipeUsulan(tipeUsulanValue) ? tipeUsulanValue : "Penelitian";

  if (!isProposalTipeUsulan(tipeUsulanValue)) {
    errors.push("Tipe usulan wajib dipilih (Penelitian atau Pengabdian)");
  } else if (!userPermissions.has(tipeUsulanValue === "Penelitian" ? "manage_penelitian" : "manage_pengabdian")) {
    errors.push(`Tidak memiliki permission ${tipeUsulanValue === "Penelitian" ? "manage_penelitian" : "manage_pengabdian"} untuk import ${tipeUsulanValue}`);
  }
  if (!judul || judul.length < 10) errors.push("Judul wajib diisi minimal 10 karakter");
  if (judul.length > 1000) errors.push("Judul maksimal 1000 karakter");
  if (!bidangFokus || !masterCache.bidangFokusSet.has(normalize(bidangFokus))) errors.push(`Bidang fokus "${bidangFokus}" tidak ditemukan di master data`);
  const skema = masterCache.skemaMap.get(normalize(skemaLabel));
  if (!skema) errors.push(`Skema "${skemaLabel}" tidak ditemukan di master data`);
  if (skema && skema.tipe !== tipeUsulan) errors.push(`Skema "${skemaLabel}" hanya untuk ${skema.tipe}, tidak cocok dengan tipe ${tipeUsulan}`);
  if (!sumberDana) errors.push("Sumber dana wajib diisi");
  if (!jumlahDana || jumlahDana <= 0) errors.push("Jumlah dana harus lebih dari 0");
  if (!VALID_DURATIONS.has(tahunPelaksanaan)) errors.push("Tahun pelaksanaan harus dipilih dari opsi yang tersedia (6 bulan, 1 tahun, 2 tahun, 3 tahun)");
  const tahunAkademikId = tahunAkademikLabel ? masterCache.tahunAkademikMap.get(normalize(tahunAkademikLabel)) ?? null : null;
  if (tahunAkademikLabel && !tahunAkademikId) errors.push(`Tahun akademik "${tahunAkademikLabel}" tidak ditemukan di master data`);

  const outputIds: string[] = [];
  const seenOutputIds = new Set<string>();
  const anggota: ProposalMemberInput[] = [];
  const seenAnggota = new Set<string>();

  for (const [index, dataRow] of block.rows.entries()) {
    if (index > 0 && hasContinuationMetadata(dataRow.row)) {
      errors.push(`Row ${dataRow.rowNumber}: metadata proposal hanya boleh diisi pada baris pertama blok`);
    }
    const outputLabel = cellToString(rowValue(dataRow.row, COLUMN.OUTPUT));
    if (outputLabel) {
      const outputId = masterCache.outputMap.get(normalize(outputLabel));
      if (!outputId) errors.push(`Row ${dataRow.rowNumber}: output "${outputLabel}" tidak ditemukan di master data`);
      else if (seenOutputIds.has(outputId)) errors.push(`Row ${dataRow.rowNumber}: output "${outputLabel}" tidak boleh duplikat dalam satu usulan`);
      else {
        outputIds.push(outputId);
        seenOutputIds.add(outputId);
      }
    }
    const anggotaValue = cellToString(rowValue(dataRow.row, COLUMN.ANGGOTA));
    const peranValue = cellToString(rowValue(dataRow.row, COLUMN.PERAN));
    const bidangTugas = cellToString(rowValue(dataRow.row, COLUMN.BIDANG_TUGAS));
    if (!anggotaValue && !peranValue && !bidangTugas) continue;
    const parsedAnggota = parseAnggotaValue(anggotaValue);
    validateTemplateMember(errors, dataRow.rowNumber, anggotaValue, parsedAnggota.noIdentitas, peranValue, templateAnggotaPolicy);
    if (!masterCache.anggotaIdentitySet.has(parsedAnggota.noIdentitas)) errors.push(`Row ${dataRow.rowNumber}: anggota "${anggotaValue}" tidak ditemukan di master dosen/mahasiswa`);
    if (peranValue !== "Ketua" && peranValue !== "Anggota") errors.push(`Row ${dataRow.rowNumber}: peran harus Ketua atau Anggota`);
    if (!bidangTugas) errors.push(`Row ${dataRow.rowNumber}: bidang tugas wajib diisi`);
    if (seenAnggota.has(parsedAnggota.noIdentitas)) {
      errors.push(`Row ${dataRow.rowNumber}: anggota "${parsedAnggota.noIdentitas}" tidak boleh duplikat dalam satu usulan`);
      continue;
    }
    seenAnggota.add(parsedAnggota.noIdentitas);
    anggota.push({
      noIdentitas: parsedAnggota.noIdentitas,
      nama: parsedAnggota.nama,
      peran: peranValue === "Ketua" ? "Ketua" : "Anggota",
      bidang_tugas: bidangTugas,
    });
  }

  if (outputIds.length === 0) errors.push("Minimal 1 target luaran (output) harus dipilih");
  if (anggota.length === 0) errors.push("Tim pengusul wajib diisi minimal 1 anggota");
  const ketua = anggota.filter((item) => item.peran === "Ketua");
  if (anggota.length > 0 && ketua.length === 0) errors.push("Harus ada tepat 1 anggota dengan peran Ketua");
  if (ketua.length > 1) errors.push("Hanya boleh ada 1 anggota dengan peran Ketua");
  const ketuaIdentity = ketua[0]?.noIdentitas ?? null;
  const prodiPengusul = ketuaIdentity ? masterCache.anggotaProdiMap.get(ketuaIdentity) ?? null : null;
  if (ketua.length === 1 && !prodiPengusul) errors.push(`Program studi Ketua Usulan (${ketua[0]?.nama || ketuaIdentity || "tidak dikenal"}) tidak valid atau tidak ditemukan di database.`);

  return {
    errors,
    meta: {
      judul,
      bidang_fokus: bidangFokus,
      skema: skema?.namaSkema ?? skemaLabel,
      sumber_dana: sumberDana,
      jumlah_dana: jumlahDana,
      tahun_pelaksanaan: tahunPelaksanaan,
      tahun_akademik_id: tahunAkademikId,
      prodi_pengusul: prodiPengusul ?? undefined,
      output_ids: outputIds,
    },
    anggota,
    tipeUsulan,
    rowNumber: block.firstRowNumber,
  };
}

async function createImportedProposals(
  parsedBlocks: ParsedBlock[],
  user: AuthenticatedUserContext,
  requestId: string | undefined,
  transaction: Transaction,
): Promise<ImportResultRow[]> {
  const results: ImportResultRow[] = [];
  for (const parsed of parsedBlocks) {
    const created = await proposalService.createWorkflowProposal(
      parsed.tipeUsulan,
      { meta: parsed.meta, anggota: parsed.anggota, importOptions: { allowCreatorOutsideTeam: true } },
      user,
      { requestId },
      transaction,
    );
    results.push({
      row: parsed.rowNumber,
      judul: parsed.meta.judul ?? "",
      status: "success",
      proposalId: created.id,
      tipeUsulan: parsed.tipeUsulan,
    });
  }
  return results;
}

export async function processImport(buffer: Buffer, user: AuthenticatedUserContext, requestId: string | undefined): Promise<ImportResult> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(toExcelArrayBuffer(buffer));
  } catch {
    throw HttpError.badRequest("File Excel tidak valid atau rusak");
  }
  const templateSheet = workbook.getWorksheet(SHEET_TEMPLATE);
  if (!templateSheet) throw HttpError.badRequest(`Sheet "${SHEET_TEMPLATE}" tidak ditemukan. Pastikan menggunakan template resmi.`);
  const policy = buildTemplateAnggotaPolicy(workbook);
  const headerErrors = validateTemplateHeaders(templateSheet);
  if (headerErrors.length > 0) {
    return buildFailedResult(0, [{ row: 1, judul: "(header template)", status: "failed", errors: headerErrors }]);
  }
  const dataRows: DataRow[] = [];
  templateSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    if (rowHasImportData(row)) dataRows.push({ row, rowNumber });
  });
  if (dataRows.length === 0) throw HttpError.badRequest("Template tidak memiliki data. Isi minimal 1 baris data.");
  if (dataRows.length > MAX_DATA_ROWS) {
    return buildFailedResult(dataRows.length, [{ row: MAX_DATA_ROWS + 2, judul: "(batas baris)", status: "failed", errors: [`Jumlah data maksimal ${MAX_DATA_ROWS} baris per import. File ini berisi ${dataRows.length} baris data.`] }]);
  }
  const { blocks, results: blockParseResults } = parseImportBlocks(dataRows);
  if (blockParseResults.length > 0) return buildFailedResult(dataRows.length, blockParseResults);

  const masterCache = await buildMasterCache();
  const userPermissions = new Set(user.permissions);
  const parsedBlocks: ParsedBlock[] = [];
  const validationResults: ImportResultRow[] = [];
  for (const block of blocks) {
    const parsed = validateBlock(block, masterCache, userPermissions, policy);
    if (parsed.errors.length > 0) {
      validationResults.push({ row: parsed.rowNumber, judul: parsed.meta.judul ?? block.code, status: "failed", errors: parsed.errors });
    } else {
      parsedBlocks.push(parsed);
    }
  }
  if (policy.valid && validationResults.length === 0) {
    const actualIdentities = new Set(parsedBlocks.flatMap((block) => block.anggota.map((anggota) => anggota.noIdentitas ?? "")));
    for (const expectedIdentity of policy.expectedIdentitySet) {
      if (!actualIdentities.has(expectedIdentity)) {
        validationResults.push({
          row: 2,
          judul: blocks[0]?.code ?? "(anggota template)",
          status: "failed",
          errors: [`Anggota "${expectedIdentity}" dari template wajib tetap ada. Unduh ulang template dan pilih anggota melalui aplikasi jika ingin mengganti tim.`],
        });
      }
    }
  }
  if (validationResults.length > 0) return buildFailedResult(dataRows.length, validationResults);

  try {
    const results = await sequelize.transaction((transaction) =>
      createImportedProposals(parsedBlocks, user, requestId, transaction),
    );
    return { totalRows: dataRows.length, successCount: results.length, failedCount: 0, results };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat membuat usulan";
    return buildFailedResult(dataRows.length, [{
      row: 0,
      judul: "(transaksi dibatalkan)",
      status: "failed",
      errors: [`${message}. Semua data pada file ini dibatalkan dan tidak ada yang tersimpan.`],
    }]);
  }
}
