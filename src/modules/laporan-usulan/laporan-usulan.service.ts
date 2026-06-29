import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { LAPORAN_USULAN_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { HttpError } from "../../core/errors/http-error.js";
import { deleteFileSafe } from "../../core/storage/file-system.js";
import { fromPublicUploadUrl, toPublicUploadUrl } from "../../core/storage/storage-paths.js";
import { filesService } from "../files/files.service.js";
import { Output } from "../output/output.model.js";
import { Prodi } from "../prodi/prodi.model.js";
import { TahunAkademik } from "../tahunakademik/tahunakademik.model.js";
import { User } from "../user/user.model.js";
import { HakiProposal } from "../proposal/proposal.model.js";
import { LaporanUsulan, type JenisLaporanUsulan, type ScopeTipeLaporan, type StatusLaporanUsulan } from "../proposal/laporan-usulan.model.js";
import { MemberProposal } from "../proposal/member-proposal.model.js";
import { getPrimaryRoleName, getUserProdiKode, hasPermission, isAdminUser } from "../proposal/proposal.helpers.js";
import { canViewProposal } from "../proposal/policies/proposal.policy.js";
import type { Transaction, WhereOptions } from "sequelize";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { CreateLaporanBody, LaporanListQuery, UpdateLaporanBody, ValidateLaporanBody } from "./laporan-usulan.schema.js";

interface LaporanPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface LaporanRow {
  id: string;
  no?: number;
  haki_proposal_id: string;
  scope_tipe: ScopeTipeLaporan;
  jenis_laporan: JenisLaporanUsulan;
  jenis_usulan: string;
  file_url: string | null;
  nama_file: string | null;
  status_laporan: StatusLaporanUsulan;
  catatan_validator: string | null;
  validated_at: Date | null;
  validated_by: string | null;
  last_uploaded_at: Date | null;
  last_replaced_at: Date | null;
  replace_count: number;
  proposal: {
    id: string;
    judul: string;
    tipe: string;
    prodi_pengusul: string | null;
    output_penelitian: string | null;
    tahun_akademik: string;
    tipe_usulan: string;
  } | null;
  ketua: { id: string; name: string | null; nidn: string | null } | null;
  validator: { id: string; name: string | null } | null;
  can_upload?: boolean;
}

function pagination(page: number, limit: number, count: number): LaporanPagination {
  return {
    currentPage: page,
    totalPages: Math.ceil(count / limit),
    totalItems: count,
    itemsPerPage: limit,
  };
}

export function getLaporanUploadSubdir(jenisLaporan: JenisLaporanUsulan): "laporan-kemajuan" | "laporan-akhir" {
  return jenisLaporan === "laporan_kemajuan" ? "laporan-kemajuan" : "laporan-akhir";
}

function formatTahunAkademik(row: TahunAkademik | null | undefined): string {
  if (!row) return "-";
  return `${row.semester} ${row.tahunMulai}/${row.tahunSelesai}`;
}

function resolveScopeFromProposal(proposal: HakiProposal | null | undefined): ScopeTipeLaporan {
  return proposal?.tipe === "hibah_internal" ? "hibah_internal" : "umum";
}

function resolveJenisUsulanLabel(proposal: HakiProposal | null | undefined, scopeTipe: ScopeTipeLaporan): string {
  if (!proposal) return scopeTipe;
  if (scopeTipe === "hibah_internal") return "Hibah Internal";
  return proposal.tipe_usulan;
}

function outputText(outputs: Output[] | undefined): string | null {
  if (!outputs || outputs.length === 0) return null;
  return outputs.map((output) => output.namaOutput).join(", ");
}

function normalizeRow(laporan: LaporanUsulan, no?: number): LaporanRow {
  const proposal = laporan.proposal ?? null;
  const scopeTipe = laporan.scope_tipe || resolveScopeFromProposal(proposal);
  return {
    id: laporan.id,
    ...(no !== undefined ? { no } : {}),
    haki_proposal_id: laporan.haki_proposal_id,
    scope_tipe: scopeTipe,
    jenis_laporan: laporan.jenis_laporan,
    jenis_usulan: resolveJenisUsulanLabel(proposal, scopeTipe),
    file_url: laporan.file_url,
    nama_file: laporan.nama_file,
    status_laporan: laporan.status_laporan,
    catatan_validator: laporan.catatan_validator,
    validated_at: laporan.validated_at,
    validated_by: laporan.validated_by,
    last_uploaded_at: laporan.last_uploaded_at,
    last_replaced_at: laporan.last_replaced_at,
    replace_count: laporan.replace_count,
    proposal: proposal
      ? {
          id: proposal.id,
          judul: proposal.judul,
          tipe: proposal.tipe,
          prodi_pengusul: proposal.prodi_pengusul,
          output_penelitian: outputText(proposal.outputs),
          tahun_akademik: formatTahunAkademik(proposal.tahunAkademik),
          tipe_usulan: proposal.tipe_usulan,
        }
      : null,
    ketua: laporan.ketua ? { id: laporan.ketua.id, name: laporan.ketua.name, nidn: laporan.ketua.nidn } : null,
    validator: laporan.validator ? { id: laporan.validator.id, name: laporan.validator.name } : null,
  };
}

function assertCanValidateLaporan(proposal: HakiProposal, user: AuthenticatedUserContext): void {
  if (isAdminUser(user)) return;
  if (hasPermission(user, "review_proposal")) return;
  const roleName = getPrimaryRoleName(user);
  const userProdi = getUserProdiKode(user);
  if (
    proposal.tipe_usulan === "Penelitian" &&
    roleName === "koordinator_penelitian" &&
    hasPermission(user, "manage_penelitian") &&
    userProdi === proposal.prodi_pengusul
  ) return;
  if (
    proposal.tipe_usulan === "Pengabdian" &&
    roleName === "koordinator_pengabdian" &&
    hasPermission(user, "manage_pengabdian") &&
    userProdi === proposal.prodi_pengusul
  ) return;
  throw HttpError.forbidden("Anda tidak memiliki akses untuk memvalidasi laporan ini");
}

function transactionOption(transaction: Transaction | undefined): { transaction: Transaction | null } {
  return { transaction: transaction ?? null };
}

async function assertKetua(proposalId: string, user: AuthenticatedUserContext, transaction?: Transaction): Promise<void> {
  const member = await MemberProposal.findOne({
    where: { haki_proposal_id: proposalId, no_identitas: user.nidn, peran: "Ketua" },
    ...transactionOption(transaction),
  });
  if (!member) throw HttpError.forbidden("Hanya ketua pengusul yang dapat membuat atau mengupload laporan");
}

async function getValidatedKemajuan(proposalId: string, scopeTipe: ScopeTipeLaporan, transaction?: Transaction): Promise<LaporanUsulan | null> {
  return LaporanUsulan.findOne({
    where: {
      haki_proposal_id: proposalId,
      scope_tipe: scopeTipe,
      jenis_laporan: "laporan_kemajuan",
      status_laporan: "Sesuai",
    },
    ...transactionOption(transaction),
  });
}

async function assertFinalReportReady(params: {
  proposal: HakiProposal;
  jenisLaporan: JenisLaporanUsulan;
  scopeTipe: ScopeTipeLaporan;
  transaction?: Transaction;
}): Promise<void> {
  if (!(params.scopeTipe === "hibah_internal" && params.jenisLaporan === "laporan_akhir")) return;
  const kemajuan = await getValidatedKemajuan(params.proposal.id, params.scopeTipe, params.transaction);
  if (!kemajuan) throw HttpError.badRequest("Laporan akhir hanya dapat dibuka setelah laporan kemajuan divalidasi");
}

function getFileUrl(file: Express.Multer.File | undefined, jenisLaporan: JenisLaporanUsulan, bodyUrl: string | null | undefined): string | null {
  if (file) return toPublicUploadUrl(getLaporanUploadSubdir(jenisLaporan), file.filename);
  return bodyUrl ?? null;
}

async function deleteReplacedFile(oldFileUrl: string | null, nextFileUrl: string | null): Promise<void> {
  if (!oldFileUrl || oldFileUrl === nextFileUrl) return;
  const resolved = fromPublicUploadUrl(oldFileUrl);
  if (resolved) await deleteFileSafe(resolved.absolutePath);
}

export class LaporanUsulanService {
  async listLaporanUsulan(params: {
    query: LaporanListQuery;
    user: AuthenticatedUserContext;
  }): Promise<{ data: LaporanRow[]; pagination: LaporanPagination }> {
    const where: WhereOptions<LaporanUsulan> = {};
    const proposalWhere: WhereOptions<HakiProposal> = {};
    if (params.query.proposal_id || params.query.haki_proposal_id) where.haki_proposal_id = params.query.proposal_id ?? params.query.haki_proposal_id;
    if (params.query.jenis_laporan) where.jenis_laporan = params.query.jenis_laporan;
    if (params.query.status_laporan) where.status_laporan = params.query.status_laporan;
    if (params.query.tipe_usulan) proposalWhere.tipe_usulan = params.query.tipe_usulan;
    if (params.query.tahun_akademik_id) proposalWhere.tahun_akademik_id = params.query.tahun_akademik_id;
    if (params.query.prodi_pengusul) proposalWhere.prodi_pengusul = params.query.prodi_pengusul;

    if (!isAdminUser(params.user) && !hasPermission(params.user, "review_proposal")) {
      const userProdi = getUserProdiKode(params.user);
      const roleName = getPrimaryRoleName(params.user);
      if (["koordinator_penelitian", "koordinator_pengabdian", "kaprodi"].includes(roleName) && userProdi) {
        proposalWhere.prodi_pengusul = userProdi;
      } else {
        const ketuaMemberships = await MemberProposal.findAll({
          where: { no_identitas: params.user.nidn, peran: "Ketua" },
          attributes: ["haki_proposal_id"],
        });
        where.haki_proposal_id = { [Op.in]: ketuaMemberships.map((member) => member.haki_proposal_id) };
      }
    }

    const offset = (params.query.page - 1) * params.query.limit;
    const proposalInclude = {
      model: HakiProposal,
      as: "proposal",
      ...(Object.keys(proposalWhere).length > 0 ? { where: proposalWhere } : {}),
      include: [
        { model: TahunAkademik, as: "tahunAkademik", required: false },
        { model: Output, as: "outputs", attributes: ["id", "namaOutput"], through: { attributes: [] } },
      ],
    };

    const { count, rows } = await LaporanUsulan.findAndCountAll({
      where,
      distinct: true,
      include: [
        proposalInclude,
        { model: User, as: "ketua", attributes: ["id", "name", "nidn"], required: false },
        { model: User, as: "validator", attributes: ["id", "name"], required: false },
      ],
      limit: params.query.limit,
      offset,
      order: [["updatedAt", "DESC"]],
    });

    const ketuaProposalIds = new Set(
      (
        await MemberProposal.findAll({
          where: { no_identitas: params.user.nidn, peran: "Ketua" },
          attributes: ["haki_proposal_id"],
        })
      ).map((member) => member.haki_proposal_id),
    );
    return {
      data: rows.map((row, index) => ({
        ...normalizeRow(row, offset + index + 1),
        can_upload: ketuaProposalIds.has(row.haki_proposal_id),
      })),
      pagination: pagination(params.query.page, params.query.limit, count),
    };
  }

  async createLaporanUsulan(params: {
    body: CreateLaporanBody;
    file: Express.Multer.File | undefined;
    user: AuthenticatedUserContext;
    requestId: string | undefined;
  }): Promise<{ id: string; jenis_laporan: string; status_laporan: string; scope_tipe: string; jenis_usulan: string }> {
    const proposal = await HakiProposal.findByPk(params.body.haki_proposal_id);
    if (!proposal) throw HttpError.notFound("Proposal tidak ditemukan");
    if (proposal.status_usulan !== "Approved") {
      throw HttpError.badRequest("Laporan hanya dapat dibuat untuk proposal yang sudah disetujui (Approved)");
    }
    if (params.body.jenis_laporan === "laporan_kemajuan" && proposal.tipe !== "hibah_internal") {
      throw HttpError.badRequest("Laporan kemajuan hanya tersedia untuk proposal Hibah Internal");
    }
    const scopeTipe = resolveScopeFromProposal(proposal);
    await assertFinalReportReady({ proposal, jenisLaporan: params.body.jenis_laporan, scopeTipe });
    await assertKetua(proposal.id, params.user);
    const fileUrl = getFileUrl(params.file, params.body.jenis_laporan, params.body.file_url);
    if (!fileUrl) throw HttpError.badRequest("File atau Link laporan wajib dilampirkan");
    const namaFile = params.file ? params.file.originalname : params.body.nama_file ?? (params.body.file_url ? "Link Laporan" : null);

    const laporan = await sequelize.transaction(async (transaction) => {
      const existing = await LaporanUsulan.findOne({
        where: { haki_proposal_id: proposal.id, jenis_laporan: params.body.jenis_laporan, scope_tipe: scopeTipe },
        transaction,
      });
      if (existing) throw HttpError.conflict("Laporan untuk proposal dan jenis ini sudah ada");
      const created = await LaporanUsulan.create(
        {
          haki_proposal_id: proposal.id,
          ketua_user_id: params.user.id,
          jenis_laporan: params.body.jenis_laporan,
          scope_tipe: scopeTipe,
          file_url: fileUrl,
          nama_file: namaFile,
          status_laporan: "Pending",
          last_uploaded_at: new Date(),
          replace_count: 0,
        },
        { transaction },
      );
      if (params.file) {
        await filesService.registerUploadedFile({
          file: params.file,
          subdir: getLaporanUploadSubdir(params.body.jenis_laporan),
          ownerUserId: params.user.id,
          entityType: "laporan_usulan",
          entityId: created.id,
          visibility: "private",
          createdBy: params.user.id,
        });
      }
      return created;
    });
    auditService.persistNonBlocking({
      action: AuditAction.CREATE,
      module: LAPORAN_USULAN_MODULE,
      entityId: laporan.id,
      userId: params.user.id,
      after: { haki_proposal_id: proposal.id, jenis_laporan: laporan.jenis_laporan, scope_tipe: laporan.scope_tipe },
      requestId: params.requestId,
    });
    return {
      id: laporan.id,
      jenis_laporan: laporan.jenis_laporan,
      status_laporan: laporan.status_laporan,
      scope_tipe: laporan.scope_tipe,
      jenis_usulan: resolveJenisUsulanLabel(proposal, laporan.scope_tipe),
    };
  }

  async updateLaporanUsulan(params: {
    id: string;
    body: UpdateLaporanBody;
    file: Express.Multer.File | undefined;
    user: AuthenticatedUserContext;
    requestId: string | undefined;
  }): Promise<{ id: string; file_url: string | null; status_laporan: string; scope_tipe: string; jenis_usulan: string }> {
    const laporan = await LaporanUsulan.findByPk(params.id);
    if (!laporan) throw HttpError.notFound("Laporan tidak ditemukan");
    const proposal = await HakiProposal.findByPk(laporan.haki_proposal_id);
    if (!proposal) throw HttpError.notFound("Proposal tidak ditemukan");
    const scopeTipe = laporan.scope_tipe || resolveScopeFromProposal(proposal);
    await assertFinalReportReady({ proposal, jenisLaporan: laporan.jenis_laporan, scopeTipe });
    await assertKetua(laporan.haki_proposal_id, params.user);
    if (laporan.status_laporan === "Sesuai") throw HttpError.forbidden("Laporan yang sudah divalidasi tidak dapat diubah");
    if (!params.file && !params.body.file_url) throw HttpError.badRequest("File atau Link laporan wajib dilampirkan");
    const oldFileUrl = laporan.file_url;
    const fileUrl = getFileUrl(params.file, laporan.jenis_laporan, params.body.file_url) ?? oldFileUrl;
    const namaFile = params.file ? params.file.originalname : params.body.nama_file ?? (params.body.file_url ? "Link Laporan" : laporan.nama_file);

    await sequelize.transaction(async (transaction) => {
      await laporan.update(
        {
          file_url: fileUrl,
          nama_file: namaFile,
          status_laporan: "Pending",
          catatan_validator: null,
          validated_by: null,
          validated_at: null,
          last_uploaded_at: new Date(),
          last_replaced_at: oldFileUrl ? new Date() : laporan.last_replaced_at,
          replace_count: Number(laporan.replace_count || 0) + 1,
        },
        { transaction },
      );
    });
    if (params.file) {
      await filesService.registerUploadedFile({
        file: params.file,
        subdir: getLaporanUploadSubdir(laporan.jenis_laporan),
        ownerUserId: params.user.id,
        entityType: "laporan_usulan",
        entityId: laporan.id,
        visibility: "private",
        createdBy: params.user.id,
      });
      await deleteReplacedFile(oldFileUrl, fileUrl);
    }
    auditService.persistNonBlocking({
      action: AuditAction.UPDATE,
      module: LAPORAN_USULAN_MODULE,
      entityId: laporan.id,
      userId: params.user.id,
      before: { file_url: oldFileUrl },
      after: { file_url: fileUrl, status_laporan: "Pending" },
      requestId: params.requestId,
    });
    return {
      id: laporan.id,
      file_url: fileUrl,
      status_laporan: laporan.status_laporan,
      scope_tipe: scopeTipe,
      jenis_usulan: resolveJenisUsulanLabel(proposal, scopeTipe),
    };
  }

  async validateLaporanUsulan(params: {
    id: string;
    body: ValidateLaporanBody;
    user: AuthenticatedUserContext;
    requestId: string | undefined;
  }): Promise<{ id: string; status_laporan: string; validated_at: Date; scope_tipe: string; jenis_usulan: string }> {
    const laporan = await LaporanUsulan.findByPk(params.id);
    if (!laporan) throw HttpError.notFound("Laporan tidak ditemukan");
    const proposal = await HakiProposal.findByPk(laporan.haki_proposal_id);
    if (!proposal) throw HttpError.notFound("Proposal tidak ditemukan");
    assertCanValidateLaporan(proposal, params.user);
    const scopeTipe = laporan.scope_tipe || resolveScopeFromProposal(proposal);
    await assertFinalReportReady({ proposal, jenisLaporan: laporan.jenis_laporan, scopeTipe });
    if (params.body.status_laporan === "Revisi" && !params.body.catatan_validator) {
      throw HttpError.badRequest("Catatan revisi wajib diisi");
    }
    if (!laporan.file_url && params.body.status_laporan === "Sesuai") {
      throw HttpError.badRequest("Tidak dapat memvalidasi laporan yang belum memiliki file");
    }
    const validatedAt = new Date();
    await sequelize.transaction(async (transaction) => {
      await laporan.update(
        {
          status_laporan: params.body.status_laporan,
          catatan_validator: params.body.catatan_validator ?? null,
          validated_by: params.user.id,
          validated_at: validatedAt,
        },
        { transaction },
      );
      if (laporan.jenis_laporan === "laporan_kemajuan" && scopeTipe === "hibah_internal" && params.body.status_laporan === "Sesuai") {
        const existingFinal = await LaporanUsulan.findOne({
          where: { haki_proposal_id: laporan.haki_proposal_id, jenis_laporan: "laporan_akhir", scope_tipe: scopeTipe },
          transaction,
        });
        if (!existingFinal) {
          await LaporanUsulan.create(
            {
              haki_proposal_id: laporan.haki_proposal_id,
              ketua_user_id: laporan.ketua_user_id,
              jenis_laporan: "laporan_akhir",
              scope_tipe: scopeTipe,
              status_laporan: "Lengkapi Dokumen",
              replace_count: 0,
            },
            { transaction },
          );
        }
      }
    });
    auditService.persistNonBlocking({
      action: AuditAction.APPROVE,
      module: LAPORAN_USULAN_MODULE,
      entityId: laporan.id,
      userId: params.user.id,
      after: { status_laporan: params.body.status_laporan, catatan_validator: params.body.catatan_validator ?? null },
      requestId: params.requestId,
    });
    return {
      id: laporan.id,
      status_laporan: params.body.status_laporan,
      validated_at: validatedAt,
      scope_tipe: scopeTipe,
      jenis_usulan: resolveJenisUsulanLabel(proposal, scopeTipe),
    };
  }

  async getLaporanDetail(id: string, user: AuthenticatedUserContext): Promise<LaporanRow> {
    const laporan = await LaporanUsulan.findByPk(id, {
      include: [
        {
          model: HakiProposal,
          as: "proposal",
          include: [
            { model: TahunAkademik, as: "tahunAkademik", required: false },
            { model: Output, as: "outputs", attributes: ["id", "namaOutput"], through: { attributes: [] } },
          ],
        },
        { model: User, as: "ketua", attributes: ["id", "name", "nidn"], required: false },
        { model: User, as: "validator", attributes: ["id", "name"], required: false },
      ],
    });
    if (!laporan) throw HttpError.notFound("Laporan tidak ditemukan");
    if (!laporan.proposal || !(await canViewProposal(laporan.proposal, user))) {
      throw HttpError.forbidden("Anda tidak memiliki akses ke laporan ini");
    }
    return normalizeRow(laporan);
  }
}

export const laporanUsulanService = new LaporanUsulanService();
