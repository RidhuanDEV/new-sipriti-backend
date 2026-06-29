import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { PROPOSAL_REVIEW_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { HttpError } from "../../core/errors/http-error.js";
import { Output } from "../output/output.model.js";
import { Prodi } from "../prodi/prodi.model.js";
import { TahunAkademik } from "../tahunakademik/tahunakademik.model.js";
import { JadwalBulanan } from "../jadwal-proposal/jadwal-bulanan.model.js";
import { JadwalProposal } from "../jadwal-proposal/jadwal-proposal.model.js";
import { LuaranProposal } from "../luaran-proposal/luaran-proposal.model.js";
import { notificationService } from "../notification/notification.service.js";
import { PengabdianProposal } from "../pengabdian-proposal/pengabdian-proposal.model.js";
import { PenelitianProposal } from "../penelitian-proposal/penelitian-proposal.model.js";
import { LaporanUsulan } from "../proposal/laporan-usulan.model.js";
import { Mahasiswa } from "../proposal/mahasiswa.model.js";
import { MemberProposal } from "../proposal/member-proposal.model.js";
import { HakiProposal, type ProposalStatus, type ProposalTipeUsulan } from "../proposal/proposal.model.js";
import { RABProposal } from "../rab-proposal/rab-proposal.model.js";
import { Skema } from "../skema/skema.model.js";
import { User } from "../user/user.model.js";
import {
  getPrimaryRoleName,
  getUserProdiKode,
  hasPermission,
  isAdminUser,
  mapTahunAkademikResponse,
  TIPE_USULAN_PENGABDIAN,
  TIPE_USULAN_PENELITIAN,
} from "../proposal/proposal.helpers.js";
import { resolveProposalDraftEditDecision } from "../proposal/policies/proposal.policy.js";
import type { Transaction, WhereOptions } from "sequelize";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { ReviewListQuery, ReviewType } from "./proposal-review.schema.js";

interface ReviewAccessContext {
  user: AuthenticatedUserContext;
  isAdmin: boolean;
  prodiKode: string;
  allowedTipeUsulan: ProposalTipeUsulan[] | null;
}

type ProposalReviewWhere = WhereOptions<HakiProposal> & {
  id?: string;
  judul?: { [Op.like]: string };
  prodi_pengusul?: string;
  status_usulan?: ProposalStatus;
  tahun_akademik_id?: string;
  tipe_usulan?: ProposalTipeUsulan | { [Op.in]: ProposalTipeUsulan[] };
};

interface ReviewCounts {
  draft: number;
  pending: number;
  approved: number;
  declined: number;
}

interface ReviewPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

interface ReviewListRow {
  id: string;
  no: number;
  judul: string;
  ketua: {
    id: string | null;
    nama: string;
    nidn: string;
    prodi: string;
    email: string;
  };
  skema: string;
  bidangFokus: string;
  lamaKegiatan: string;
  outputPenelitian: string | null;
  status: string;
  canEdit: boolean;
  isFinalReportValidated: boolean;
  tipe: string;
  tipeUsulan: string;
  tahunAkademik: ReturnType<typeof mapTahunAkademikResponse>;
  catatan_revisi: string | null;
  dokumenUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ReviewDetailMember {
  id: string;
  nama: string;
  peran: string;
  bidang_tugas: string;
  programStudi: string;
  noIdentitas: string;
  institusi: string;
  status_invite: string;
  status: string | null;
  role: string | null;
}

interface ReviewDetail {
  id: string;
  status_usulan: string;
  tipe_usulan: string;
  can_edit: boolean;
  catatan_revisi: string | null;
  status_revisi: string;
  meta: {
    judul: string;
    bidang_fokus: string;
    skema: string;
    sumber_dana: string;
    jumlah_dana: string | number | null;
    keterlibatan_lain: string;
    output_penelitian: string | null;
    output_ids: string[];
    tipe_usulan: string;
    tahun_pelaksanaan: string;
    prodi_pengusul: string;
    prodi_pengusul_nama: string;
    tipe: string;
    tahun_akademik_id: string | null;
    tahun_akademik: ReturnType<typeof mapTahunAkademikResponse>;
  };
  substansi_penelitian: object | null;
  substansi_pengabdian: object | null;
  jadwal: object[];
  luaran: object[];
  anggota: ReviewDetailMember[];
  rab: object[];
  total_biaya: number;
  dokumen: { urlArtikel: string | null; fileUrl: string | null } | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserProposalPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

type ProposalIncludeMember = HakiProposal & {
  members?: MemberProposal[];
  outputs?: Output[];
  tahunAkademik?: TahunAkademik | null;
  prodiPengusulRelasi?: Prodi | null;
};

const REVIEW_TYPE_TO_TIPE_USULAN: Partial<Record<ReviewType, ProposalTipeUsulan | null>> = {
  penelitian: TIPE_USULAN_PENELITIAN,
  pengabdian: TIPE_USULAN_PENGABDIAN,
  hki: null,
  all: null,
};

function getRequestId(headers: { readonly [key: string]: string | string[] | undefined }): string | undefined {
  const value = headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

function isCoordinatorForTipe(user: AuthenticatedUserContext, tipeUsulan: ProposalTipeUsulan): boolean {
  const roleName = getPrimaryRoleName(user);
  if (tipeUsulan === TIPE_USULAN_PENELITIAN) {
    return roleName === "koordinator_penelitian" && hasPermission(user, "manage_penelitian");
  }
  return roleName === "koordinator_pengabdian" && hasPermission(user, "manage_pengabdian");
}

function buildReviewAccessContext(user: AuthenticatedUserContext, requestedType: ReviewType): ReviewAccessContext {
  if (isAdminUser(user)) {
    return { user, isAdmin: true, prodiKode: "", allowedTipeUsulan: null };
  }

  const reviewableTipeUsulan: ProposalTipeUsulan[] = [TIPE_USULAN_PENELITIAN, TIPE_USULAN_PENGABDIAN];
  const allowedTipeUsulan = reviewableTipeUsulan.filter((tipeUsulan) =>
    isCoordinatorForTipe(user, tipeUsulan),
  );

  if (allowedTipeUsulan.length === 0) {
    return { user, isAdmin: false, prodiKode: "", allowedTipeUsulan: null };
  }

  if (requestedType === "hki") {
    throw HttpError.forbidden("Anda tidak memiliki akses untuk review tipe proposal ini.");
  }

  const requestedTipeUsulan = REVIEW_TYPE_TO_TIPE_USULAN[requestedType] ?? null;
  if (requestedTipeUsulan && !allowedTipeUsulan.includes(requestedTipeUsulan)) {
    throw HttpError.forbidden("Anda tidak memiliki akses untuk review tipe proposal ini.");
  }

  const prodiKode = getUserProdiKode(user);
  if (!prodiKode) throw HttpError.forbidden("Akun koordinator belum terhubung dengan program studi.");
  return { user, isAdmin: false, prodiKode, allowedTipeUsulan };
}

function applyReviewAccessScope(where: ProposalReviewWhere, accessContext: ReviewAccessContext): void {
  if (accessContext.isAdmin || !accessContext.allowedTipeUsulan) return;
  where.prodi_pengusul = accessContext.prodiKode;
  if (where.tipe_usulan) return;
  const [singleAllowedType] = accessContext.allowedTipeUsulan;
  where.tipe_usulan =
    accessContext.allowedTipeUsulan.length === 1 && singleAllowedType
      ? singleAllowedType
      : { [Op.in]: accessContext.allowedTipeUsulan };
}

function assertCanReviewProposal(proposal: HakiProposal, accessContext: ReviewAccessContext): void {
  if (accessContext.isAdmin || !accessContext.allowedTipeUsulan) return;
  const sameProdi = proposal.prodi_pengusul === accessContext.prodiKode;
  const sameType = accessContext.allowedTipeUsulan.includes(proposal.tipe_usulan);
  if (!sameProdi || !sameType) {
    throw HttpError.forbidden("Anda tidak memiliki akses untuk melihat proposal ini.");
  }
}

function applyTypeAndQueryFilters(where: ProposalReviewWhere, type: ReviewType, query: ReviewListQuery): void {
  const tipeUsulan = REVIEW_TYPE_TO_TIPE_USULAN[type] ?? null;
  if (tipeUsulan) where.tipe_usulan = tipeUsulan;
  if (type === "hki") where.id = "__proposal_review_hki_no_match__";
  if (query.status && query.status !== "all") {
    const statusMap: Record<Exclude<NonNullable<ReviewListQuery["status"]>, "all">, ProposalStatus> = {
      draft: "Draft",
      pending: "Pending",
      approved: "Approved",
      declined: "Declined",
    };
    where.status_usulan = statusMap[query.status];
  } else if (!query.status) {
    where.status_usulan = "Pending";
  }
  if (query.search) where.judul = { [Op.like]: `%${query.search}%` };
  if (query.prodi) where.prodi_pengusul = query.prodi;
  if (query.tahun_akademik_id) where.tahun_akademik_id = query.tahun_akademik_id;
  if (query.tipe_usulan) where.tipe_usulan = query.tipe_usulan;
  if (type === "all" && query.tipe) where.tipe_usulan = query.tipe;
}

async function buildFinalReportValidationMap(proposalIds: string[]): Promise<Map<string, boolean>> {
  const uniqueIds = Array.from(new Set(proposalIds.filter((value) => value.length > 0)));
  if (uniqueIds.length === 0) return new Map();
  const rows = await LaporanUsulan.findAll({
    where: {
      haki_proposal_id: { [Op.in]: uniqueIds },
      jenis_laporan: "laporan_akhir",
      scope_tipe: "hibah_internal",
      status_laporan: "Sesuai",
    },
    attributes: ["haki_proposal_id"],
  });
  const validIds = new Set(rows.map((row) => row.haki_proposal_id));
  return new Map(uniqueIds.map((id) => [id, validIds.has(id)]));
}

function getKetuaMember(proposal: ProposalIncludeMember): MemberProposal | null {
  return proposal.members?.find((member) => member.peran === "Ketua") ?? null;
}

function outputText(outputs: Output[] | undefined): string | null {
  if (!outputs || outputs.length === 0) return null;
  return outputs.map((output) => output.namaOutput).join(", ");
}

function toReviewListRow(
  proposal: ProposalIncludeMember,
  no: number,
  finalReportValidation: Map<string, boolean>,
  accessContext: ReviewAccessContext,
): ReviewListRow {
  const ketuaMember = getKetuaMember(proposal);
  const ketuaUser = ketuaMember?.user ?? null;
  return {
    id: proposal.id,
    no,
    judul: proposal.judul,
    ketua: {
      id: ketuaUser?.id ?? null,
      nama: ketuaMember?.nama_anggota || ketuaUser?.name || "",
      nidn: ketuaMember?.no_identitas || ketuaUser?.nidn || "",
      prodi: ketuaMember?.prodi_anggota || ketuaUser?.prodiRelation?.namaProdi || "",
      email: ketuaUser?.email ?? "",
    },
    skema: proposal.kelompok_skema ?? "",
    bidangFokus: proposal.bidang_fokus ?? "",
    lamaKegiatan: proposal.tahun_pelaksanaan ?? "",
    outputPenelitian: outputText(proposal.outputs),
    status: proposal.status_usulan,
    canEdit: resolveProposalDraftEditDecision({
      user: accessContext.user,
      proposalStatus: proposal.status_usulan,
      proposalTipeUsulan: proposal.tipe_usulan,
      isKetua: false,
      isWithinUserProdi: Boolean(accessContext.prodiKode) && proposal.prodi_pengusul === accessContext.prodiKode,
    }).allowed,
    isFinalReportValidated: finalReportValidation.get(proposal.id) === true,
    tipe: proposal.tipe,
    tipeUsulan: proposal.tipe_usulan,
    tahunAkademik: mapTahunAkademikResponse(proposal.tahunAkademik),
    catatan_revisi: proposal.catatan_revisi,
    dokumenUrl: proposal.file_url,
    createdAt: proposal.createdAt,
    updatedAt: proposal.updatedAt,
  };
}

function toPagination(page: number, limit: number, totalItems: number, withFlags = false): ReviewPagination {
  const totalPages = Math.ceil(totalItems / limit);
  const pagination: ReviewPagination = {
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
  };
  if (withFlags) {
    pagination.hasNextPage = page < totalPages;
    pagination.hasPrevPage = page > 1;
  }
  return pagination;
}

function parseJsonObject(value: object | null | undefined): object | null {
  return value ?? null;
}

async function mapDetailMembers(proposalMembers: MemberProposal[]): Promise<ReviewDetailMember[]> {
  const missingMahasiswaNames = Array.from(
    new Set(
      proposalMembers
        .filter((member) => !member.no_identitas && String(member.status ?? "").toLowerCase() === "mahasiswa" && String(member.nama_anggota ?? "").trim())
        .map((member) => String(member.nama_anggota ?? "").trim()),
    ),
  );
  const inferredMahasiswaByName = new Map<string, Mahasiswa>();
  if (missingMahasiswaNames.length > 0) {
    const mahasiswaRows = await Mahasiswa.findAll({
      where: { nama: { [Op.in]: missingMahasiswaNames } },
      include: [{ model: Prodi, as: "prodiRelasi", attributes: ["kodeProdi", "namaProdi"], required: false }],
    });
    for (const name of missingMahasiswaNames) {
      const matches = mahasiswaRows.filter((row) => row.nama === name);
      const match = matches[0];
      if (matches.length === 1 && match) inferredMahasiswaByName.set(name, match);
    }
  }

  return proposalMembers.map((member) => {
    const inferredMahasiswa = member.mahasiswa ?? inferredMahasiswaByName.get(String(member.nama_anggota ?? "").trim()) ?? null;
    return {
      id: member.id,
      nama: member.nama_anggota || member.user?.name || inferredMahasiswa?.nama || "",
      peran: member.peran || "Anggota",
      bidang_tugas: member.bidang_tugas || "",
      programStudi:
        member.prodi_anggota ||
        member.user?.prodiRelation?.namaProdi ||
        inferredMahasiswa?.prodiRelasi?.namaProdi ||
        "",
      noIdentitas: member.no_identitas || member.user?.nidn || inferredMahasiswa?.nrp || "",
      institusi: member.institusi_anggota || member.user?.institusi || "",
      status_invite: member.status_invite || "accepted",
      status: member.status || (inferredMahasiswa ? "Mahasiswa" : null),
      role: member.status || (inferredMahasiswa ? "Mahasiswa" : null),
    };
  });
}

async function createApprovalReportRow(proposal: HakiProposal, ketuaUserId: string | null, transaction: Transaction): Promise<void> {
  const scopeTipe = proposal.tipe === "hibah_internal" ? "hibah_internal" : "umum";
  const jenisLaporan = proposal.tipe === "hibah_internal" ? "laporan_kemajuan" : "laporan_akhir";
  const existing = await LaporanUsulan.findOne({
    where: { haki_proposal_id: proposal.id, jenis_laporan: jenisLaporan, scope_tipe: scopeTipe },
    transaction,
  });
  if (!existing) {
    await LaporanUsulan.create(
      {
        haki_proposal_id: proposal.id,
        ketua_user_id: ketuaUserId,
        jenis_laporan: jenisLaporan,
        scope_tipe: scopeTipe,
        status_laporan: "Lengkapi Dokumen",
        replace_count: 0,
      },
      { transaction },
    );
  }
}

export class ProposalReviewService {
  async getProposalsForReview(
    type: ReviewType,
    query: ReviewListQuery,
    user: AuthenticatedUserContext,
  ): Promise<{ proposals: ReviewListRow[]; meta: { pagination: ReviewPagination; counts: ReviewCounts } }> {
    const where: ProposalReviewWhere = {};
    applyTypeAndQueryFilters(where, type, query);
    const accessContext = buildReviewAccessContext(user, type);
    applyReviewAccessScope(where, accessContext);
    const offset = (query.page - 1) * query.limit;

    const { count, rows } = await HakiProposal.findAndCountAll({
      where,
      distinct: true,
      include: [
        {
          model: MemberProposal,
          as: "members",
          required: false,
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "nidn", "email", "prodiKode"],
              include: [{ model: Prodi, as: "prodiRelation", attributes: ["id", "kodeProdi", "namaProdi"], required: false }],
              required: false,
            },
          ],
        },
        { model: TahunAkademik, as: "tahunAkademik", required: false },
        { model: Prodi, as: "prodiPengusulRelasi", attributes: ["id", "kodeProdi", "namaProdi"], required: false },
        { model: Output, as: "outputs", attributes: ["id", "namaOutput"], through: { attributes: [] } },
      ],
      limit: query.limit,
      offset,
      order: [["status_usulan", "ASC"], ["updatedAt", "DESC"]],
    });

    const finalMap = await buildFinalReportValidationMap(rows.map((proposal) => proposal.id));
    const countWhere = { ...where };
    const [draft, pending, approved, declined] = await Promise.all([
      HakiProposal.count({ where: { ...countWhere, status_usulan: "Draft" } }),
      HakiProposal.count({ where: { ...countWhere, status_usulan: "Pending" } }),
      HakiProposal.count({ where: { ...countWhere, status_usulan: "Approved" } }),
      HakiProposal.count({ where: { ...countWhere, status_usulan: "Declined" } }),
    ]);

    return {
      proposals: rows.map((proposal, index) => toReviewListRow(proposal, offset + index + 1, finalMap, accessContext)),
      meta: {
        pagination: toPagination(query.page, query.limit, count, true),
        counts: { draft, pending, approved, declined },
      },
    };
  }

  async getProposalDetailForReview(type: ReviewType, id: string, user: AuthenticatedUserContext): Promise<ReviewDetail> {
    const proposal = await HakiProposal.findByPk(id, {
      include: [
        {
          model: MemberProposal,
          as: "members",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "nidn", "email", "institusi", "prodiKode"],
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
    if (!proposal) throw HttpError.notFound("Proposal tidak ditemukan");
    const requestedTipeUsulan = REVIEW_TYPE_TO_TIPE_USULAN[type] ?? null;
    if (requestedTipeUsulan && proposal.tipe_usulan !== requestedTipeUsulan) {
      throw HttpError.badRequest(`Tipe proposal tidak sesuai dengan endpoint ${type}`);
    }
    const accessContext = buildReviewAccessContext(user, type);
    assertCanReviewProposal(proposal, accessContext);
    const anggota = await mapDetailMembers(proposal.members ?? []);
    const rab = (proposal.rab ?? []).map((row) => ({
      id: row.id,
      tahun_ke: row.tahun_ke,
      kelompok: row.kelompok,
      komponen: row.komponen,
      item: row.item,
      satuan: row.satuan,
      biaya_satuan: Number(row.biaya_satuan ?? 0),
      volume: Number(row.volume ?? 0),
      total_biaya: Number(row.total_biaya ?? 0),
      pajak: row.pajak,
      sumber_dana: row.sumber_dana,
    }));
    const totalBiaya = rab.reduce((total, row) => total + Number(row.total_biaya ?? 0), 0);

    return {
      id: proposal.id,
      status_usulan: proposal.status_usulan,
      tipe_usulan: proposal.tipe_usulan,
      can_edit: resolveProposalDraftEditDecision({
        user: accessContext.user,
        proposalStatus: proposal.status_usulan,
        proposalTipeUsulan: proposal.tipe_usulan,
        isKetua: false,
        isWithinUserProdi: Boolean(accessContext.prodiKode) && proposal.prodi_pengusul === accessContext.prodiKode,
      }).allowed,
      catatan_revisi: proposal.catatan_revisi,
      status_revisi: proposal.status_revisi ?? "Tidak Ada",
      meta: {
        judul: proposal.judul || "",
        bidang_fokus: proposal.bidang_fokus || "",
        skema: proposal.kelompok_skema || "",
        sumber_dana: proposal.sumber_dana || "",
        jumlah_dana: proposal.jumlah_dana ?? 0,
        keterlibatan_lain: proposal.keterlibatan_lain || "",
        output_penelitian: outputText(proposal.outputs),
        output_ids: (proposal.outputs ?? []).map((output) => output.id),
        tipe_usulan: proposal.tipe_usulan || "",
        tahun_pelaksanaan: proposal.tahun_pelaksanaan || "",
        prodi_pengusul: proposal.prodi_pengusul || "",
        prodi_pengusul_nama: proposal.prodiPengusulRelasi?.namaProdi || "",
        tipe: proposal.tipe || "umum",
        tahun_akademik_id: proposal.tahun_akademik_id || null,
        tahun_akademik: mapTahunAkademikResponse(proposal.tahunAkademik),
      },
      substansi_penelitian: parseJsonObject(proposal.substansiPenelitian?.toJSON()),
      substansi_pengabdian: parseJsonObject(proposal.substansiPengabdian?.toJSON()),
      jadwal: (proposal.jadwalKegiatan ?? []).map((row) => row.toJSON()),
      luaran: (proposal.luaran ?? []).map((row) => row.toJSON()),
      anggota,
      rab,
      total_biaya: totalBiaya,
      dokumen: proposal.file_url ? { urlArtikel: null, fileUrl: proposal.file_url } : null,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
    };
  }

  async approveProposal(id: string, catatan: string | null | undefined, user: AuthenticatedUserContext, requestId?: string): Promise<{ id: string; status: "Approved" }> {
    const proposal = await HakiProposal.findByPk(id);
    if (!proposal) throw HttpError.notFound("Proposal tidak ditemukan");
    assertCanReviewProposal(proposal, buildReviewAccessContext(user, proposal.tipe_usulan === "Pengabdian" ? "pengabdian" : "penelitian"));
    if (proposal.status_usulan !== "Pending") {
      throw HttpError.badRequest(`Proposal dengan status ${proposal.status_usulan} tidak dapat disetujui`);
    }

    const ketua = await MemberProposal.findOne({
      where: { haki_proposal_id: id, peran: "Ketua" },
      include: [{ model: User, as: "user", attributes: ["id"], required: false }],
    });

    await sequelize.transaction(async (transaction) => {
      const [updatedCount] = await HakiProposal.update(
        { status_usulan: "Approved" },
        { where: { id, status_usulan: "Pending" }, transaction },
      );
      if (updatedCount !== 1) {
        throw HttpError.badRequest("Proposal sudah diproses oleh reviewer lain. Silakan muat ulang halaman.");
      }
      await createApprovalReportRow(proposal, ketua?.user?.id ?? proposal.user_id, transaction);
    });

    const approvalMessage = proposal.tipe === "hibah_internal"
      ? `Proposal "${proposal.judul}" telah disetujui. Silakan lanjutkan untuk mengupload laporan kemajuan.`
      : `Proposal "${proposal.judul}" telah disetujui. Silakan lanjutkan untuk mengupload laporan akhir.`;

    await notificationService.createNotification({
      userId: proposal.user_id,
      type: "usulan_approved",
      relatedType: "haki_proposal",
      relatedId: proposal.id,
      title: "Proposal Disetujui",
      message: approvalMessage,
      metadata: { proposal_id: proposal.id, proposal_title: proposal.judul, proposal_type: proposal.tipe_usulan },
    });

    auditService.persistNonBlocking({
      action: AuditAction.APPROVE,
      module: PROPOSAL_REVIEW_MODULE,
      entityId: proposal.id,
      userId: user.id,
      before: { status_usulan: "Pending" },
      after: { status_usulan: "Approved", catatan: catatan ?? null },
      requestId,
    });
    return { id: proposal.id, status: "Approved" };
  }

  async declineProposal(id: string, catatan: string, user: AuthenticatedUserContext, requestId?: string): Promise<{ id: string; status: "Declined"; catatan: string }> {
    const proposal = await HakiProposal.findByPk(id);
    if (!proposal) throw HttpError.notFound("Proposal tidak ditemukan");
    assertCanReviewProposal(proposal, buildReviewAccessContext(user, proposal.tipe_usulan === "Pengabdian" ? "pengabdian" : "penelitian"));
    if (proposal.status_usulan !== "Pending") {
      throw HttpError.badRequest(`Proposal dengan status ${proposal.status_usulan} tidak dapat ditolak`);
    }

    await sequelize.transaction(async (transaction) => {
      const [updatedCount] = await HakiProposal.update(
        { status_usulan: "Declined", catatan_revisi: catatan, status_revisi: "Belum Diperbaiki" },
        { where: { id, status_usulan: "Pending" }, transaction },
      );
      if (updatedCount !== 1) {
        throw HttpError.badRequest("Proposal sudah diproses oleh reviewer lain. Silakan muat ulang halaman.");
      }
    });

    await notificationService.createNotification({
      userId: proposal.user_id,
      type: "usulan_rejected",
      relatedType: "haki_proposal",
      relatedId: proposal.id,
      title: "Proposal Perlu Revisi",
      message: `Proposal "${proposal.judul}" memerlukan perbaikan. Silakan cek catatan revisi dan lakukan perbaikan.`,
      metadata: { proposal_id: proposal.id, proposal_title: proposal.judul, proposal_type: proposal.tipe_usulan, catatan },
    });

    auditService.persistNonBlocking({
      action: AuditAction.DECLINE,
      module: PROPOSAL_REVIEW_MODULE,
      entityId: proposal.id,
      userId: user.id,
      before: { status_usulan: "Pending" },
      after: { status_usulan: "Declined", catatan },
      requestId,
    });
    return { id: proposal.id, status: "Declined", catatan };
  }

  async getUserRevisionProposals(userNidn: string | null, query: ReviewListQuery): Promise<{ proposals: object[]; pagination: UserProposalPagination }> {
    return this.listUserStatusProposals(userNidn, query, "Declined");
  }

  async getUserApprovedProposals(userNidn: string | null, query: ReviewListQuery): Promise<{ proposals: object[]; pagination: UserProposalPagination }> {
    return this.listUserStatusProposals(userNidn, query, "Approved");
  }

  async resubmitProposal(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<{ id: string; status: string }> {
    const member = await MemberProposal.findOne({ where: { haki_proposal_id: id, no_identitas: user.nidn, peran: "Ketua" } });
    if (!member) throw HttpError.forbidden("Hanya ketua pengusul yang dapat mengirim ulang proposal");
    const proposal = await HakiProposal.findByPk(id);
    if (!proposal) throw HttpError.notFound("Proposal tidak ditemukan");
    if (proposal.status_usulan !== "Declined") throw HttpError.badRequest("Hanya proposal revisi yang dapat dikirim ulang");
    await proposal.update({ status_usulan: "Pending", status_revisi: "Sudah Diperbaiki" });
    auditService.persistNonBlocking({
      action: AuditAction.SUBMIT,
      module: PROPOSAL_REVIEW_MODULE,
      entityId: proposal.id,
      userId: user.id,
      before: { status_usulan: "Declined", status_revisi: proposal.status_revisi },
      after: { status_usulan: "Pending", status_revisi: "Sudah Diperbaiki" },
      requestId,
    });
    return { id: proposal.id, status: "Pending" };
  }

  async getReviewStats(type: ReviewType, query: ReviewListQuery, user: AuthenticatedUserContext): Promise<{ total: number; draft: number; pending: number; approved: number; declined: number }> {
    const where: ProposalReviewWhere = {};
    applyTypeAndQueryFilters(where, type, { ...query, status: "all" });
    const accessContext = buildReviewAccessContext(user, type);
    applyReviewAccessScope(where, accessContext);
    const [total, draft, pending, approved, declined] = await Promise.all([
      HakiProposal.count({ where }),
      HakiProposal.count({ where: { ...where, status_usulan: "Draft" } }),
      HakiProposal.count({ where: { ...where, status_usulan: "Pending" } }),
      HakiProposal.count({ where: { ...where, status_usulan: "Approved" } }),
      HakiProposal.count({ where: { ...where, status_usulan: "Declined" } }),
    ]);
    return { total, draft, pending, approved, declined };
  }

  private async listUserStatusProposals(
    userNidn: string | null,
    query: ReviewListQuery,
    status: "Declined" | "Approved",
  ): Promise<{ proposals: object[]; pagination: UserProposalPagination }> {
    if (!userNidn) return { proposals: [], pagination: toPagination(query.page, query.limit, 0) };
    const proposalWhere: ProposalReviewWhere = { status_usulan: status };
    const legacyType = query.type ?? (query.tipe === "Pengabdian" ? "pengabdian" : query.tipe === "Penelitian" ? "penelitian" : "all");
    const tipeUsulan = REVIEW_TYPE_TO_TIPE_USULAN[legacyType] ?? null;
    if (tipeUsulan) proposalWhere.tipe_usulan = tipeUsulan;
    const offset = (query.page - 1) * query.limit;
    const { count, rows } = await MemberProposal.findAndCountAll({
      where: { no_identitas: userNidn, peran: "Ketua" },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "nidn"],
          required: false,
          include: [
            {
              model: Prodi,
              as: "prodiRelation",
              attributes: ["namaProdi"],
              required: false,
            },
          ],
        },
        {
          model: HakiProposal,
          as: "proposal",
          where: proposalWhere,
          include: [
            { model: TahunAkademik, as: "tahunAkademik", required: false },
            { model: Output, as: "outputs", attributes: ["id", "namaOutput"], through: { attributes: [] } },
            { model: Skema, as: "skema", required: false },
            { model: LaporanUsulan, as: "laporanUsulan", required: false },
          ],
        },
      ],
      limit: query.limit,
      offset,
      order: [["updatedAt", "DESC"]],
    });

    const proposals = rows.map((member, index) => {
      const proposal = member.proposal;
      const user = member.user;
      if (!proposal) return { no: offset + index + 1, id: "", judul: "" };

      const skemaLabel = proposal.skema?.namaSkema || proposal.kelompok_skema || "-";
      const jenisMapped = proposal.tipe_usulan === "Pengabdian" ? "pengabdian" : "penelitian";

      if (status === "Approved") {
        const laporanList = proposal.laporanUsulan ?? [];
        const requiredJenis = proposal.tipe === "hibah_internal" ? "laporan_kemajuan" : "laporan_akhir";
        const requiredScope = proposal.tipe === "hibah_internal" ? "hibah_internal" : "umum";
        const matchingLaporan = laporanList.find(
          (l) => l.jenis_laporan === requiredJenis && l.scope_tipe === requiredScope
        );
        const hasLaporan = !!matchingLaporan?.file_url;
        const berkas = matchingLaporan?.file_url || null;
        const statusLabel = hasLaporan ? "Submitted" : "Unsubmit";

        return {
          id: proposal.id,
          no: offset + index + 1,
          jenis: jenisMapped,
          judul: proposal.judul,
          program: proposal.tipe_usulan,
          skema: skemaLabel,
          status: statusLabel,
          tahunPelaksanaan: proposal.tahun_pelaksanaan || new Date().getFullYear(),
          outputPenelitian: outputText(proposal.outputs),
          berkas,
          updatedAt: proposal.updatedAt,
        };
      }

      return {
        id: proposal.id,
        no: offset + index + 1,
        jenis: jenisMapped,
        judul: proposal.judul,
        tipeUsulan: proposal.tipe_usulan,
        skema: skemaLabel,
        bidang_fokus: proposal.bidang_fokus || "-",
        status: proposal.status_usulan,
        catatan_revisi: proposal.catatan_revisi,
        statusRevisi: proposal.status_revisi || "Tidak Ada",
        total_biaya: Number(proposal.jumlah_dana ?? 0),
        tahun_pelaksanaan: proposal.tahun_pelaksanaan || "-",
        tahun_akademik: mapTahunAkademikResponse(proposal.tahunAkademik),
        peran_anggota: member.peran,
        ketua: {
          id: user?.id || null,
          nama: user?.name || member.nama_anggota || "-",
          nidn: user?.nidn || member.no_identitas || "-",
          prodi: user?.prodiRelation?.namaProdi || member.prodi_anggota || "-",
        },
        outputPenelitian: outputText(proposal.outputs),
        dokumenUrl: proposal.file_url,
        updatedAt: proposal.updatedAt,
      };
    });
    return { proposals, pagination: toPagination(query.page, query.limit, count) };
  }

  getRequestId = getRequestId;
}

export const proposalReviewService = new ProposalReviewService();
