import { Op } from "sequelize";
import { HttpError } from "../../core/errors/http-error.js";
import { Prodi } from "../prodi/prodi.model.js";
import { TahunAkademik } from "../tahunakademik/tahunakademik.model.js";
import { User } from "../user/user.model.js";
import { HakiProposal, type ProposalStatus, type ProposalTipeUsulan } from "./proposal.model.js";
import { MemberProposal } from "./member-proposal.model.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type {
  ProposalByProdiQueryDto,
  ProposalListQueryDto,
  ProposalMetaInput,
  ProposalRowDto,
  TahunAkademikResponseDto,
} from "./dto/proposal.dto.js";

export const TIPE_USULAN_PENELITIAN = "Penelitian";
export const TIPE_USULAN_PENGABDIAN = "Pengabdian";
export const VALID_DURATIONS = ["6 bulan", "1 tahun", "2 tahun", "3 tahun"] as const;
export const ALLOWED_STATUSES = ["Draft", "Pending", "Approved", "Declined"] as const;
export const MAX_SAFE_CURRENCY = Number.MAX_SAFE_INTEGER;

export function getPrimaryRoleName(user: AuthenticatedUserContext): string {
  return user.roles[0]?.name?.trim().toLowerCase() ?? "";
}

export function getUserProdiKode(user: AuthenticatedUserContext): string {
  return user.prodi?.kodeProdi?.trim() ?? "";
}

export function isAdminUser(user: AuthenticatedUserContext): boolean {
  return getPrimaryRoleName(user) === "admin";
}

export function hasPermission(user: AuthenticatedUserContext, permissionName: string): boolean {
  return user.permissions.includes(permissionName);
}

export function parseJsonObject(value: ProposalMetaInput | string | undefined, fieldName: string): ProposalMetaInput | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return value;
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as ProposalMetaInput;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? `: ${err.message}` : "";
    throw HttpError.badRequest(`Format ${fieldName} harus JSON valid${message}`);
  }
  throw HttpError.badRequest(`${fieldName} harus berupa objek`);
}

export function parseJsonArray<TItem>(
  value: TItem[] | string | undefined,
  fieldName: string,
): TItem[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed as TItem[];
  } catch (err: unknown) {
    const message = err instanceof Error ? `: ${err.message}` : "";
    throw HttpError.badRequest(`Format ${fieldName} harus JSON valid${message}`);
  }
  throw HttpError.badRequest(`Format ${fieldName} harus array JSON`);
}

export function sanitizeErrorLeak(value: string): string {
  const trimmed = value.trim();
  const errorPatterns = [
    /^meta\.[a-z_]+:/i,
    /^sumber_dana:/i,
    /^judul:/i,
    /^Validasi gagal/i,
    /^wajib diisi/i,
    /^Data meta wajib diisi/i,
  ];
  return errorPatterns.some((pattern) => pattern.test(trimmed)) ? "" : trimmed;
}

export function parseCurrencyValue(rawValue: string | number | undefined, fieldName = "nilai"): number {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    throw HttpError.badRequest(`${fieldName} wajib diisi`);
  }

  if (typeof rawValue === "number") {
    if (!Number.isFinite(rawValue)) throw HttpError.badRequest(`${fieldName} tidak valid`);
    return rawValue;
  }

  const cleaned = String(rawValue)
    .trim()
    .replace(/^rp\.?\s*/i, "")
    .replace(/\s+/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(/,/g, ".");

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) {
    throw HttpError.badRequest(`${fieldName} harus berupa angka valid`);
  }
  return parsed;
}

export function assertMoneyRange(value: number, fieldName = "nilai", allowZero = true): number {
  if (!Number.isFinite(value)) throw HttpError.badRequest(`${fieldName} tidak valid`);
  if (allowZero ? value < 0 : value <= 0) {
    throw HttpError.badRequest(allowZero ? `${fieldName} tidak boleh kurang dari 0` : `${fieldName} harus lebih dari 0`);
  }
  if (value > MAX_SAFE_CURRENCY) {
    throw HttpError.badRequest(`${fieldName} terlalu besar. Maksimal ${MAX_SAFE_CURRENCY.toLocaleString("id-ID")}`);
  }
  return value;
}

export function assertValidDuration(durationValue: string | null | undefined): string {
  const normalized = String(durationValue ?? "").trim().toLowerCase();
  if (!VALID_DURATIONS.includes(normalized as (typeof VALID_DURATIONS)[number])) {
    throw HttpError.badRequest("Lama waktu pelaksanaan harus dipilih dari opsi yang tersedia");
  }
  return normalized;
}

export function normalizeRoleLabel(roleName: string | null | undefined): string | null {
  if (!roleName) return null;
  if (roleName === "dosen") return "Dosen";
  if (roleName === "mahasiswa") return "Mahasiswa";
  return roleName
    .split("_")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export function normalizeOutputIds(outputIds: string[] | null | undefined): string[] {
  if (!Array.isArray(outputIds)) return [];
  return Array.from(new Set(outputIds.map((id) => String(id).trim()).filter((id) => id.length > 0)));
}

export function parsePagination(query: ProposalByProdiQueryDto): { page: number; limit: number; offset: number } {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 50), 1), 100);
  return { page, limit, offset: (page - 1) * limit };
}

