import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { HKI_MODULE, HKI_REVIEW_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { HttpError } from "../../core/errors/http-error.js";
import { deleteFileSafe } from "../../core/storage/file-system.js";
import { logger } from "../../core/logger/logger.js";
import { fromPublicUploadUrl, toPublicUploadUrl } from "../../core/storage/storage-paths.js";
import { notificationService } from "../notification/notification.service.js";
import { Prodi } from "../prodi/prodi.model.js";
import { User } from "../user/user.model.js";
import { HKI, type HkiReviewStatus } from "./hki.model.js";
import type { FindOptions, Includeable, WhereOptions } from "sequelize";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { CreateHkiBody, HkiReviewQuery, UpdateHkiBody } from "./hki.schema.js";

interface HkiFileUrls {
  sertifikatFileUrl: string | null;
  dokumenFileUrl: string | null;
  suratPernyataanFileUrl: string | null;
  buktiPengalihanFileUrl: string | null;
}

interface HkiReviewPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface HkiReviewListResult {
  data: HKI[];
  pagination: HkiReviewPagination;
}

type HkiWhere = WhereOptions<HKI> & {
  user_id?: string;
  id?: string;
  status?: string;
  jenis_hki?: string;
};

type HkiSearchWhere = HkiWhere & {
  [Op.or]?: Array<{
    judul?: { [Op.like]: string };
    pemegang_hak?: { [Op.like]: string };
    inventor?: { [Op.like]: string };
    jenis_hki?: { [Op.like]: string };
  }>;
};

const HKI_UPLOAD_SUBDIR = "proposals";

const USER_INCLUDE: Includeable = {
  model: User,
  as: "user",
  attributes: ["id", "name", "email", "nidn", "institusi", "prodiKode"],
  include: [
    {
      model: Prodi,
      as: "prodiRelation",
      attributes: ["id", "namaProdi", "kodeProdi", "jenjang"],
      required: false,
    },
  ],
};

function requestIdFromHeaders(headers: { readonly [key: string]: string | string[] | undefined }): string | undefined {
  const value = headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

function flattenFiles(files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined): Express.Multer.File[] {
  if (!files) return [];
  if (Array.isArray(files)) return files;
  return Object.values(files).flat();
}

function processUploadedFiles(files: Express.Multer.File[]): HkiFileUrls {
  const result: HkiFileUrls = {
    sertifikatFileUrl: null,
    dokumenFileUrl: null,
    suratPernyataanFileUrl: null,
    buktiPengalihanFileUrl: null,
  };

  for (const file of files) {
    const fileUrl = toPublicUploadUrl(HKI_UPLOAD_SUBDIR, file.filename);
    if (file.fieldname === "sertifikatFile") {
      result.sertifikatFileUrl = fileUrl;
    } else if (file.fieldname === "dokumenFile") {
      result.dokumenFileUrl = fileUrl;
    } else if (file.fieldname === "suratPernyataanFile") {
      result.suratPernyataanFileUrl = fileUrl;
    } else if (file.fieldname === "buktiPengalihanFile") {
      result.buktiPengalihanFileUrl = fileUrl;
    }
  }

  return result;
}

async function deleteUploadedUrl(fileUrl: string | null): Promise<void> {
  if (!fileUrl) return;
  const resolved = fromPublicUploadUrl(fileUrl);
  if (resolved) await deleteFileSafe(resolved.absolutePath);
}

function requireCompleteHkiBody(body: UpdateHkiBody): asserts body is CreateHkiBody {
  if (!body.judul || !body.jenis_hki || !body.inventor || !body.pemegang_hak) {
    throw HttpError.badRequest("Data HKI tidak lengkap");
  }
}

function normalizeDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw HttpError.badRequest("Tanggal permohonan tidak valid");
  return parsed;
}

function emptyToNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildUserIncludeWithProdiFilter(prodi: string | undefined): Includeable {
  if (!prodi) return USER_INCLUDE;
  return {
    model: User,
    as: "user",
    attributes: ["id", "name", "email", "nidn", "institusi", "prodiKode"],
    where: { prodiKode: prodi },
    required: true,
    include: [
      {
        model: Prodi,
        as: "prodiRelation",
        attributes: ["id", "namaProdi", "kodeProdi", "jenjang"],
        required: false,
      },
    ],
  };
}

function buildReviewWhere(query: HkiReviewQuery): HkiSearchWhere {
  const where: HkiSearchWhere = {};
  if (query.status && query.status !== "all") where.status = query.status;
  if (query.search) {
    where[Op.or] = [
      { judul: { [Op.like]: `%${query.search}%` } },
      { pemegang_hak: { [Op.like]: `%${query.search}%` } },
      { inventor: { [Op.like]: `%${query.search}%` } },
      { jenis_hki: { [Op.like]: `%${query.search}%` } },
    ];
  }
  return where;
}

async function findByPkWithUser(id: string): Promise<HKI | null> {
  return HKI.findByPk(id, { include: [USER_INCLUDE] });
}

async function findOwnedWithUser(id: string, userId: string): Promise<HKI | null> {
  const where: HkiWhere = { id, user_id: userId };
  return HKI.findOne({ where, include: [USER_INCLUDE] });
}

export class HkiService {
  async listUserHKI(userId: string): Promise<HKI[]> {
    const where: HkiWhere = { user_id: userId };
    return HKI.findAll({ where, include: [USER_INCLUDE], order: [["createdAt", "DESC"]] });
  }

  async getHKIDetail(id: string, userId: string): Promise<HKI> {
    const record = await findOwnedWithUser(id, userId);
    if (!record) throw HttpError.notFound("Data HKI tidak ditemukan");
    return record;
  }

  async createHKI(params: {
    user: AuthenticatedUserContext;
    body: CreateHkiBody;
    files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined;
    requestId: string | undefined;
  }): Promise<HKI> {
    const uploaded = processUploadedFiles(flattenFiles(params.files));
    const created = await sequelize.transaction(async (transaction) =>
      HKI.create(
        {
          user_id: params.user.id,
          judul: params.body.judul,
          jenis_hki: params.body.jenis_hki,
          sub_jenis_ciptaan: emptyToNull(params.body.sub_jenis_ciptaan),
          nomor_permohonan: emptyToNull(params.body.nomor_permohonan),
          tanggal_permohonan: normalizeDate(params.body.tanggal_permohonan),
          status_hki: params.body.status_hki ?? null,
          inventor: params.body.inventor,
          pemegang_hak: params.body.pemegang_hak,
          deskripsi: emptyToNull(params.body.deskripsi),
          file_sertifikat: uploaded.sertifikatFileUrl,
          file_dokumen_pendukung: uploaded.dokumenFileUrl,
          file_surat_pernyataan: uploaded.suratPernyataanFileUrl,
          file_bukti_pengalihan: uploaded.buktiPengalihanFileUrl,
          status: "Pending",
        },
        { transaction },
      ),
    );

    auditService.persistNonBlocking({
      action: AuditAction.CREATE,
      module: HKI_MODULE,
      entityId: created.id,
      userId: params.user.id,
      after: { judul: params.body.judul, jenis_hki: params.body.jenis_hki },
      requestId: params.requestId,
    });

    const record = await findByPkWithUser(created.id);
    if (!record) throw HttpError.notFound("Data HKI tidak ditemukan");
    return record;
  }

  async updateHKI(params: {
    id: string;
    user: AuthenticatedUserContext;
    body: UpdateHkiBody;
    files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined;
    requestId: string | undefined;
  }): Promise<HKI> {
    const body = params.body;
    requireCompleteHkiBody(body);
    const record = await HKI.findOne({ where: { id: params.id, user_id: params.user.id } });
    if (!record) throw HttpError.notFound("Data HKI tidak ditemukan");

    const files = flattenFiles(params.files);
    const uploaded = processUploadedFiles(files);
    let sertifikatFileUrl = record.file_sertifikat;
    let dokumenFileUrl = record.file_dokumen_pendukung;
    let suratPernyataanFileUrl = record.file_surat_pernyataan;
    let buktiPengalihanFileUrl = record.file_bukti_pengalihan;

    if (uploaded.sertifikatFileUrl) sertifikatFileUrl = uploaded.sertifikatFileUrl;
    if (uploaded.dokumenFileUrl) dokumenFileUrl = uploaded.dokumenFileUrl;
    if (uploaded.suratPernyataanFileUrl) suratPernyataanFileUrl = uploaded.suratPernyataanFileUrl;
    if (uploaded.buktiPengalihanFileUrl) buktiPengalihanFileUrl = uploaded.buktiPengalihanFileUrl;
    if (body.remove_sertifikatFile === true) sertifikatFileUrl = null;
    if (body.remove_dokumenFile === true) dokumenFileUrl = null;

    const oldFiles = {
      file_sertifikat: record.file_sertifikat,
      file_dokumen_pendukung: record.file_dokumen_pendukung,
      file_surat_pernyataan: record.file_surat_pernyataan,
      file_bukti_pengalihan: record.file_bukti_pengalihan,
    };

    await sequelize.transaction(async (transaction) => {
      await record.update(
        {
          judul: body.judul,
          jenis_hki: body.jenis_hki,
          sub_jenis_ciptaan: emptyToNull(body.sub_jenis_ciptaan),
          nomor_permohonan: emptyToNull(body.nomor_permohonan),
          tanggal_permohonan: normalizeDate(body.tanggal_permohonan),
          status_hki: body.status_hki ?? null,
          inventor: body.inventor,
          pemegang_hak: body.pemegang_hak,
          deskripsi: emptyToNull(body.deskripsi),
          file_sertifikat: sertifikatFileUrl,
          file_dokumen_pendukung: dokumenFileUrl,
          file_surat_pernyataan: suratPernyataanFileUrl,
          file_bukti_pengalihan: buktiPengalihanFileUrl,
        },
        { transaction },
      );
    });

    await Promise.all([
      oldFiles.file_sertifikat !== sertifikatFileUrl ? deleteUploadedUrl(oldFiles.file_sertifikat) : Promise.resolve(),
      oldFiles.file_dokumen_pendukung !== dokumenFileUrl ? deleteUploadedUrl(oldFiles.file_dokumen_pendukung) : Promise.resolve(),
      oldFiles.file_surat_pernyataan !== suratPernyataanFileUrl ? deleteUploadedUrl(oldFiles.file_surat_pernyataan) : Promise.resolve(),
      oldFiles.file_bukti_pengalihan !== buktiPengalihanFileUrl ? deleteUploadedUrl(oldFiles.file_bukti_pengalihan) : Promise.resolve(),
    ]);

    auditService.persistNonBlocking({
      action: AuditAction.UPDATE,
      module: HKI_MODULE,
      entityId: record.id,
      userId: params.user.id,
      before: { judul: record.previous("judul"), jenis_hki: record.previous("jenis_hki") },
      after: { judul: body.judul, jenis_hki: body.jenis_hki },
      requestId: params.requestId,
    });

    const updated = await findByPkWithUser(record.id);
    if (!updated) throw HttpError.notFound("Data HKI tidak ditemukan");
    return updated;
  }

  async deleteHKI(id: string, user: AuthenticatedUserContext, requestId: string | undefined): Promise<void> {
    const record = await HKI.findOne({ where: { id, user_id: user.id } });
    if (!record) throw HttpError.notFound("Data HKI tidak ditemukan");
    const filesToDelete = [
      record.file_sertifikat,
      record.file_dokumen_pendukung,
      record.file_surat_pernyataan,
      record.file_bukti_pengalihan,
    ];

    await sequelize.transaction(async (transaction) => {
      await record.destroy({ transaction });
    });

    await Promise.all(filesToDelete.map((fileUrl) => deleteUploadedUrl(fileUrl)));
    auditService.persistNonBlocking({
      action: AuditAction.DELETE,
      module: HKI_MODULE,
      entityId: record.id,
      userId: user.id,
      before: { judul: record.judul, jenis_hki: record.jenis_hki },
      requestId,
    });
  }

  async submitHKI(id: string, user: AuthenticatedUserContext, requestId: string | undefined): Promise<HKI> {
    const record = await HKI.findOne({ where: { id, user_id: user.id } });
    if (!record) throw HttpError.notFound("Data HKI tidak ditemukan");
    if (!record.judul || !record.jenis_hki || !record.inventor || !record.pemegang_hak) {
      throw HttpError.badRequest("Data HKI tidak lengkap untuk diajukan");
    }
    await sequelize.transaction(async (transaction) => {
      await record.update({ status: "Pending" }, { transaction });
    });
    auditService.persistNonBlocking({
      action: AuditAction.SUBMIT,
      module: HKI_MODULE,
      entityId: record.id,
      userId: user.id,
      after: { status: "Pending" },
      requestId,
    });
    return record;
  }

  async getHKIForReview(query: HkiReviewQuery): Promise<HkiReviewListResult> {
    return this.listHKIForReview(query, true);
  }

  async getAllHKI(query: HkiReviewQuery): Promise<HkiReviewListResult> {
    return this.listHKIForReview(query, false);
  }

  async getHKIDetailForReview(id: string): Promise<HKI> {
    const record = await HKI.findByPk(id, { include: [USER_INCLUDE] });
    if (!record) throw HttpError.notFound("Data HKI tidak ditemukan");
    return record;
  }

  async approveHKI(id: string, admin: AuthenticatedUserContext, catatan: string | null | undefined, requestId: string | undefined): Promise<HKI> {
    const record = await HKI.findByPk(id, { include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }] });
    if (!record) throw HttpError.notFound("Data HKI tidak ditemukan");
    if (record.status === "Approved") throw HttpError.badRequest("HKI sudah disetujui sebelumnya");

    await sequelize.transaction(async (transaction) => {
      await record.update({ status: "Approved", status_hki: "Terdaftar" }, { transaction });
    });

    notificationService.createNotification({
      userId: record.user_id,
      type: "usulan_approved",
      relatedType: "haki_proposal",
      relatedId: record.id,
      title: "HKI Disetujui",
      message: `HKI "${record.judul}" telah disetujui.${catatan ? ` Catatan: ${catatan}` : ""}`,
      metadata: { hki_id: record.id, approved_by: admin.id, catatan: catatan ?? null },
    }).catch((err: unknown) => logger.warn({ err }, "HKI approve: notification write failed (non-blocking)"));

    auditService.persistNonBlocking({
      action: AuditAction.APPROVE,
      module: HKI_REVIEW_MODULE,
      entityId: record.id,
      userId: admin.id,
      before: { status: record.previous("status") },
      after: { status: "Approved", catatan: catatan ?? null },
      requestId,
    });
    return record;
  }

  async rejectHKI(id: string, admin: AuthenticatedUserContext, catatan: string, requestId: string | undefined): Promise<HKI> {
    if (!catatan.trim()) throw HttpError.badRequest("Alasan penolakan wajib diisi");
    const record = await HKI.findByPk(id, { include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }] });
    if (!record) throw HttpError.notFound("Data HKI tidak ditemukan");
    if (record.status === "Rejected") throw HttpError.badRequest("HKI sudah ditolak sebelumnya");
    const oldStatus: HkiReviewStatus = record.status;

    await sequelize.transaction(async (transaction) => {
      await record.update({ status: "Rejected", status_hki: "Ditolak" }, { transaction });
    });

    notificationService.createNotification({
      userId: record.user_id,
      type: "usulan_rejected",
      relatedType: "haki_proposal",
      relatedId: record.id,
      title: "HKI Ditolak",
      message: `HKI "${record.judul}" ditolak. Alasan: ${catatan}`,
      metadata: { hki_id: record.id, rejected_by: admin.id, catatan },
    }).catch((err: unknown) => logger.warn({ err }, "HKI reject: notification write failed (non-blocking)"));

    auditService.persistNonBlocking({
      action: AuditAction.DECLINE,
      module: HKI_REVIEW_MODULE,
      entityId: record.id,
      userId: admin.id,
      before: { status: oldStatus },
      after: { status: "Rejected", catatan },
      requestId,
    });
    return record;
  }

  async getHKIReviewStats(): Promise<{ pending: number; approved: number; rejected: number; total: number }> {
    const [pending, approved, rejected, total] = await Promise.all([
      HKI.count({ where: { status: "Pending" } }),
      HKI.count({ where: { status: "Approved" } }),
      HKI.count({ where: { status: "Rejected" } }),
      HKI.count(),
    ]);
    return { pending, approved, rejected, total };
  }

  private async listHKIForReview(query: HkiReviewQuery, includeStatusFilter: boolean): Promise<HkiReviewListResult> {
    const where = includeStatusFilter ? buildReviewWhere(query) : buildReviewWhere({ ...query, status: "all" });
    const offset = (query.page - 1) * query.limit;
    const options: FindOptions<HKI> = {
      where,
      include: [buildUserIncludeWithProdiFilter(query.prodi)],
      order: [["createdAt", "DESC"]],
      limit: query.limit,
      offset,
    };
    const { count, rows } = await HKI.findAndCountAll(options);
    return {
      data: rows,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count,
        totalPages: Math.ceil(count / query.limit),
      },
    };
  }

  async restoreHKI(
    id: string,
    user: AuthenticatedUserContext,
    requestId: string | undefined,
  ): Promise<HKI> {
    const record = await HKI.findOne({ where: { id }, paranoid: false });
    if (!record) throw HttpError.notFound("Data HKI tidak ditemukan");
    if (!record.deletedAt) {
      throw HttpError.badRequest("Data HKI tidak dalam status terhapus");
    }
    await sequelize.transaction((transaction) => record.restore({ transaction }));

    auditService.persistNonBlocking({
      action: AuditAction.RESTORE,
      module: HKI_MODULE,
      entityId: record.id,
      userId: user.id,
      after: { judul: record.judul, inventor: record.inventor },
      requestId,
    });
    return record;
  }

  requestIdFromHeaders = requestIdFromHeaders;
}

export const hkiService = new HkiService();
