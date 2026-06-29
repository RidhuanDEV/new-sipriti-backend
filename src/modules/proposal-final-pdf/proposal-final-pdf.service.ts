import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import PdfPrinter from "pdfmake";
import { AuditAction } from "../../constants/audit.constants.js";
import { PROPOSAL_FINAL_PDF_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { HttpError } from "../../core/errors/http-error.js";
import { getUploadDir, toPublicUploadUrl } from "../../core/storage/storage-paths.js";
import { logger } from "../../core/logger/logger.js";
import { Output } from "../output/output.model.js";
import { Prodi } from "../prodi/prodi.model.js";
import { TahunAkademik } from "../tahunakademik/tahunakademik.model.js";
import { JadwalBulanan } from "../jadwal-proposal/jadwal-bulanan.model.js";
import { JadwalProposal } from "../jadwal-proposal/jadwal-proposal.model.js";
import { LuaranProposal } from "../luaran-proposal/luaran-proposal.model.js";
import { PengabdianProposal } from "../pengabdian-proposal/pengabdian-proposal.model.js";
import { PenelitianProposal } from "../penelitian-proposal/penelitian-proposal.model.js";
import { LaporanUsulan } from "../proposal/laporan-usulan.model.js";
import { MemberProposal } from "../proposal/member-proposal.model.js";
import { HakiProposal } from "../proposal/proposal.model.js";
import { RABProposal } from "../rab-proposal/rab-proposal.model.js";
import { Skema } from "../skema/skema.model.js";
import { User } from "../user/user.model.js";
import { assertCanViewProposal } from "../proposal/policies/proposal.policy.js";
import {
  getActiveOfficialSignatureByKeyAndProdi,
  resolveOfficialSignatureFilePath,
} from "../official-signatures/official-signatures.service.js";
import {
  parseRichTextToNodes,
  stripHtmlToPlainText,
  fetchImageAsBase64,
  ensurePdfmakeSupportedImage,
} from "../../services/richtext-parser.service.js";
import { isFinalReportValidatedForProposal } from "../../utils/final-report-eligibility.util.js";
import { buildPenelitianDocDefinition } from "./pdf-builders/penelitian.builder.js";
import { buildPengabdianDocDefinition } from "./pdf-builders/pengabdian.builder.js";
import type { TDocumentDefinitions } from "pdfmake/interfaces.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";

// ──────────────────────────────────────────────
// Constants & Configuration
// ──────────────────────────────────────────────

const REPORT_SCOPE_TIPE = Object.freeze({
  UMUM: "umum",
  HIBAH_INTERNAL: "hibah_internal",
});

const PDF_ARCHIVE_MODE = Object.freeze({
  STREAM_ONLY: "stream_only",
  STREAM_AND_SERVER: "stream_and_server",
});

const ENV_GENERATE_PDF_STREAM_AND_SERVER = "GENERATE_PDF_STREAM_AND_SERVER";

const NOTO_FONT_ROOT = path.resolve(process.cwd(), "fonts", "noto", "static");
const TINOS_FONT_ROOT = path.resolve(process.cwd(), "fonts", "Tinos");

const PDF_FONT_PATH = Object.freeze({
  noto: {
    normal: path.join(NOTO_FONT_ROOT, "NotoSans-Regular.ttf"),
    bold: path.join(NOTO_FONT_ROOT, "NotoSans-Bold.ttf"),
    italics: path.join(NOTO_FONT_ROOT, "NotoSans-Italic.ttf"),
    bolditalics: path.join(NOTO_FONT_ROOT, "NotoSans-BoldItalic.ttf"),
  },
  tinos: {
    normal: path.join(TINOS_FONT_ROOT, "Tinos-Regular.ttf"),
    bold: path.join(TINOS_FONT_ROOT, "Tinos-Bold.ttf"),
    italics: path.join(TINOS_FONT_ROOT, "Tinos-Italic.ttf"),
    bolditalics: path.join(TINOS_FONT_ROOT, "Tinos-BoldItalic.ttf"),
  },
});

const PDF_ARCHIVE_UPLOAD_SUB_DIR = "proposal-final-pdf";

const PDF_TEMPLATE_LOGO_PATH = path.resolve(
  process.cwd(),
  "../SIPRITI/public/assets/logoiti-rm.png",
);

const IMAGE_MIME_BY_EXT: Record<string, string> = Object.freeze({
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
});

const PDF_SIGNATURE_KEYS = Object.freeze({
  MENGETAHUI: "mengetahui",
  KETUA_PENGUSUL: "ketua_pengusul",
});

let cachedLogoDataUrl: string | null | undefined;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const isExternalHttpUrl = (value: unknown): boolean => {
  if (!value || typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const parseBooleanEnv = (
  value: string | undefined,
  defaultValue: boolean,
): boolean => {
  if (value === undefined || value.trim() === "") return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return defaultValue;
};

const pdfArchiveEnabled = (): boolean => {
  return parseBooleanEnv(
    process.env[ENV_GENERATE_PDF_STREAM_AND_SERVER],
    true,
  );
};

const ensurePdfFontsReady = (): void => {
  const allPaths = [
    ...Object.values(PDF_FONT_PATH.noto),
    ...Object.values(PDF_FONT_PATH.tinos),
  ];
  allPaths.forEach((fontPath) => {
    if (!fs.existsSync(fontPath)) {
      throw HttpError.badRequest(
        `File font PDF tidak ditemukan: ${path.basename(fontPath)}`,
      );
    }
  });
};

const getPdfTemplateLogoDataUrl = (): string | null => {
  if (cachedLogoDataUrl !== undefined) return cachedLogoDataUrl;

  if (!fs.existsSync(PDF_TEMPLATE_LOGO_PATH)) {
    cachedLogoDataUrl = null;
    return cachedLogoDataUrl;
  }

  const fileExt = path.extname(PDF_TEMPLATE_LOGO_PATH).toLowerCase();
  const mimeType = IMAGE_MIME_BY_EXT[fileExt];

  if (!mimeType) {
    cachedLogoDataUrl = null;
    return cachedLogoDataUrl;
  }

  try {
    const imageBuffer = fs.readFileSync(PDF_TEMPLATE_LOGO_PATH);
    cachedLogoDataUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
  } catch {
    cachedLogoDataUrl = null;
  }
  return cachedLogoDataUrl;
};

const loadActivePdfSignatureSlot = async (
  signatureKey: string,
  kodeProdi: string | null,
): Promise<{
  signerName: string;
  signerNidn: string;
  signatureImageDataUrl: string;
} | null> => {
  if (!kodeProdi) {
    logger.warn(
      `[PDF] kode_prodi tidak tersedia untuk signature key '${signatureKey}'. Signature tidak akan ditampilkan.`,
    );
    return null;
  }

  try {
    const activeSignature = await getActiveOfficialSignatureByKeyAndProdi(
      signatureKey,
      kodeProdi,
    );

    if (!activeSignature?.stored_filename) return null;

    const filePath = resolveOfficialSignatureFilePath(
      activeSignature.stored_filename,
    );
    const signatureBuffer = await fsp.readFile(filePath);
    const validImage = await ensurePdfmakeSupportedImage(signatureBuffer);

    if (!validImage) {
      logger.warn(
        `[PDF] Signature image for '${signatureKey}' in prodi '${kodeProdi}' is invalid or corrupted. Skipping signature.`,
      );
      return null;
    }

    return {
      signerName: activeSignature.signer_name || "-",
      signerNidn: activeSignature.signer_nidn || "-",
      signatureImageDataUrl: `data:${validImage.mimeType};base64,${validImage.buffer.toString("base64")}`,
    };
  } catch (error) {
    logger.error(
      error,
      `Gagal memuat signature aktif untuk key '${signatureKey}' prodi '${kodeProdi}'`,
    );
    return null;
  }
};

const resolveSignatureDate = async (
  proposalId: string,
  fallbackDateSource: Date | string | null | undefined,
): Promise<string> => {
  try {
    const latestValidated = await LaporanUsulan.findOne({
      where: {
        haki_proposal_id: proposalId,
        status_laporan: "Sesuai",
      },
      order: [["updatedAt", "DESC"]],
      attributes: ["updatedAt"],
      raw: true,
    });

    const dateSource =
      (latestValidated as any)?.updatedAt ?? fallbackDateSource ?? new Date();

    return new Date(dateSource).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch (err) {
    logger.error(err, "Gagal mengambil tanggal dari laporan_usulans");
    return new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }
};

const formatTahunAkademikLabel = (row: any): string => {
  if (!row) return "-";
  const sem = row.semester ? String(row.semester).trim() : "";
  const mulai = row.tahun_mulai ?? row.tahunMulai ?? "";
  const selesai = row.tahun_selesai ?? row.tahunSelesai ?? "";
  return `${sem} ${mulai}/${selesai}`.trim() || "-";
};

const buildPdfArchiveFileName = (proposalId: string): string => {
  const timestamp = new Date().toISOString().replace(/[.:]/g, "-");
  return `proposal-final-hibah-internal-${proposalId}-${timestamp}.pdf`;
};

const persistGeneratedPdfArchive = async (
  pdfBuffer: Buffer,
  proposalId: string,
): Promise<{ absolutePath: string; publicUrl: string; fileName: string }> => {
  const uploadDir = getUploadDir(PDF_ARCHIVE_UPLOAD_SUB_DIR);
  await fsp.mkdir(uploadDir, { recursive: true });

  const fileName = buildPdfArchiveFileName(proposalId);
  const absolutePath = path.join(uploadDir, fileName);

  await fsp.writeFile(absolutePath, pdfBuffer);

  return {
    absolutePath,
    fileName,
    publicUrl: toPublicUploadUrl(PDF_ARCHIVE_UPLOAD_SUB_DIR, fileName),
  };
};

const createPdfBuffer = async (
  docDefinition: TDocumentDefinitions,
): Promise<Buffer> => {
  const printer = new PdfPrinter({
    NotoSans: {
      normal: PDF_FONT_PATH.noto.normal,
      bold: PDF_FONT_PATH.noto.bold,
      italics: PDF_FONT_PATH.noto.italics,
      bolditalics: PDF_FONT_PATH.noto.bolditalics,
    },
    Tinos: {
      normal: PDF_FONT_PATH.tinos.normal,
      bold: PDF_FONT_PATH.tinos.bold,
      italics: PDF_FONT_PATH.tinos.italics,
      bolditalics: PDF_FONT_PATH.tinos.bolditalics,
    },
  });

  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
    pdfDoc.on("error", reject);
    pdfDoc.end();
  });
};

const buildFinalProposalPdfDocDefinition = (
  payload: any,
): TDocumentDefinitions => {
  if (payload.proposalType === "Pengabdian") {
    return buildPengabdianDocDefinition(payload);
  }
  return buildPenelitianDocDefinition(payload);
};

// ──────────────────────────────────────────────
// Main Service Implementation
// ──────────────────────────────────────────────

export interface FinalPdfResult {
  buffer: Buffer;
  fileName: string;
}

export class ProposalFinalPdfService {
  async generateUserPdf(
    id: string,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<FinalPdfResult> {
    const proposal = await this.loadProposal(id);
    await assertCanViewProposal(proposal.id, user);
    return this.generate(proposal, user, { isAdmin: false }, requestId);
  }

  async generateAdminPdf(
    id: string,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<FinalPdfResult> {
    const proposal = await this.loadProposal(id);
    return this.generate(proposal, user, { isAdmin: true }, requestId);
  }

  private async loadProposal(id: string): Promise<HakiProposal> {
    const proposal = await HakiProposal.findByPk(id, {
      include: [
        {
          model: MemberProposal,
          as: "members",
          include: [
            {
              model: User,
              as: "user",
              attributes: [
                "id",
                "name",
                "email",
                "nidn",
                "institusi",
                "prodiKode",
              ],
              include: [
                {
                  model: Prodi,
                  as: "prodiRelation",
                  attributes: ["namaProdi", "kodeProdi"],
                  required: false,
                },
              ],
            },
          ],
        },
        { model: LuaranProposal, as: "luaran" },
        { model: RABProposal, as: "rab" },
        { model: PenelitianProposal, as: "substansiPenelitian" },
        { model: PengabdianProposal, as: "substansiPengabdian" },
        {
          model: Skema,
          as: "skema",
          attributes: ["id", "namaSkema"],
          required: false,
        },
        {
          model: TahunAkademik,
          as: "tahunAkademik",
          attributes: ["id", "tahunMulai", "tahunSelesai", "semester"],
          required: false,
        },
        {
          model: Prodi,
          as: "prodiPengusulRelasi",
          attributes: ["namaProdi", "kodeProdi"],
          required: false,
        },
      ],
    });

    if (!proposal) throw HttpError.notFound("Proposal tidak ditemukan");
    return proposal;
  }

  private async generate(
    proposal: HakiProposal,
    reqUser: AuthenticatedUserContext,
    options: { isAdmin: boolean },
    requestId?: string,
  ): Promise<FinalPdfResult> {
    ensurePdfFontsReady();

    if (proposal.status_usulan !== "Approved") {
      throw HttpError.badRequest(
        "PDF final hanya dapat digenerate untuk proposal berstatus Approved",
      );
    }

    if (proposal.tipe !== REPORT_SCOPE_TIPE.HIBAH_INTERNAL) {
      throw HttpError.badRequest(
        "PDF final hanya berlaku untuk proposal hibah internal",
      );
    }

    // ── Official Signatures Per-Prodi ──
    const ketuaMember = proposal.members?.find((m) => m.peran === "Ketua");
    const anggotaMembers =
      proposal.members?.filter((m) => m.peran === "Anggota") || [];

    const kodeProdiPengusul = proposal.prodi_pengusul || null;

    const [signatureMengetahui, signatureKetuaPengusul] = await Promise.all([
      loadActivePdfSignatureSlot(
        PDF_SIGNATURE_KEYS.MENGETAHUI,
        kodeProdiPengusul,
      ),
      loadActivePdfSignatureSlot(
        PDF_SIGNATURE_KEYS.KETUA_PENGUSUL,
        kodeProdiPengusul,
      ),
    ]);

    if (!signatureMengetahui || !signatureMengetahui.signatureImageDataUrl) {
      throw HttpError.badRequest(
        "Maaf, sepertinya Kaprodi belum menandatangani proposal",
      );
    }

    const fallbackKetuaNama =
      ketuaMember?.nama_anggota ||
      ketuaMember?.user?.name ||
      reqUser.name ||
      "-";
    const fallbackKetuaNidn =
      ketuaMember?.no_identitas ||
      ketuaMember?.user?.nidn ||
      "-";

    // ── Substansi & Jadwal ──
    const isResearcher = proposal.tipe_usulan === "Penelitian";
    const substansiPenelitian = proposal.substansiPenelitian;
    const substansiPengabdian = proposal.substansiPengabdian;

    const jadwalList = await JadwalProposal.findAll({
      where: { haki_proposal_id: proposal.id },
      include: [
        { model: JadwalBulanan, as: "bulanAktif", attributes: ["bulan"] },
      ],
      order: [
        ["tahun", "ASC"],
        ["urutan", "ASC"],
        [{ model: JadwalBulanan, as: "bulanAktif" }, "bulan", "ASC"],
      ],
    });

    // ── Parse Rich Text Content (parallel) ──
    let substansiContent: any;

    if (isResearcher) {
      const [pendahuluanNodes, metodeNodes, daftarPustakaNodes] =
        await Promise.all([
          parseRichTextToNodes(substansiPenelitian?.pendahuluan || ""),
          parseRichTextToNodes(substansiPenelitian?.metode || ""),
          parseRichTextToNodes(substansiPenelitian?.daftar_pustaka || ""),
        ]);

      substansiContent = {
        ringkasan: stripHtmlToPlainText(substansiPenelitian?.ringkasan || ""),
        kataKunci: Array.isArray(substansiPenelitian?.kata_kunci)
          ? substansiPenelitian.kata_kunci
          : [],
        pendahuluanNodes,
        metodeNodes,
        daftarPustakaNodes,
      };
    } else {
      const [
        pendahuluanNodes,
        permasalahanNodes,
        metodeNodes,
        gambaranIpteksNodes,
        daftarPustakaNodes,
      ] = await Promise.all([
        parseRichTextToNodes(substansiPengabdian?.pendahuluan || ""),
        parseRichTextToNodes(substansiPengabdian?.permasalahan_dan_solusi || ""),
        parseRichTextToNodes(substansiPengabdian?.metode || ""),
        parseRichTextToNodes(substansiPengabdian?.gambaran_ipteks || ""),
        parseRichTextToNodes(substansiPengabdian?.daftar_pustaka || ""),
      ]);

      const petaLokasiMitraUrl =
        substansiPengabdian?.peta_lokasi_mitra_url || null;
      const petaLokasiMitraExternalUrl = isExternalHttpUrl(petaLokasiMitraUrl)
        ? petaLokasiMitraUrl
        : null;
      let petaLokasiMitraDataUrl = null;
      if (petaLokasiMitraUrl && !petaLokasiMitraExternalUrl) {
        petaLokasiMitraDataUrl = await fetchImageAsBase64(petaLokasiMitraUrl);
      }

      substansiContent = {
        tingkat: substansiPengabdian?.tingkat || null,
        ringkasan: stripHtmlToPlainText(substansiPengabdian?.ringkasan || ""),
        kataKunci: Array.isArray(substansiPengabdian?.kata_kunci)
          ? substansiPengabdian.kata_kunci
          : [],
        pendahuluanNodes,
        permasalahanNodes,
        metodeNodes,
        gambaranIpteksNodes,
        petaLokasiMitraDataUrl,
        petaLokasiMitraExternalUrl,
        daftarPustakaNodes,
      };
    }

    const tahunDokumen = proposal.updatedAt
      ? new Date(proposal.updatedAt).getFullYear()
      : new Date().getFullYear();

    const tanggalCetak = await resolveSignatureDate(
      proposal.id,
      proposal.updatedAt,
    );
    const finalReportValidated = await isFinalReportValidatedForProposal(
      proposal.id,
    );

    // ── Build payload with data aliases (PRD Parity) ──
    const payload = {
      logoDataUrl: getPdfTemplateLogoDataUrl(),
      tahunDokumen,
      judul: proposal.judul,
      proposalType: proposal.tipe_usulan || "Penelitian",
      skema: proposal.skema?.namaSkema || proposal.kelompok_skema || "-",
      bidangFokus: proposal.bidang_fokus || "-",
      prodiPengusul:
        proposal.prodiPengusulRelasi?.namaProdi ||
        ketuaMember?.user?.prodiRelation?.namaProdi ||
        "-",
      sumberDana: proposal.sumber_dana || "-",
      jumlahDana: Number(proposal.jumlah_dana || 0),
      keterlibatanLain: proposal.keterlibatan_lain || "-",
      tahunPelaksanaan: proposal.tahun_pelaksanaan || "-",
      tahunAkademik: proposal.tahunAkademik
        ? formatTahunAkademikLabel(proposal.tahunAkademik)
        : "-",
      substansiContent,
      ketua: {
        nama: signatureKetuaPengusul?.signerName || fallbackKetuaNama,
        nidn: signatureKetuaPengusul?.signerNidn || fallbackKetuaNidn,
        prodi:
          ketuaMember?.user?.prodiRelation?.namaProdi ||
          proposal.prodiPengusulRelasi?.namaProdi ||
          "-",
        institusi:
          ketuaMember?.institusi_anggota ||
          ketuaMember?.user?.institusi ||
          "-",
        posisi_dalam_tim: "Ketua",
        peran: "Ketua",
        bidangTugas: ketuaMember?.bidang_tugas || "-",
        bidangKeahlian: ketuaMember?.bidang_tugas || "-",
        statusInvite: ketuaMember?.status_invite || "accepted",
        signatureImageDataUrl:
          signatureKetuaPengusul?.signatureImageDataUrl || null,
      },
      anggota: anggotaMembers.map((member: any) => ({
        nama: member?.nama_anggota || member?.user?.name || "-",
        nidn:
          member?.no_identitas ||
          member?.user?.nidn ||
          "-",
        prodi: member?.user?.prodiRelation?.namaProdi || "-",
        institusi: member?.institusi_anggota || member?.user?.institusi || "-",
        posisi_dalam_tim: member?.peran || "Anggota",
        peran: member?.peran || "Anggota",
        bidangTugas: member?.bidang_tugas || "-",
        bidangKeahlian: member?.bidang_tugas || "-",
        statusInvite: member?.status_invite || "accepted",
      })),
      jadwalList: jadwalList.map((j) => j.toJSON()),
      luaran: (proposal.luaran || []).map((item: any) => ({
        namaLuaran: item?.luaran || "-",
        targetCapaian: item?.target_capaian || "-",
        ikuTerkait: item?.iku_terkait || "-",
        target_capaian_iku: item?.target_iku || "-",
        targetCapaianIku: item?.target_iku || "-",
        tahunCapaian: item?.tahun_capaian || "-",
      })),
      rab: (proposal.rab || []).map((item: any) => ({
        tahunKe: item?.tahun_ke || "-",
        kelompok: item?.kelompok || "-",
        komponen: item?.komponen || "-",
        uraian_belanja: item?.item || "-",
        uraianBelanja: item?.item || "-",
        item: item?.item || "-",
        satuan: item?.satuan || "-",
        biayaSatuan: Number(item?.biaya_satuan || 0),
        volume: Number(item?.volume || 0),
        jumlah_dibayarkan: Number(item?.total_biaya || 0),
        jumlahDibayarkan: Number(item?.total_biaya || 0),
        totalBiaya: Number(item?.total_biaya || 0),
        pajak: Number(item?.pajak || 0),
      })),
      pihakMengetahui: {
        nama: signatureMengetahui?.signerName || "-",
        nidn: signatureMengetahui?.signerNidn || "-",
        signatureImageDataUrl: signatureMengetahui?.signatureImageDataUrl || null,
        prodi:
          proposal.prodiPengusulRelasi?.namaProdi ||
          ketuaMember?.user?.prodiRelation?.namaProdi ||
          "-",
      },
      lokasiTtd: "Tangerang Selatan",
      tanggalCetak,
    };

    let buffer: Buffer;
    try {
      const docDefinition = buildFinalProposalPdfDocDefinition(payload);
      buffer = await createPdfBuffer(docDefinition);
    } catch (error: any) {
      if (
        error instanceof RangeError ||
        (error.message && error.message.includes("DataView"))
      ) {
        logger.warn(
          `[PDF] NotoSans failed with DataView bounds error for proposal ${proposal.id}. Falling back to Tinos.`,
        );
        const fallbackPayload = { ...payload, fallbackFont: "Tinos" };
        const fallbackDocDefinition =
          buildFinalProposalPdfDocDefinition(fallbackPayload);
        buffer = await createPdfBuffer(fallbackDocDefinition);
      } else {
        throw error;
      }
    }

    const archiveEnabled = pdfArchiveEnabled();
    let archiveRecord: { fileName: string; publicUrl: string } | null = null;

    if (archiveEnabled) {
      try {
        const persistResult = await persistGeneratedPdfArchive(
          buffer,
          proposal.id,
        );
        archiveRecord = {
          fileName: persistResult.fileName,
          publicUrl: persistResult.publicUrl,
        };
      } catch (error) {
        logger.error(
          error,
          "Gagal menyimpan arsip PDF final proposal di server",
        );
      }
    }

    auditService.persistNonBlocking({
      action: AuditAction.UPDATE,
      module: PROPOSAL_FINAL_PDF_MODULE,
      entityId: proposal.id,
      userId: reqUser.id,
      after: {
        fileName: `proposal-final-hibah-internal-${proposal.id}.pdf`,
        archived_url: archiveRecord?.publicUrl || null,
        final_report_validated: finalReportValidated,
        archive_mode: archiveEnabled
          ? PDF_ARCHIVE_MODE.STREAM_AND_SERVER
          : PDF_ARCHIVE_MODE.STREAM_ONLY,
        signature_slots: {
          mengetahui: Boolean(signatureMengetahui?.signatureImageDataUrl),
          ketua_pengusul: Boolean(signatureKetuaPengusul?.signatureImageDataUrl),
        },
      },
      requestId,
    });

    return {
      buffer,
      fileName: `proposal-final-hibah-internal-${proposal.id}.pdf`,
    };
  }
}

export const proposalFinalPdfService = new ProposalFinalPdfService();