export function normalizeStatusFilter(status: ProposalStatus | undefined): ProposalStatus | null {
  if (!status) return null;
  if (!ALLOWED_STATUSES.includes(status)) {
    throw HttpError.badRequest(`Status tidak valid. Gunakan salah satu: ${ALLOWED_STATUSES.join(", ")}`);
  }
  return status;
}

export function mapTahunAkademikResponse(row: TahunAkademik | null | undefined): TahunAkademikResponseDto | null {
  if (!row) return null;
  return {
    id: row.id,
    tahun: `${row.tahunMulai}-${row.tahunSelesai}`,
    semester: row.semester,
    label: `${row.semester} ${row.tahunMulai}/${row.tahunSelesai}`,
  };
}

export async function getProposalIdsByProdi(userProdiCode: string | undefined, tipeUsulan: ProposalTipeUsulan): Promise<string[]> {
  if (!userProdiCode) return [];
  const proposals = await HakiProposal.findAll({
    where: { prodi_pengusul: userProdiCode, tipe_usulan: tipeUsulan },
    attributes: ["id"],
  });
  return proposals.map((proposal) => proposal.id).filter(Boolean);
}

export async function isProposalWithinUserProdi(proposalId: string, userProdiKode: string | undefined): Promise<boolean> {
  if (!proposalId || !userProdiKode) return false;
  const matchedMember = await MemberProposal.findOne({
    where: { haki_proposal_id: proposalId },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "prodiKode"],
        where: { prodiKode: userProdiKode },
      },
    ],
  });
  return Boolean(matchedMember);
}

export function buildListQueryWhere(
  tipeUsulan: ProposalTipeUsulan,
  userId: string,
  visibleProposalIds: string[],
  query: ProposalListQueryDto,
) {
  return {
    tipe_usulan: tipeUsulan,
    [Op.or]: [
      { user_id: userId },
      ...(visibleProposalIds.length > 0 ? [{ id: { [Op.in]: visibleProposalIds } }] : []),
    ],
    ...(query.tahun_akademik_id && query.tahun_akademik_id !== "All"
      ? { tahun_akademik_id: query.tahun_akademik_id }
      : {}),
    ...(query.tipe && query.tipe !== "All" ? { tipe: query.tipe } : {}),
  };
}

export function buildUsulanRow(
  proposal: HakiProposal,
  membership: MemberProposal | null | undefined,
  idx: number,
  offset = 0,
  currentUserId?: string,
  options: {
    canEditByProdi?: boolean;
    canForwardByProdi?: boolean;
    isFinalReportValidated?: boolean;
    coordinatorRow?: boolean;
  } = {},
): ProposalRowDto {
  const ketuaMember = proposal.members?.find((member) => member.peran === "Ketua") ?? null;
  const statusColorMap: Record<ProposalStatus, string> = {
    Draft: "gray",
    Pending: "yellow",
    Approved: "green",
    Declined: "red",
  };
  const isCreator = Boolean(currentUserId && proposal.user_id === currentUserId);
  const isKetuaMember = membership?.peran === "Ketua";
  const outputs = proposal.outputs ?? [];
  let statusColor = statusColorMap.Draft;
  if (proposal.status_usulan === "Pending") statusColor = statusColorMap.Pending;
  if (proposal.status_usulan === "Approved") statusColor = statusColorMap.Approved;
  if (proposal.status_usulan === "Declined") statusColor = statusColorMap.Declined;

  return {
    no: offset + idx + 1,
    id: proposal.id,
    ketua: ketuaMember?.user?.name || ketuaMember?.nama_anggota || "",
    prodi: proposal.prodiPengusulRelasi?.namaProdi || proposal.prodi_pengusul || "",
    judul: proposal.judul || "",
    bidangFokus: proposal.bidang_fokus || "",
    tipeUsulan: proposal.tipe_usulan || "",
    sumberDana: proposal.sumber_dana || "",
    jumlahDana: Number(proposal.jumlah_dana || 0),
    tahunPelaksanaan: proposal.tahun_pelaksanaan || "",
    outputPenelitian: outputs.length > 0 ? outputs.map((output) => output.namaOutput).join(", ") : null,
    peran: options.coordinatorRow ? "Koordinator" : membership?.peran || (isCreator ? "Pengusul" : "Anggota"),
    canEdit: Boolean((isKetuaMember || options.canEditByProdi || options.coordinatorRow) && proposal.status_usulan === "Draft"),
    canForward: Boolean(options.canForwardByProdi),
    status: proposal.status_usulan || "Draft",
    status_usulan: proposal.status_usulan || "Draft",
    created_at: proposal.createdAt || null,
    statusColor,
    tipe: proposal.tipe || "umum",
    isFinalReportValidated: Boolean(options.isFinalReportValidated),
    tahunAkademik: mapTahunAkademikResponse(proposal.tahunAkademik),
  };
}

export function buildPublicYear(tahunPelaksanaan: string | null | undefined): number {
  const currentYear = new Date().getFullYear();
  if (!tahunPelaksanaan) return currentYear;
  return currentYear;
}

export const proposalListIncludes = [
  {
    model: MemberProposal,
    as: "members",
    where: { peran: "Ketua" },
    attributes: ["id", "peran", "nama_anggota", "no_identitas"],
    required: false,
    include: [{ model: User, as: "user", attributes: ["id", "name"] }],
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
    attributes: ["id", "kodeProdi", "namaProdi"],
    required: false,
  },
];
