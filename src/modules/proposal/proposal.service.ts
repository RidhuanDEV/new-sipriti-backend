import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { PENELITIAN_MODULE, PENGABDIAN_MODULE, PROPOSAL_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { HttpError } from "../../core/errors/http-error.js";
import { toPublicUploadUrl } from "../../core/storage/storage-paths.js";
import { generateUuidV7 } from "../../utils/uuid.js";
import { Output } from "../output/output.model.js";
import { Prodi } from "../prodi/prodi.model.js";
import { TahunAkademik } from "../tahunakademik/tahunakademik.model.js";
import { User } from "../user/user.model.js";
import { JadwalBulanan } from "../jadwal-proposal/jadwal-bulanan.model.js";
import { JadwalProposal } from "../jadwal-proposal/jadwal-proposal.model.js";
import { LuaranProposal } from "../luaran-proposal/luaran-proposal.model.js";
import { PengabdianProposal } from "../pengabdian-proposal/pengabdian-proposal.model.js";
import { PenelitianProposal } from "../penelitian-proposal/penelitian-proposal.model.js";
import { RABProposal } from "../rab-proposal/rab-proposal.model.js";
import { notificationService } from "../notification/notification.service.js";
import { HakiProposal, type ProposalTipeUsulan } from "./proposal.model.js";
import { LaporanUsulan } from "./laporan-usulan.model.js";
import { Mahasiswa } from "./mahasiswa.model.js";
import { MemberProposal, type MemberProposalPeran } from "./member-proposal.model.js";
import {
  assertMoneyRange,
  assertValidDuration,
  buildListQueryWhere,
  buildPublicYear,
  buildUsulanRow,
  getProposalIdsByProdi,
  getUserProdiKode,
  hasPermission,
  isAdminUser,
  isProposalWithinUserProdi,
  mapTahunAkademikResponse,
  normalizeOutputIds,
  normalizeRoleLabel,
  normalizeStatusFilter,
  parseCurrencyValue,
  parseJsonArray,
  parseJsonObject,
  parsePagination,
  proposalListIncludes,
  sanitizeErrorLeak,
  TIPE_USULAN_PENGABDIAN,
  TIPE_USULAN_PENELITIAN,
} from "./proposal.helpers.js";
import { resolveProposalDraftEditDecision } from "./policies/proposal.policy.js";
import type { Transaction, WhereOptions } from "sequelize";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type {
  CreateProposalBodyDto,
  DropdownOptionsDto,
  ForwardProposalResponseDto,
  ProposalByProdiQueryDto,
  ProposalDetailDto,
  ProposalDetailMemberDto,
  ProposalListQueryDto,
  ProposalMemberInput,
  ProposalMetaInput,
  ProposalRabDto,
  ProposalRowDto,
  ProposalSearchBodyDto,
  SubmitProposalResponseDto,
  UpdateProposalBodyDto,
} from "./dto/proposal.dto.js";
import type { PublicLandingQuerySchema } from "./proposal.schema.js";

interface RequestAuditContext {
  requestId?: string | undefined;
}

interface ResolvedMemberIdentity {
  displayName: string;
  institusi: string | null;
  prodi: string | null;
  prodiKode: string | null;
  notificationUserId: string | null;
  source: "user" | "mahasiswa";
}

interface ProposalCreateResult {
  id: string;
  tipe_usulan: string;
}

interface NormalizedCreateProposalMeta extends ProposalMetaInput {
  judul: string;
  bidang_fokus: string;
  prodi_pengusul: string;
  skema: string;
  sumber_dana: string;
  jumlah_dana: number;
  tahun_pelaksanaan: string;
  keterlibatan_lain: string | null;
}

interface ProposalListResult {
  data: ProposalRowDto[];
  total?: number;
  page?: number;
  limit?: number;
}

const STATUS_COLOR: Record<string, string> = {
  Draft: "gray",
  Pending: "yellow",
  Approved: "green",
  Declined: "red",
};

function getAuditModule(tipeUsulan: ProposalTipeUsulan) {
  return tipeUsulan === TIPE_USULAN_PENGABDIAN ? PENGABDIAN_MODULE : PENELITIAN_MODULE;
}

function createFieldError(message: string): HttpError {
  return HttpError.badRequest(message, [], "VALIDATION_ERROR");
}

function requireString(value: string | null | undefined, message: string): string {
  const normalized = String(value ?? "").trim();
  if (!normalized) throw createFieldError(message);
  return normalized;
}

function assertCompleteMemberRow(memberRow: {
  no_identitas: string | null;
  nama_anggota: string | null;
  institusi_anggota: string | null;
  prodi_anggota: string | null;
  prodi_kode_anggota: string | null;
  bidang_tugas: string | null;
  peran: string | null;
}, rowIndex: number): void {
  const requiredFields = [
    { key: "no_identitas", label: "No identitas", value: memberRow.no_identitas },
    { key: "nama_anggota", label: "Nama anggota", value: memberRow.nama_anggota },
    { key: "institusi_anggota", label: "Institusi anggota", value: memberRow.institusi_anggota },
    { key: "prodi_anggota", label: "Program studi anggota", value: memberRow.prodi_anggota },
    { key: "prodi_kode_anggota", label: "Kode program studi anggota", value: memberRow.prodi_kode_anggota },
    { key: "bidang_tugas", label: "Bidang tugas", value: memberRow.bidang_tugas },
    { key: "peran", label: "Peran", value: memberRow.peran },
  ];

  for (const field of requiredFields) {
    const normalized = String(field.value ?? "").trim();
    if (!normalized || normalized === "-") {
      throw createFieldError(`Anggota ke-${rowIndex + 1}: ${field.label} wajib diisi`);
    }
  }
}

async function resolveMemberIdentity(noIdentitas: string, transaction?: Transaction): Promise<ResolvedMemberIdentity | null> {
  const transactionOptions = transaction ? { transaction } : {};
  const matchedUser = await User.findOne({
    where: { nidn: noIdentitas },
    attributes: ["id", "name", "institusi", "nidn", "prodiKode"],
    include: [
      {
        model: Prodi,
        as: "prodiRelation",
        attributes: ["id", "kodeProdi", "namaProdi"],
        required: false,
      },
    ],
    ...transactionOptions,
  });

  if (matchedUser) {
    return {
      displayName: matchedUser.name || noIdentitas,
      institusi: matchedUser.institusi || null,
      prodi: matchedUser.prodiRelation?.namaProdi || null,
      prodiKode: matchedUser.prodiRelation?.kodeProdi || matchedUser.prodiKode || null,
      notificationUserId: matchedUser.id,
      source: "user",
    };
  }

  const matchedMahasiswa = await Mahasiswa.findOne({
    where: { nrp: noIdentitas },
    include: [
      {
        model: Prodi,
        as: "prodiRelasi",
        attributes: ["id", "kodeProdi", "namaProdi"],
        required: false,
      },
    ],
    ...transactionOptions,
  });

  if (matchedMahasiswa) {
    return {
      displayName: matchedMahasiswa.nama || noIdentitas,
      institusi: null,
      prodi: matchedMahasiswa.prodiRelasi?.namaProdi || null,
      prodiKode: matchedMahasiswa.prodiRelasi?.kodeProdi || matchedMahasiswa.prodi_kode || null,
      notificationUserId: null,
      source: "mahasiswa",
    };
  }

  return null;
}

async function syncProposalOutputs(proposal: HakiProposal, outputIds: string[], transaction: Transaction): Promise<void> {
  if (outputIds.length === 0) {
    await proposal.setOutputs([], { transaction });
    return;
  }

  const outputs = await Output.findAll({
    where: { id: outputIds },
    attributes: ["id", "namaOutput"],
    transaction,
    order: [["namaOutput", "ASC"]],
  });

  if (outputs.length !== outputIds.length) {
    throw createFieldError("Salah satu output tidak ditemukan");
  }

  await proposal.setOutputs(outputs, { transaction });
}

async function buildFinalReportValidationMap(proposalIds: string[]): Promise<Map<string, boolean>> {
  const ids = Array.from(new Set(proposalIds.filter(Boolean)));
  if (ids.length === 0) return new Map();

  const rows = await LaporanUsulan.findAll({
    where: {
      haki_proposal_id: { [Op.in]: ids },
      jenis_laporan: "laporan_akhir",
      scope_tipe: "hibah_internal",
      status_laporan: "Sesuai",
    },
    attributes: ["haki_proposal_id"],
  });
  const validIds = new Set(rows.map((row) => row.haki_proposal_id));
  return new Map(ids.map((proposalId) => [proposalId, validIds.has(proposalId)]));
}

async function getDropdownOptions(): Promise<DropdownOptionsDto> {
  const tahunAkademikRecords = await TahunAkademik.findAll({
    order: [["tahunMulai", "DESC"]],
    attributes: ["id", "tahunMulai", "tahunSelesai", "semester"],
  });

  return {
    tipe_usulan: ["Penelitian", "Pengabdian"],
    jenis_usulan: ["Baru", "Lanjutan"],
    sumber_dana: ["Internal", "Eksternal", "Mandiri", "Hibah Pemerintah", "Hibah Swasta", "Lainnya"],
    tahunAkademik: tahunAkademikRecords.map((record) => mapTahunAkademikResponse(record)!),
  };
}

export class ProposalService {
  async createBaseProposal(
    judul: string,
    file: Express.Multer.File | undefined,
    user: AuthenticatedUserContext,
    auditContext: RequestAuditContext = {},
  ): Promise<HakiProposal> {
    const fileUrl = file ? toPublicUploadUrl("proposals", file.filename) : null;
    const proposal = await sequelize.transaction(async (transaction) => {
      const created = await HakiProposal.create(
        {
          user_id: user.id,
          judul,
          file_url: fileUrl,
        },
        { transaction },
      );

      await MemberProposal.create(
        {
          haki_proposal_id: created.id,
          no_identitas: user.nidn,
          peran: "Ketua",
          status_invite: "accepted",
          nama_anggota: user.name,
          invited_by_user_id: user.id,
        },
        { transaction },
      );

      return created;
    });

    auditService.persistNonBlocking({
      action: AuditAction.CREATE,
      module: PROPOSAL_MODULE,
      entityId: proposal.id,
      userId: user.id,
      after: { judul, file_url: fileUrl },
      requestId: auditContext.requestId,
    });
    return proposal;
  }

  async inviteMember(
    proposalId: string,
    noIdentitas: string,
    peran: MemberProposalPeran,
    user: AuthenticatedUserContext,
    auditContext: RequestAuditContext = {},
  ): Promise<MemberProposal> {
    const proposal = await HakiProposal.findByPk(proposalId, {
      attributes: ["id", "judul", "tipe_usulan"],
    });
    if (!proposal) throw HttpError.notFound("Proposal tidak ditemukan");

    const ketua = await MemberProposal.findOne({
      where: {
        haki_proposal_id: proposalId,
        no_identitas: user.nidn,
        peran: "Ketua",
      },
    });
    if (!ketua) throw HttpError.forbidden("Hanya ketua yang dapat mengundang anggota");
    if (noIdentitas === user.nidn) throw HttpError.badRequest("Tidak dapat mengundang diri sendiri");

    const resolvedMember = await resolveMemberIdentity(noIdentitas);
    if (!resolvedMember) throw HttpError.badRequest("Identitas anggota tidak ditemukan");

    const invite = await sequelize.transaction(async (transaction) => {
      const existing = await MemberProposal.findOne({
        where: { haki_proposal_id: proposalId, no_identitas: noIdentitas },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const wasAcceptedBefore = existing?.status_invite === "accepted";
      const nextValues = {
        haki_proposal_id: proposalId,
        no_identitas: noIdentitas,
        peran: peran || existing?.peran || "Anggota",
        status_invite: "accepted" as const,
        invited_by_user_id: user.id,
        nama_anggota: resolvedMember.displayName,
        institusi_anggota: resolvedMember.institusi,
        prodi_anggota: resolvedMember.prodi,
        prodi_kode_anggota: resolvedMember.prodiKode,
      };

      const record = existing
        ? await existing.update(nextValues, { transaction })
        : await MemberProposal.create(nextValues, { transaction });

      if (resolvedMember.notificationUserId && !wasAcceptedBefore) {
        await notificationService.createNotification(
          {
            userId: resolvedMember.notificationUserId,
            type: "invite_anggota",
            relatedType: "member_proposal",
            relatedId: record.id,
            title: `Keikutsertaan Proposal ${proposal.tipe_usulan === "Pengabdian" ? "Pengabdian" : "Penelitian"}`,
            message: `${resolvedMember.displayName} telah bergabung sebagai anggota dalam usulan "${proposal.judul}".`,
            metadata: {
              inviter_user_id: user.id,
              inviter_name: user.name,
              proposal_id: proposal.id,
              proposal_title: proposal.judul,
              proposal_type: proposal.tipe_usulan,
              member_name: resolvedMember.displayName,
            },
          },
          transaction,
        );
      }

      return record;
    });

    auditService.persistNonBlocking({
      action: AuditAction.UPDATE,
      module: PROPOSAL_MODULE,
      entityId: proposalId,
      userId: user.id,
      after: { no_identitas: noIdentitas, peran: invite.peran, status_invite: invite.status_invite },
      requestId: auditContext.requestId,
    });
    return invite;
  }

  async respondInvite(
    proposalId: string,
    statusInvite: "pending" | "accepted" | "rejected",
    user: AuthenticatedUserContext,
    auditContext: RequestAuditContext = {},
  ): Promise<MemberProposal> {
    const invite = await MemberProposal.findOne({
      where: { haki_proposal_id: proposalId, no_identitas: user.nidn },
    });
    if (!invite) throw HttpError.notFound("Undangan tidak ditemukan");
    if (invite.status_invite === "accepted") return invite;

    const previousStatus = invite.status_invite;
    await sequelize.transaction(async (transaction) => {
      invite.status_invite = "accepted";
      await invite.save({ transaction });
    });

    auditService.persistNonBlocking({
      action: AuditAction.UPDATE,
      module: PROPOSAL_MODULE,
      entityId: proposalId,
      userId: user.id,
      before: { status_invite: previousStatus, requested_status_invite: statusInvite },
      after: { status_invite: "accepted" },
      requestId: auditContext.requestId,
    });

    return invite;
  }

  async getMyInvites(user: AuthenticatedUserContext): Promise<MemberProposal[]> {
    return MemberProposal.findAll({
      where: {
        no_identitas: user.nidn,
        peran: { [Op.ne]: "Ketua" },
        status_invite: "accepted",
      },
      include: [
        {
          model: HakiProposal,
          as: "proposal",
          attributes: ["id", "judul", "file_url"],
        },
      ],
    });
  }

  async adminReviewProposal(
    proposalId: string,
    statusUsulan: "Draft" | "Pending" | "Approved" | "Declined",
    user: AuthenticatedUserContext,
    auditContext: RequestAuditContext = {},
  ): Promise<HakiProposal> {
    const proposal = await HakiProposal.findByPk(proposalId);
    if (!proposal) throw HttpError.notFound("Proposal tidak ditemukan");
    const before = { status_usulan: proposal.status_usulan };
    await sequelize.transaction(async (transaction) => {
      proposal.status_usulan = statusUsulan;
      await proposal.save({ transaction });
    });
    auditService.persistNonBlocking({
      action: AuditAction.UPDATE,
      module: PROPOSAL_MODULE,
      entityId: proposalId,
      userId: user.id,
      before,
      after: { status_usulan: statusUsulan },
      requestId: auditContext.requestId,
    });
    return proposal;
  }

  async listUserWorkflowProposals(
    tipeUsulan: ProposalTipeUsulan,
    user: AuthenticatedUserContext,
    query: ProposalListQueryDto,
  ): Promise<ProposalRowDto[]> {
    const memberships = await MemberProposal.findAll({
      where: { no_identitas: user.nidn },
      attributes: ["haki_proposal_id", "peran"],
    });
    const membershipMap = new Map(memberships.map((membership) => [membership.haki_proposal_id, membership]));
    const memberProposalIds = memberships.map((membership) => membership.haki_proposal_id).filter(Boolean);
    const isKoordinator = getPrimaryCoordinator(user);
    const hasViewByProdiPermission = hasPermission(user, "view_proposal");
    const hasEditByProdiPermission = hasPermission(user, "edit_usulan_by_prodi");
    const forwardPermission = tipeUsulan === TIPE_USULAN_PENELITIAN ? "forward_usulan_penelitian" : "forward_usulan_pengabdian";
    const hasForwardPermission = hasPermission(user, forwardPermission);

    const prodiProposalIds =
      hasViewByProdiPermission || hasEditByProdiPermission || isKoordinator
        ? await getProposalIdsByProdi(getUserProdiKode(user), tipeUsulan)
        : [];
    const visibleProposalIds = Array.from(new Set([...memberProposalIds, ...prodiProposalIds].filter(Boolean)));

    const proposals = await HakiProposal.findAll({
      where: buildListQueryWhere(tipeUsulan, user.id, visibleProposalIds, query),
      attributes: [
        "id",
        "user_id",
        "judul",
        "bidang_fokus",
        "prodi_pengusul",
        "tipe_usulan",
        "sumber_dana",
        "jumlah_dana",
        "tahun_pelaksanaan",
        "status_usulan",
        "tipe",
        "tahun_akademik_id",
        "updatedAt",
      ],
      include: [
        ...proposalListIncludes,
        { model: Output, as: "outputs", attributes: ["id", "namaOutput"], through: { attributes: [] } },
      ],
      order: [["updatedAt", "DESC"]],
    });

    const hibahInternalProposalIds = proposals.filter((proposal) => proposal.tipe === "hibah_internal").map((proposal) => proposal.id);
    const finalReportValidationMap = await buildFinalReportValidationMap(hibahInternalProposalIds);
    const proposalInProdiSet = new Set(prodiProposalIds);

    return proposals.map((proposal, index) => {
      const membership = membershipMap.get(proposal.id);
      const isKetua = membership?.peran === "Ketua";
      const isWithinUserProdi = proposalInProdiSet.has(proposal.id);
      return buildUsulanRow(proposal, membership, index, 0, user.id, {
        canEditByProdi: (hasEditByProdiPermission || isKoordinator) && isWithinUserProdi,
        canForwardByProdi:
          hasForwardPermission &&
          isKetua &&
          ["Pending", "Approved"].includes(proposal.status_usulan) &&
          proposal.tipe === "umum",
        isFinalReportValidated: finalReportValidationMap.get(proposal.id) === true,
      });
    });
  }

  async createWorkflowProposal(
    tipeUsulan: ProposalTipeUsulan,
    body: CreateProposalBodyDto,
    user: AuthenticatedUserContext,
    auditContext: RequestAuditContext = {},
    externalTransaction?: Transaction,
  ): Promise<ProposalCreateResult> {
    const parsedMeta = parseJsonObject(body.meta, "meta");
    const parsedAnggota = parseJsonArray<ProposalMemberInput>(body.anggota, "anggota");
    if (!parsedMeta) throw createFieldError("Data meta wajib diisi");
    const normalizedMeta = this.validateCreateMeta(tipeUsulan, parsedMeta);
    this.validateCreateMembers(parsedAnggota, user, body.importOptions?.allowCreatorOutsideTeam === true);

    const transaction = externalTransaction ?? await sequelize.transaction();
    const shouldManageTransaction = !externalTransaction;
    try {
      if (normalizedMeta.tahun_akademik_id) {
        const exists = await TahunAkademik.findByPk(normalizedMeta.tahun_akademik_id, { transaction });
        if (!exists) throw createFieldError("Tahun akademik tidak ditemukan");
      }

      const proposal = await HakiProposal.create(
        {
          user_id: user.id,
          judul: normalizedMeta.judul,
          bidang_fokus: normalizedMeta.bidang_fokus || normalizedMeta.bidang || null,
          kelompok_skema: normalizedMeta.skema || null,
          sumber_dana: normalizedMeta.sumber_dana || null,
          jumlah_dana: normalizedMeta.jumlah_dana,
          keterlibatan_lain: normalizedMeta.keterlibatan_lain || null,
          tipe_usulan: tipeUsulan,
          status_usulan: "Draft",
          tahun_pelaksanaan: normalizedMeta.tahun_pelaksanaan || null,
          prodi_pengusul: normalizedMeta.prodi_pengusul || null,
          tahun_akademik_id: normalizedMeta.tahun_akademik_id || null,
          tipe: "umum",
        },
        { transaction },
      );

      if (Object.prototype.hasOwnProperty.call(normalizedMeta, "output_ids")) {
        await syncProposalOutputs(proposal, normalizeOutputIds(normalizedMeta.output_ids), transaction);
      }
      await this.createMemberRows(proposal.id, parsedAnggota, user, transaction);

      if (shouldManageTransaction) await transaction.commit();
      auditService.persistNonBlocking({
        action: AuditAction.CREATE,
        module: getAuditModule(tipeUsulan),
        entityId: proposal.id,
        userId: user.id,
        after: { judul: proposal.judul, tipe_usulan: tipeUsulan },
        requestId: auditContext.requestId,
      });
      return { id: proposal.id, tipe_usulan: proposal.tipe_usulan };
    } catch (err) {
      if (shouldManageTransaction) await transaction.rollback();
      throw err;
    }
  }

  async updateWorkflowProposal(
    tipeUsulan: ProposalTipeUsulan,
    id: string,
    body: UpdateProposalBodyDto,
    user: AuthenticatedUserContext,
    auditContext: RequestAuditContext = {},
  ): Promise<ProposalCreateResult> {
    if (!id || id.length < 10) throw HttpError.badRequest("ID usulan tidak valid");
    const parsedMeta = parseJsonObject(body.meta, "meta");
    const parsedAnggota = body.anggota === undefined ? null : parseJsonArray<ProposalMemberInput>(body.anggota, "anggota");
    const hasAnggotaUpdate = Array.isArray(parsedAnggota) && parsedAnggota.length > 0;

    const proposal = await HakiProposal.findByPk(id);
    if (!proposal) throw HttpError.notFound("Usulan tidak ditemukan");
    if (proposal.tipe_usulan !== tipeUsulan) {
      throw createFieldError(`Tipe usulan untuk endpoint ini harus ${tipeUsulan}`);
    }

    await this.assertCanEditProposal(proposal, user);
    const normalizedMeta = parsedMeta ? this.validateUpdateMeta(tipeUsulan, parsedMeta) : null;
    if (hasAnggotaUpdate && parsedAnggota) this.validateUpdateMembers(parsedAnggota);

    await sequelize.transaction(async (transaction) => {
      if (normalizedMeta) {
        const updatePayload = {
          ...(normalizedMeta.judul !== undefined ? { judul: normalizedMeta.judul } : {}),
          ...(normalizedMeta.bidang_fokus !== undefined || normalizedMeta.bidang !== undefined
            ? { bidang_fokus: normalizedMeta.bidang_fokus || normalizedMeta.bidang || null }
            : {}),
          ...(normalizedMeta.skema !== undefined ? { kelompok_skema: normalizedMeta.skema || null } : {}),
          ...(normalizedMeta.sumber_dana !== undefined ? { sumber_dana: normalizedMeta.sumber_dana || null } : {}),
          ...(normalizedMeta.jumlah_dana !== undefined ? { jumlah_dana: normalizedMeta.jumlah_dana } : {}),
          ...(normalizedMeta.keterlibatan_lain !== undefined ? { keterlibatan_lain: normalizedMeta.keterlibatan_lain || null } : {}),
          ...(normalizedMeta.tahun_pelaksanaan !== undefined ? { tahun_pelaksanaan: normalizedMeta.tahun_pelaksanaan || null } : {}),
          ...(normalizedMeta.prodi_pengusul !== undefined ? { prodi_pengusul: normalizedMeta.prodi_pengusul || null } : {}),
          ...(normalizedMeta.tahun_akademik_id !== undefined ? { tahun_akademik_id: normalizedMeta.tahun_akademik_id || null } : {}),
        };
        await proposal.update(updatePayload, { transaction });
        if (Object.prototype.hasOwnProperty.call(normalizedMeta, "output_ids")) {
          await syncProposalOutputs(proposal, normalizeOutputIds(normalizedMeta.output_ids), transaction);
        }
      }

      if (hasAnggotaUpdate && parsedAnggota) {
        await MemberProposal.destroy({ where: { haki_proposal_id: id }, transaction });
        await this.createMemberRows(id, parsedAnggota, user, transaction);
      }
    });

    auditService.persistNonBlocking({
      action: AuditAction.UPDATE,
      module: getAuditModule(tipeUsulan),
      entityId: id,
      userId: user.id,
      after: { meta: normalizedMeta, anggota_updated: hasAnggotaUpdate },
      requestId: auditContext.requestId,
    });
    return { id: proposal.id, tipe_usulan: proposal.tipe_usulan };
  }

  async getDetailWorkflowProposal(tipeUsulan: ProposalTipeUsulan, id: string, user: AuthenticatedUserContext): Promise<ProposalDetailDto> {
    const proposal = await HakiProposal.findByPk(id, {
      include: [
        {
          model: MemberProposal,
          as: "members",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "nidn", "institusi", "prodiKode"],
              include: [{ model: Prodi, as: "prodiRelation", attributes: ["id", "kodeProdi", "namaProdi"], required: false }],
              required: false,
            },
            {
              model: Mahasiswa,
              as: "mahasiswa",
              attributes: ["id", "nama", "nrp", "prodi_kode"],
              include: [{ model: Prodi, as: "prodiRelasi", attributes: ["id", "kodeProdi", "namaProdi"], required: false }],
              required: false,
            },
          ],
        },
        { model: RABProposal, as: "rab" },
        { model: PenelitianProposal, as: "substansiPenelitian" },
        { model: PengabdianProposal, as: "substansiPengabdian" },
        { model: JadwalProposal, as: "jadwalKegiatan", include: [{ model: JadwalBulanan, as: "bulanAktif" }] },
        { model: LuaranProposal, as: "luaran" },
        { model: TahunAkademik, as: "tahunAkademik" },
        { model: Prodi, as: "prodiPengusulRelasi", attributes: ["id", "kodeProdi", "namaProdi"], required: false },
        { model: Output, as: "outputs", attributes: ["id", "namaOutput"], through: { attributes: [] } },
      ],
    });
    if (!proposal) throw HttpError.notFound("Usulan tidak ditemukan");
    if (proposal.tipe_usulan !== tipeUsulan) {
      throw createFieldError(`Tipe usulan untuk endpoint ini harus ${tipeUsulan}`);
    }

    const isKetua = await MemberProposal.findOne({
      where: { haki_proposal_id: id, no_identitas: user.nidn, peran: "Ketua" },
    });
    const canEditDecision = await this.getEditDecision(proposal, user, Boolean(isKetua));
    return this.toProposalDetail(proposal, canEditDecision.allowed);
  }

  async deleteWorkflowProposal(tipeUsulan: ProposalTipeUsulan, id: string, user: AuthenticatedUserContext, auditContext: RequestAuditContext = {}): Promise<void> {
    if (!id || id.length < 10) throw HttpError.badRequest("ID usulan tidak valid");
    const proposal = await HakiProposal.findByPk(id);
    if (!proposal) throw HttpError.notFound("Usulan tidak ditemukan");
    if (proposal.tipe_usulan !== tipeUsulan) {
      throw createFieldError(`Tipe usulan untuk endpoint ini harus ${tipeUsulan}`);
    }
    const isKetua = await MemberProposal.findOne({
      where: { haki_proposal_id: id, no_identitas: user.nidn, peran: "Ketua" },
    });
    if (proposal.user_id !== user.id && !isKetua && !isAdminUser(user)) {
      throw HttpError.forbidden("Anda tidak memiliki akses untuk menghapus usulan ini");
    }
    const before = { judul: proposal.judul, tipe_usulan: proposal.tipe_usulan };

    await sequelize.transaction(async (transaction) => {
      const jadwalRecords = await JadwalProposal.findAll({ where: { haki_proposal_id: id }, attributes: ["id"], transaction });
      const jadwalIds = jadwalRecords.map((item) => item.id);
      await Promise.all([
        MemberProposal.destroy({ where: { haki_proposal_id: id }, transaction }),
        RABProposal.destroy({ where: { haki_proposal_id: id }, transaction }),
        PenelitianProposal.destroy({ where: { haki_proposal_id: id }, transaction }),
        PengabdianProposal.destroy({ where: { haki_proposal_id: id }, transaction }),
        JadwalBulanan.destroy({ where: { jadwal_id: { [Op.in]: jadwalIds } }, transaction }),
        JadwalProposal.destroy({ where: { haki_proposal_id: id }, transaction }),
        LuaranProposal.destroy({ where: { haki_proposal_id: id }, transaction }),
      ]);
      await proposal.destroy({ transaction });
    });

    auditService.persistNonBlocking({
      action: AuditAction.DELETE,
      module: getAuditModule(tipeUsulan),
      entityId: id,
      userId: user.id,
      before,
      requestId: auditContext.requestId,
    });
  }

  async searchWorkflowProposals(tipeUsulan: ProposalTipeUsulan, body: ProposalSearchBodyDto, user: AuthenticatedUserContext): Promise<{ data: ProposalRowDto[]; total: number }> {
    const where: WhereOptions<HakiProposal> = { tipe_usulan: tipeUsulan };
    if (body.search) where.judul = { [Op.like]: `%${body.search}%` };
    if (body.status) where.status_usulan = body.status;
    const offset = (body.page - 1) * body.limit;
    const { count, rows } = await HakiProposal.findAndCountAll({
      where,
      include: [
        {
          model: MemberProposal,
          as: "members",
          where: { no_identitas: user.nidn },
          required: true,
          include: [{ model: User, as: "user", attributes: ["id", "name"] }],
        },
        { model: Output, as: "outputs", attributes: ["id", "namaOutput"], through: { attributes: [] } },
      ],
      limit: body.limit,
      offset,
      order: [["updatedAt", "DESC"]],
    });

    return {
      data: rows.map((proposal, index) => buildUsulanRow(proposal, proposal.members?.[0], index, offset)),
      total: count,
    };
  }

  async listUsulanByProdi(tipeUsulan: ProposalTipeUsulan, query: ProposalByProdiQueryDto, user: AuthenticatedUserContext): Promise<ProposalListResult> {
    const userProdiCode = getUserProdiKode(user);
    if (!userProdiCode) throw HttpError.badRequest("Prodi pengguna tidak ditemukan");
    const pagination = parsePagination(query);
    const normalizedStatus = normalizeStatusFilter(query.status);
    const proposalIds = await getProposalIdsByProdi(userProdiCode, tipeUsulan);
    if (proposalIds.length === 0) {
      return { data: [], total: 0, page: pagination.page, limit: pagination.limit };
    }
    const where: WhereOptions<HakiProposal> = {
      id: { [Op.in]: proposalIds },
      tipe_usulan: tipeUsulan,
    };
    if (query.search) where.judul = { [Op.like]: `%${query.search}%` };
    if (normalizedStatus) where.status_usulan = normalizedStatus;
    if (query.tipe) where.tipe_usulan = query.tipe;

    const { count, rows } = await HakiProposal.findAndCountAll({
      where,
      include: [
        {
          model: MemberProposal,
          as: "members",
          where: { peran: "Ketua" },
          attributes: ["id", "peran", "nama_anggota"],
          required: false,
          include: [{ model: User, as: "user", attributes: ["id", "name"] }],
        },
        { model: Output, as: "outputs", attributes: ["id", "namaOutput"], through: { attributes: [] } },
      ],
      distinct: true,
      limit: pagination.limit,
      offset: pagination.offset,
      order: [["updatedAt", "DESC"]],
    });

    return {
      data: rows.map((proposal, index) => {
        const row = buildUsulanRow(proposal, proposal.members?.find((member) => member.peran === "Ketua"), index, pagination.offset, user.id, {
          coordinatorRow: true,
          canForwardByProdi: ["Pending", "Approved"].includes(proposal.status_usulan) && proposal.tipe === "umum",
        });
        return { ...row, canEdit: proposal.status_usulan === "Draft" };
      }),
      total: count,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async submitWorkflowProposal(
    tipeUsulan: ProposalTipeUsulan,
    id: string,
    user: AuthenticatedUserContext,
    auditContext: RequestAuditContext = {},
  ): Promise<SubmitProposalResponseDto> {
    const proposal = await HakiProposal.findByPk(id);
    if (!proposal) throw HttpError.notFound("Usulan tidak ditemukan");
    if (proposal.tipe_usulan !== tipeUsulan) throw HttpError.badRequest(`Usulan bukan tipe ${tipeUsulan.toLowerCase()}`);
    const isKetua = await MemberProposal.findOne({
      where: { haki_proposal_id: id, no_identitas: user.nidn, peran: "Ketua" },
    });
    if (!isKetua) throw HttpError.forbidden("Hanya ketua yang dapat submit usulan");
    if (!["Draft", "Declined"].includes(proposal.status_usulan)) {
      throw HttpError.badRequest(`Usulan dengan status ${proposal.status_usulan} tidak dapat disubmit`);
    }
    const ketuaCount = await MemberProposal.count({ where: { haki_proposal_id: id, peran: "Ketua" } });
    if (ketuaCount === 0) {
      throw createFieldError("Usulan harus memiliki minimal 1 Ketua Pengusul sebelum disubmit");
    }
    const oldStatus = proposal.status_usulan;
    await sequelize.transaction(async (transaction) => {
      const updateData = {
        status_usulan: "Pending" as const,
        ...(proposal.status_revisi === "Belum Diperbaiki" ? { status_revisi: "Sudah Diperbaiki" as const } : {}),
      };
      await proposal.update(updateData, { transaction });
    });
    auditService.persistNonBlocking({
      action: AuditAction.SUBMIT,
      module: getAuditModule(tipeUsulan),
      entityId: proposal.id,
      userId: user.id,
      before: { status_usulan: oldStatus },
      after: { status_usulan: "Pending" },
      requestId: auditContext.requestId,
    });
    return { id: proposal.id, status: proposal.status_usulan };
  }

  async forwardWorkflowProposal(
    tipeUsulan: ProposalTipeUsulan,
    id: string,
    user: AuthenticatedUserContext,
    auditContext: RequestAuditContext = {},
  ): Promise<ForwardProposalResponseDto> {
    const forwardPermission = tipeUsulan === TIPE_USULAN_PENELITIAN ? "forward_usulan_penelitian" : "forward_usulan_pengabdian";
    const errorType = tipeUsulan === TIPE_USULAN_PENELITIAN ? "penelitian" : "pengabdian";
    const proposal = await sequelize.transaction(async (transaction) => {
      const row = await HakiProposal.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!row) throw HttpError.notFound("Usulan tidak ditemukan");
      if (row.tipe_usulan !== tipeUsulan) throw HttpError.badRequest(`Usulan bukan tipe ${errorType}`);
      const isKetua = await MemberProposal.findOne({
        where: { haki_proposal_id: id, no_identitas: user.nidn, peran: "Ketua" },
        transaction,
      });
      if (!isKetua && !hasPermission(user, forwardPermission)) {
        throw HttpError.forbidden("Hanya Ketua Pengusul atau Koordinator yang dapat meneruskan usulan ini");
      }
      if (!["Pending", "Approved"].includes(row.status_usulan)) {
        throw HttpError.badRequest(
          "Hanya usulan dengan status Pending atau Approved yang dapat diajukan sebagai Hibah Internal. Pastikan usulan sudah difinalisasi terlebih dahulu.",
        );
      }
      if (row.tipe !== "umum") throw HttpError.badRequest("Usulan ini sudah diajukan sebagai Hibah Internal sebelumnya");
      const [updatedCount] = await HakiProposal.update(
        { tipe: "hibah_internal" },
        {
          where: {
            id,
            tipe_usulan: tipeUsulan,
            status_usulan: { [Op.in]: ["Pending", "Approved"] },
            tipe: "umum",
          },
          transaction,
        },
      );
      if (updatedCount !== 1) {
        throw HttpError.badRequest("Usulan tidak memenuhi syarat untuk diajukan sebagai Hibah Internal, silakan muat ulang data");
      }
      await this.ensureHibahInternalReportRows(id, user.id, transaction);
      row.tipe = "hibah_internal";

      // Kirim notifikasi ke ketua usulan bahwa usulan sudah diforward.
      // id v4 (randomUUID) dihasilkan di dalam createNotification — konsisten data produksi.
      await notificationService.createNotification(
        {
          userId: row.user_id, // ketua usulan
          type: "forward_usulan",
          relatedType: "haki_proposal",
          relatedId: row.id,
          title: "Usulan Berhasil Diteruskan",
          message: `Usulan "${row.judul}" Anda telah diteruskan ke tahap selanjutnya`,
          metadata: {
            proposal_id: row.id,
            proposal_judul: row.judul,
            tipe: tipeUsulan === TIPE_USULAN_PENELITIAN ? "penelitian" : "pengabdian",
            forwarded_by: user.id,
          },
        },
        transaction,
      );

      return row;
    });

    auditService.persistNonBlocking({
      action: AuditAction.FORWARD,
      module: getAuditModule(tipeUsulan),
      entityId: id,
      userId: user.id,
      before: { tipe: "umum" },
      after: { tipe: "hibah_internal" },
      requestId: auditContext.requestId,
    });
    return { id, tipe: "hibah_internal", status: proposal.status_usulan };
  }

  async listPublicWorkflow(tipeUsulan: ProposalTipeUsulan, query: PublicLandingQuerySchema): Promise<{ data: Array<{ id: string; ketua: string; judul: string; bidangFokus: string; tahunPelaksanaan: number }>; meta: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number } }> {
    const where: WhereOptions<HakiProposal> = { tipe_usulan: tipeUsulan, status_usulan: "Approved" };
    if (query.q) where.judul = { [Op.like]: `%${query.q}%` };
    if (query.bidang_fokus) where.bidang_fokus = query.bidang_fokus;
    const offset = (query.page - 1) * query.limit;
    const { count, rows } = await HakiProposal.findAndCountAll({
      where,
      include: [
        {
          model: MemberProposal,
          as: "members",
          where: { peran: "Ketua" },
          required: false,
          include: [{ model: User, as: "user", attributes: ["id", "name"] }],
        },
      ],
      limit: query.limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
    return {
      data: rows.map((proposal) => {
        const ketuaMember = proposal.members?.[0] ?? null;
        return {
          id: proposal.id,
          ketua: ketuaMember?.user?.name || "",
          judul: proposal.judul || "",
          bidangFokus: proposal.bidang_fokus || "",
          tahunPelaksanaan: buildPublicYear(proposal.tahun_pelaksanaan),
        };
      }),
      meta: {
        currentPage: query.page,
        totalPages: Math.ceil(count / query.limit),
        totalItems: count,
        itemsPerPage: query.limit,
      },
    };
  }

  async getDropdownOptions(): Promise<DropdownOptionsDto> {
    return getDropdownOptions();
  }

  private validateCreateMeta(tipeUsulan: ProposalTipeUsulan, meta: ProposalMetaInput): NormalizedCreateProposalMeta {
    const judul = sanitizeErrorLeak(requireString(meta.judul, "Judul wajib diisi"));
    if (judul.length < 10) throw createFieldError("Judul minimal 10 karakter");
    if (judul.length > 1000) throw createFieldError("Judul maksimal 1000 karakter");
    const bidangFokus = requireString(meta.bidang_fokus, "Bidang fokus wajib dipilih");
    const prodiPengusul = requireString(meta.prodi_pengusul, "Program studi wajib dipilih");
    const skema = requireString(meta.skema, tipeUsulan === TIPE_USULAN_PENGABDIAN ? "Skema pengabdian wajib dipilih" : "Skema penelitian wajib dipilih");
    const sumberDana = sanitizeErrorLeak(requireString(meta.sumber_dana, "Sumber dana wajib diisi"));
    if (sumberDana.length > 200) throw createFieldError("Sumber dana maksimal 200 karakter");
    if (meta.tipe_usulan && meta.tipe_usulan !== tipeUsulan) throw createFieldError(`Tipe usulan untuk endpoint ini harus ${tipeUsulan}`);
    const jumlahDanaRaw = parseCurrencyValue(meta.jumlah_dana, "jumlah_dana");
    if (jumlahDanaRaw > 10000000000000) throw createFieldError("Jumlah dana melebihi batas maksimum (10 Triliun)");
    const jumlahDana = assertMoneyRange(jumlahDanaRaw, "jumlah_dana", false);
    const normalizedDuration = assertValidDuration(meta.tahun_pelaksanaan);
    return {
      ...meta,
      judul,
      bidang_fokus: bidangFokus,
      prodi_pengusul: prodiPengusul,
      skema,
      sumber_dana: sumberDana,
      jumlah_dana: jumlahDana,
      tahun_pelaksanaan: normalizedDuration,
      keterlibatan_lain: meta.keterlibatan_lain ? sanitizeErrorLeak(meta.keterlibatan_lain) : null,
    };
  }

  private validateUpdateMeta(tipeUsulan: ProposalTipeUsulan, meta: ProposalMetaInput): ProposalMetaInput {
    if (meta.tipe_usulan && meta.tipe_usulan !== tipeUsulan) throw createFieldError(`Tipe usulan untuk endpoint ini harus ${tipeUsulan}`);
    const next: ProposalMetaInput = { ...meta };
    if (next.judul !== undefined) {
      next.judul = sanitizeErrorLeak(next.judul ?? "");
      if (next.judul.trim().length > 0 && next.judul.trim().length < 10) throw createFieldError("Judul minimal 10 karakter");
    }
    if (next.sumber_dana !== undefined && next.sumber_dana !== null) next.sumber_dana = sanitizeErrorLeak(next.sumber_dana);
    if (next.keterlibatan_lain !== undefined && next.keterlibatan_lain !== null) next.keterlibatan_lain = sanitizeErrorLeak(next.keterlibatan_lain);
    if (next.jumlah_dana !== undefined) next.jumlah_dana = assertMoneyRange(parseCurrencyValue(next.jumlah_dana, "jumlah_dana"), "jumlah_dana", false);
    if (next.prodi_pengusul !== undefined && String(next.prodi_pengusul).trim().length === 0) throw createFieldError("Program studi wajib dipilih");
    if (next.tahun_pelaksanaan) next.tahun_pelaksanaan = assertValidDuration(next.tahun_pelaksanaan);
    return next;
  }

  private validateCreateMembers(members: ProposalMemberInput[], user: AuthenticatedUserContext, allowCreatorOutsideTeam: boolean): void {
    if (!Array.isArray(members) || members.length === 0) throw createFieldError("Tim pengusul wajib diisi minimal 1 anggota");
    this.validateUpdateMembers(members, true);
    const isPengusulInTim = members.some((member) => member.noIdentitas && user.nidn && String(member.noIdentitas) === String(user.nidn));
    if (!allowCreatorOutsideTeam && !isPengusulInTim) {
      throw createFieldError("Pengusul wajib terdaftar sebagai bagian Tim Pengusul");
    }
  }

  private validateUpdateMembers(members: ProposalMemberInput[], requireKetua = true): void {
    const ketuaCount = members.filter((member) => member.peran === "Ketua").length;
    if (requireKetua && ketuaCount === 0) throw createFieldError("Harus ada minimal 1 Ketua Pengusul");
    if (ketuaCount > 1) throw createFieldError("Hanya boleh ada 1 Ketua Pengusul");
    const missingBidangTugas = members.some((member) => !member.bidang_tugas || String(member.bidang_tugas).trim().length === 0);
    if (missingBidangTugas) throw createFieldError("Bidang tugas wajib diisi untuk semua anggota");
  }

  private async createMemberRows(proposalId: string, members: ProposalMemberInput[], user: AuthenticatedUserContext, transaction: Transaction): Promise<void> {
    const seenIdentitas = new Set<string>();
    const rows: Array<{
      id: string;
      haki_proposal_id: string;
      no_identitas: string | null;
      peran: MemberProposalPeran;
      bidang_tugas: string | null;
      status_invite: "accepted";
      invited_by_user_id: string;
      nama_anggota: string | null;
      status: "Mahasiswa" | "Dosen";
      institusi_anggota: string | null;
      prodi_anggota: string | null;
      prodi_kode_anggota: string | null;
    }> = [];

    for (const member of members) {
      const noIdentitas = member.noIdentitas ? String(member.noIdentitas) : null;
      if (!noIdentitas || noIdentitas === "-") {
        if (!member.nama || !member.noIdentitas) throw createFieldError("Anggota wajib dilengkapi nama & No Identitas (NIDN/NRP)");
      }
      if (noIdentitas && seenIdentitas.has(noIdentitas)) continue;
      if (noIdentitas) seenIdentitas.add(noIdentitas);

      const resolvedMember = noIdentitas ? await resolveMemberIdentity(noIdentitas, transaction) : null;
      const isMahasiswa = resolvedMember?.source === "mahasiswa";
      const row = {
        id: generateUuidV7(),
        haki_proposal_id: proposalId,
        no_identitas: noIdentitas,
        peran: member.peran || "Anggota",
        bidang_tugas: member.bidang_tugas || null,
        status_invite: "accepted" as const,
        invited_by_user_id: user.id,
        nama_anggota: member.nama || resolvedMember?.displayName || "",
        status: isMahasiswa ? "Mahasiswa" as const : "Dosen" as const,
        institusi_anggota: member.institusi || (isMahasiswa ? "Institut Teknologi Indonesia" : null) || resolvedMember?.institusi || null,
        prodi_anggota: member.programStudi || resolvedMember?.prodi || null,
        prodi_kode_anggota: member.programStudiKode || resolvedMember?.prodiKode || null,
      };
      assertCompleteMemberRow(row, rows.length);
      rows.push(row);
    }

    if (rows.length > 0) await MemberProposal.bulkCreate(rows, { transaction });
  }

  private async assertCanEditProposal(proposal: HakiProposal, user: AuthenticatedUserContext): Promise<void> {
    const isKetua = await MemberProposal.findOne({
      where: { haki_proposal_id: proposal.id, no_identitas: user.nidn, peran: "Ketua" },
    });
    const isWithinUserProdiResult = hasPermission(user, "edit_usulan_by_prodi")
      ? await isProposalWithinUserProdi(proposal.id, getUserProdiKode(user))
      : false;
    const editDecision = resolveProposalDraftEditDecision({
      user,
      proposalStatus: proposal.status_usulan,
      proposalTipeUsulan: proposal.tipe_usulan,
      isKetua: Boolean(isKetua),
      isWithinUserProdi: isWithinUserProdiResult,
    });
    if (!editDecision.allowed) throw HttpError.forbidden(editDecision.message ?? "Anda tidak memiliki akses untuk mengedit usulan ini.");
  }

  private async getEditDecision(proposal: HakiProposal, user: AuthenticatedUserContext, isKetua: boolean) {
    const isWithinUserProdiResult = hasPermission(user, "edit_usulan_by_prodi")
      ? await isProposalWithinUserProdi(proposal.id, getUserProdiKode(user))
      : false;
    return resolveProposalDraftEditDecision({
      user,
      proposalStatus: proposal.status_usulan,
      proposalTipeUsulan: proposal.tipe_usulan,
      isKetua,
      isWithinUserProdi: isWithinUserProdiResult,
    });
  }

  private toProposalDetail(proposal: HakiProposal, canEdit: boolean): ProposalDetailDto {
    const anggotaList: ProposalDetailMemberDto[] = (proposal.members ?? []).map((member) => ({
      id: member.id,
      nama: member.nama_anggota || member.mahasiswa?.nama || member.user?.name || "",
      peran: member.peran || "Anggota",
      bidang_tugas: member.bidang_tugas || "",
      programStudi:
        member.prodi_anggota ||
        member.user?.prodiRelation?.namaProdi ||
        member.mahasiswa?.prodiRelasi?.namaProdi ||
        "",
      programStudiKode:
        member.prodi_kode_anggota ||
        member.user?.prodiRelation?.kodeProdi ||
        member.mahasiswa?.prodiRelasi?.kodeProdi ||
        "",
      noIdentitas: member.no_identitas || member.user?.nidn || member.mahasiswa?.nrp || "",
      institusi: member.institusi_anggota || member.user?.institusi || "",
      status: member.status || "Dosen",
      status_invite: member.status_invite || "accepted",
      role: member.status || normalizeRoleLabel(member.user?.roles?.[0]?.name || member.user?.role?.name || null) || "Dosen",
    }));

    const rabList: ProposalRabDto[] = (proposal.rab ?? []).map((item) => ({
      tahun_ke: item.tahun_ke || "",
      kelompok: item.kelompok || "",
      komponen: item.komponen || "",
      item: item.item || "",
      satuan: item.satuan || "",
      biaya_satuan: Number(item.biaya_satuan || 0),
      volume: Number(item.volume || 0),
      total_biaya: Number(item.total_biaya || 0),
    }));
    const totalBiaya = rabList.reduce((acc, item) => acc + Number(item.total_biaya || 0), 0);
    const outputs = proposal.outputs ?? [];
    return {
      id: proposal.id,
      status_usulan: proposal.status_usulan,
      tipe_usulan: proposal.tipe_usulan,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
      can_edit: canEdit,
      catatan_revisi: proposal.catatan_revisi,
      status_revisi: proposal.status_revisi,
      meta: {
        judul: proposal.judul || "",
        bidang_fokus: proposal.bidang_fokus || "",
        skema: proposal.kelompok_skema || "",
        sumber_dana: proposal.sumber_dana || "",
        jumlah_dana: proposal.jumlah_dana || 0,
        keterlibatan_lain: proposal.keterlibatan_lain || "",
        output_penelitian: outputs.length > 0 ? outputs.map((output) => output.namaOutput).join(", ") : null,
        output_ids: outputs.map((output) => output.id),
        tipe_usulan: proposal.tipe_usulan || "",
        tahun_pelaksanaan: proposal.tahun_pelaksanaan || "",
        prodi_pengusul: proposal.prodi_pengusul || "",
        prodi_pengusul_nama: proposal.prodiPengusulRelasi?.namaProdi || "",
        tipe: proposal.tipe || "umum",
        tahun_akademik_id: proposal.tahun_akademik_id || null,
        tahun_akademik: mapTahunAkademikResponse(proposal.tahunAkademik),
      },
      substansi_penelitian: proposal.substansiPenelitian ? proposal.substansiPenelitian.toJSON() : null,
      substansi_pengabdian: proposal.substansiPengabdian ? proposal.substansiPengabdian.toJSON() : null,
      jadwal: proposal.jadwalKegiatan ? proposal.jadwalKegiatan.map((item) => item.toJSON()) : [],
      luaran: proposal.luaran ? proposal.luaran.map((item) => item.toJSON()) : [],
      anggota: anggotaList,
      rab: rabList,
      total_biaya: totalBiaya,
    };
  }

  private async ensureHibahInternalReportRows(proposalId: string, userId: string, transaction: Transaction): Promise<void> {
    const reportTypes = ["laporan_kemajuan", "laporan_akhir"] as const;
    for (const jenisLaporan of reportTypes) {
      const existing = await LaporanUsulan.findOne({
        where: { haki_proposal_id: proposalId, jenis_laporan: jenisLaporan, scope_tipe: "hibah_internal" },
        transaction,
      });
      if (!existing) {
        await LaporanUsulan.create(
          {
            haki_proposal_id: proposalId,
            ketua_user_id: userId,
            jenis_laporan: jenisLaporan,
            scope_tipe: "hibah_internal",
            status_laporan: "Lengkapi Dokumen",
            last_uploaded_at: null,
            last_replaced_at: null,
            replace_count: 0,
          },
          { transaction },
        );
      }
    }
  }
}

function getPrimaryCoordinator(user: AuthenticatedUserContext): boolean {
  const roleName = user.roles[0]?.name ?? "";
  return roleName.startsWith("koordinator_") || roleName === "kaprodi";
}

export const proposalService = new ProposalService();
