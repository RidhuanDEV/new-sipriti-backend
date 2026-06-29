import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { MONEV_INTERNAL_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { HttpError } from "../../core/errors/http-error.js";
import { deleteFileSafe } from "../../core/storage/file-system.js";
import { fromPublicUploadUrl, toPublicUploadUrl } from "../../core/storage/storage-paths.js";
import { filesService } from "../files/files.service.js";
import { Output } from "../output/output.model.js";
import { MemberProposal } from "../proposal/member-proposal.model.js";
import { HakiProposal, type ProposalTipeUsulan } from "../proposal/proposal.model.js";
import { User } from "../user/user.model.js";
import { Monev, type MonevDocumentStatus } from "./monev.model.js";
import type { Order, WhereOptions } from "sequelize";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type {
  CreateMonevInternalBody,
  MonevListQuery,
  MonevUsulanOptionsQuery,
  UpdateMonevInternalBody,
} from "./monev-internal.schema.js";

interface MonevListRow {
  id: string;
  no: number;
  tglMonev: string;
  statusMonev: string;
  direktorat: string;
  jenisUsulan: string;
  usulan: {
    id: string;
    judul: string;
    ketua: string;
    output_penelitian: string | null;
  } | null;
  beritaAcara: string | null;
  formPenilaian: string | null;
  ringkasanMonev: string | null;
  catatan: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginationMeta {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface MonevUploadUrls {
  berita_acara?: string;
  form_penilaian?: string;
  ringkasan_monev?: string;
}

interface MonevUsulanOption {
  id: string;
  judul: string;
  tipe: ProposalTipeUsulan;
  ketua: string;
}

type MonevWhere = WhereOptions<Monev> & {
  jenis_usulan?: string;
  direktorat?: string;
  status_dokumen?: string;
};

type ProposalOptionWhere = WhereOptions<HakiProposal> & {
  status_usulan?: string;
  tipe_usulan?: ProposalTipeUsulan;
};

const SORT_FIELDS = new Set(["tgl_monev", "createdAt", "updatedAt", "status_dokumen", "direktorat", "jenis_usulan"]);
const MONEV_SUBDIR = "monev";

function requestIdFromHeaders(headers: { readonly [key: string]: string | string[] | undefined }): string | undefined {
  const value = headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

function normalizeSortOrder(value: string): "ASC" | "DESC" {
  return value.toUpperCase() === "ASC" ? "ASC" : "DESC";
}

function normalizeSortBy(value: string): string {
  return SORT_FIELDS.has(value) ? value : "tgl_monev";
}

function outputText(outputs: Output[] | undefined): string | null {
  if (!outputs || outputs.length === 0) return null;
  return outputs.map((output) => output.namaOutput).join(", ");
}

function formatStatusMonev(status: MonevDocumentStatus): string {
  return status === "Complete" || status === "Uploaded" ? "Doc Uploaded" : "Doc Pending";
}

function normalizeFiles(files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined): Express.Multer.File[] {
  if (!files) return [];
  if (Array.isArray(files)) return files;
  return Object.values(files).flat();
}

function firstFile(files: Express.Multer.File[], fieldname: string): Express.Multer.File | null {
  return files.find((file) => file.fieldname === fieldname) ?? null;
}

function publicUrlFromFile(file: Express.Multer.File): string {
  return toPublicUploadUrl(MONEV_SUBDIR, file.filename);
}

async function deleteStoredUrl(fileUrl: string | null): Promise<void> {
  if (!fileUrl) return;
  const resolved = fromPublicUploadUrl(fileUrl);
  if (resolved) await deleteFileSafe(resolved.absolutePath);
}

function calculateStatusDokumen(current: Monev, updates: MonevUploadUrls): MonevDocumentStatus {
  const beritaAcara = updates.berita_acara ?? current.berita_acara;
  const formPenilaian = updates.form_penilaian ?? current.form_penilaian;
  const ringkasanMonev = updates.ringkasan_monev ?? current.ringkasan_monev;
  if (beritaAcara && formPenilaian && ringkasanMonev) return "Complete";
  if (beritaAcara || formPenilaian || ringkasanMonev) return "Uploaded";
  return "Pending";
}

function emptyToNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toListRow(monev: Monev, index: number, offset: number): MonevListRow {
  const ketua = monev.usulan?.members?.find((member) => member.peran === "Ketua")?.user ?? null;
  return {
    id: monev.id,
    no: offset + index + 1,
    tglMonev: monev.tgl_monev,
    statusMonev: formatStatusMonev(monev.status_dokumen),
    direktorat: monev.direktorat,
    jenisUsulan: monev.jenis_usulan,
    usulan: monev.usulan
      ? {
          id: monev.usulan.id,
          judul: monev.usulan.judul,
          ketua: ketua?.name || "N/A",
          output_penelitian: outputText(monev.usulan.outputs),
        }
      : null,
    beritaAcara: monev.berita_acara,
    formPenilaian: monev.form_penilaian,
    ringkasanMonev: monev.ringkasan_monev,
    catatan: monev.catatan,
    createdAt: monev.createdAt,
    updatedAt: monev.updatedAt,
  };
}

function monevInclude() {
  return [
    {
      model: HakiProposal,
      as: "usulan",
      attributes: ["id", "judul", "status_usulan", "tipe_usulan"],
      required: false,
      include: [
        { model: Output, as: "outputs", attributes: ["namaOutput"], through: { attributes: [] } },
        {
          model: MemberProposal,
          as: "members",
          where: { peran: "Ketua" },
          required: false,
          include: [{ model: User, as: "user", attributes: ["id", "name"], required: false }],
        },
      ],
    },
  ];
}

export class MonevInternalService {
  async getAllMonev(query: MonevListQuery): Promise<{ data: MonevListRow[]; meta: PaginationMeta }> {
    const where: MonevWhere = {};
    if (query.jenisUsulan && query.jenisUsulan !== "All") where.jenis_usulan = query.jenisUsulan;
    if (query.direktorat) where.direktorat = query.direktorat;
    if (query.status) where.status_dokumen = query.status;
    const offset = (query.page - 1) * query.limit;
    const totalPagesFromCount = (count: number) => Math.ceil(count / query.limit);
    const order: Order = [[normalizeSortBy(query.sortBy), normalizeSortOrder(query.sortOrder)]];
    const { count, rows } = await Monev.findAndCountAll({
      where,
      include: monevInclude(),
      limit: query.limit,
      offset,
      order,
      distinct: true,
    });
    const totalPages = totalPagesFromCount(count);
    return {
      data: rows.map((row, index) => toListRow(row, index, offset)),
      meta: {
        pagination: {
          currentPage: query.page,
          totalPages,
          totalItems: count,
          itemsPerPage: query.limit,
          hasNextPage: query.page < totalPages,
          hasPrevPage: query.page > 1,
        },
      },
    };
  }

  async getMonevById(id: string): Promise<Monev> {
    const monev = await Monev.findByPk(id, {
      include: [
        {
          model: HakiProposal,
          as: "usulan",
          attributes: ["id", "judul", "status_usulan", "tipe_usulan"],
          include: [
            { model: Output, as: "outputs", attributes: ["namaOutput"], through: { attributes: [] } },
            {
              model: MemberProposal,
              as: "members",
              include: [{ model: User, as: "user", attributes: ["id", "name", "email"], required: false }],
            },
          ],
        },
      ],
    });
    if (!monev) throw HttpError.notFound("Monev tidak ditemukan");
    return monev;
  }

  async createMonev(body: CreateMonevInternalBody, user: AuthenticatedUserContext, requestId: string | undefined): Promise<Monev> {
    const usulan = await HakiProposal.findByPk(body.usulan_id);
    if (!usulan) throw HttpError.notFound("Usulan tidak ditemukan");
    const existing = await Monev.findOne({ where: { usulan_id: body.usulan_id } });
    if (existing) throw HttpError.conflict("Jadwal monev untuk usulan ini sudah ada");

    const created = await sequelize.transaction((transaction) =>
      Monev.create(
        {
          usulan_id: body.usulan_id,
          tgl_monev: body.tgl_monev,
          direktorat: body.direktorat,
          jenis_usulan: body.jenis_usulan,
          catatan: emptyToNull(body.catatan),
          status_dokumen: "Pending",
          created_by: user.id,
        },
        { transaction },
      ),
    );
    auditService.persistNonBlocking({
      action: AuditAction.CREATE,
      module: MONEV_INTERNAL_MODULE,
      entityId: created.id,
      userId: user.id,
      after: { tgl_monev: body.tgl_monev, direktorat: body.direktorat, jenis_usulan: body.jenis_usulan },
      requestId,
    });
    return created;
  }

  async updateMonev(id: string, body: UpdateMonevInternalBody, user: AuthenticatedUserContext, requestId: string | undefined): Promise<Monev> {
    const monev = await Monev.findByPk(id);
    if (!monev) throw HttpError.notFound("Monev tidak ditemukan");
    const before = { tgl_monev: monev.tgl_monev, status_dokumen: monev.status_dokumen };
    await sequelize.transaction((transaction) =>
      monev.update(
        {
          tgl_monev: body.tgl_monev ?? monev.tgl_monev,
          direktorat: body.direktorat ?? monev.direktorat,
          catatan: body.catatan !== undefined ? emptyToNull(body.catatan) : monev.catatan,
          status_dokumen: body.status_dokumen ?? monev.status_dokumen,
          berita_acara: body.berita_acara !== undefined ? emptyToNull(body.berita_acara) : monev.berita_acara,
          form_penilaian: body.form_penilaian !== undefined ? emptyToNull(body.form_penilaian) : monev.form_penilaian,
          ringkasan_monev: body.ringkasan_monev !== undefined ? emptyToNull(body.ringkasan_monev) : monev.ringkasan_monev,
          updated_by: user.id,
        },
        { transaction },
      ),
    );
    auditService.persistNonBlocking({
      action: AuditAction.UPDATE,
      module: MONEV_INTERNAL_MODULE,
      entityId: monev.id,
      userId: user.id,
      before,
      after: { tgl_monev: monev.tgl_monev, status_dokumen: monev.status_dokumen },
      requestId,
    });
    return monev;
  }

  async deleteMonev(id: string, user: AuthenticatedUserContext, requestId: string | undefined): Promise<void> {
    const monev = await Monev.findByPk(id);
    if (!monev) throw HttpError.notFound("Monev tidak ditemukan");
    const filesToDelete = [monev.berita_acara, monev.form_penilaian, monev.ringkasan_monev];

    await sequelize.transaction((transaction) => monev.destroy({ transaction }));
    await Promise.all(filesToDelete.map((fileUrl) => deleteStoredUrl(fileUrl)));
    auditService.persistNonBlocking({
      action: AuditAction.DELETE,
      module: MONEV_INTERNAL_MODULE,
      entityId: monev.id,
      userId: user.id,
      before: { tgl_monev: monev.tgl_monev, direktorat: monev.direktorat },
      requestId,
    });
  }

  async uploadMonevDocuments(
    id: string,
    files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined,
    user: AuthenticatedUserContext,
    requestId: string | undefined,
  ): Promise<Monev> {
    const monev = await Monev.findByPk(id);
    if (!monev) throw HttpError.notFound("Monev tidak ditemukan");
    const uploadedFiles = normalizeFiles(files);
    const beritaAcaraFile = firstFile(uploadedFiles, "beritaAcara");
    const formPenilaianFile = firstFile(uploadedFiles, "formPenilaian");
    const ringkasanMonevFile = firstFile(uploadedFiles, "ringkasanMonev");
    const updateUrls: MonevUploadUrls = {};
    if (beritaAcaraFile) updateUrls.berita_acara = publicUrlFromFile(beritaAcaraFile);
    if (formPenilaianFile) updateUrls.form_penilaian = publicUrlFromFile(formPenilaianFile);
    if (ringkasanMonevFile) updateUrls.ringkasan_monev = publicUrlFromFile(ringkasanMonevFile);
    const oldFiles = [
      updateUrls.berita_acara ? monev.berita_acara : null,
      updateUrls.form_penilaian ? monev.form_penilaian : null,
      updateUrls.ringkasan_monev ? monev.ringkasan_monev : null,
    ];
    const statusDokumen = calculateStatusDokumen(monev, updateUrls);

    try {
      await sequelize.transaction(async (transaction) => {
        await monev.update(
          {
            ...updateUrls,
            status_dokumen: statusDokumen,
            updated_by: user.id,
          },
          { transaction },
        );
      });
      await Promise.all(
        uploadedFiles.map((file) =>
          filesService.registerUploadedFile({
            file,
            subdir: MONEV_SUBDIR,
            ownerUserId: user.id,
            entityType: "monev",
            entityId: monev.id,
            visibility: "private",
            createdBy: user.id,
          }),
        ),
      );
    } catch (err) {
      await Promise.all(uploadedFiles.map((file) => deleteStoredUrl(publicUrlFromFile(file))));
      throw err;
    }

    await Promise.all(oldFiles.map((fileUrl) => deleteStoredUrl(fileUrl)));
    auditService.persistNonBlocking({
      action: AuditAction.UPDATE,
      module: MONEV_INTERNAL_MODULE,
      entityId: monev.id,
      userId: user.id,
      after: { status_dokumen: statusDokumen },
      requestId,
    });
    return monev;
  }

  async getUsulanOptionsForMonev(query: MonevUsulanOptionsQuery): Promise<MonevUsulanOption[]> {
    const where: ProposalOptionWhere = { status_usulan: "Approved" };
    if (query.tipe) where.tipe_usulan = query.tipe;
    const proposals = await HakiProposal.findAll({
      where,
      attributes: ["id", "judul", "tipe_usulan"],
      include: [
        {
          model: MemberProposal,
          as: "members",
          where: { peran: "Ketua" },
          required: false,
          include: [{ model: User, as: "user", attributes: ["id", "name"], required: false }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    return proposals.map((proposal) => ({
      id: proposal.id,
      judul: proposal.judul,
      tipe: proposal.tipe_usulan,
      ketua: proposal.members?.[0]?.user?.name || "N/A",
    }));
  }

  async restoreMonev(
    id: string,
    user: AuthenticatedUserContext,
    requestId: string | undefined,
  ): Promise<Monev> {
    const monev = await Monev.findOne({ where: { id }, paranoid: false });
    if (!monev) throw HttpError.notFound("Monev tidak ditemukan");
    if (!monev.deletedAt) {
      throw HttpError.badRequest("Monev tidak dalam status terhapus");
    }
    await sequelize.transaction((transaction) => monev.restore({ transaction }));

    auditService.persistNonBlocking({
      action: AuditAction.RESTORE,
      module: MONEV_INTERNAL_MODULE,
      entityId: monev.id,
      userId: user.id,
      after: { tgl_monev: monev.tgl_monev, direktorat: monev.direktorat },
      requestId,
    });
    return monev;
  }

  requestIdFromHeaders = requestIdFromHeaders;
}

export const monevInternalService = new MonevInternalService();
