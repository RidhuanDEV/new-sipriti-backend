import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { OFFICIAL_SIGNATURES_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { HttpError } from "../../core/errors/http-error.js";
import { deleteFileSafe } from "../../core/storage/file-system.js";
import { createUploadFilename } from "../../core/storage/upload-filename.js";
import { Prodi } from "../prodi/prodi.model.js";
import { User } from "../user/user.model.js";
import { OfficialSignature } from "./official-signature.model.js";
import type { WhereOptions } from "sequelize";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { CreateOfficialSignatureBody, ListOfficialSignatureQuery, UpdateOfficialSignatureBody } from "./official-signatures.schema.js";

interface SignatureResponse {
  id: string;
  signature_key: string;
  role_code: string | null;
  kode_prodi: string | null;
  signer_name: string;
  signer_nidn: string | null;
  stored_filename: string;
  original_filename: string | null;
  mime_type: string;
  file_size: number;
  sha256: string;
  is_active: boolean;
  activated_at: Date | null;
  uploaded_by: string | null;
  updated_by: string | null;
  file_url: string;
  created_at: Date;
  updated_at: Date;
  prodi?: { id: string; kodeProdi: string; namaProdi: string } | null;
}

const SIGNATURE_ROOT = path.resolve(process.cwd(), "storage", "official-signatures");
const MAX_SIGNATURE_SIZE_BYTES = 1000 * 1024;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

function isAdmin(user: AuthenticatedUserContext): boolean {
  return user.roles.some((role) => role.name.toLowerCase() === "admin");
}

function userKodeProdi(user: AuthenticatedUserContext): string | null {
  return user.prodi?.kodeProdi ?? null;
}

function assertSameProdiScope(user: AuthenticatedUserContext, kodeProdi: string | null | undefined): void {
  if (isAdmin(user)) return;
  const ownKodeProdi = userKodeProdi(user);
  if (!ownKodeProdi || !kodeProdi || ownKodeProdi !== kodeProdi) {
    throw HttpError.forbidden("Anda tidak memiliki akses ke signature program studi ini");
  }
}

function isPng(buffer: Buffer): boolean {
  return PNG_SIGNATURE.every((byte, index) => buffer[index] === byte);
}

function toResponse(signature: OfficialSignature): SignatureResponse {
  return {
    id: signature.id,
    signature_key: signature.signature_key,
    role_code: signature.role_code,
    kode_prodi: signature.kode_prodi,
    signer_name: signature.signer_name,
    signer_nidn: signature.signer_nidn,
    stored_filename: signature.stored_filename,
    original_filename: signature.original_filename,
    mime_type: signature.mime_type,
    file_size: signature.file_size,
    sha256: signature.sha256,
    is_active: signature.is_active,
    activated_at: signature.activated_at,
    uploaded_by: signature.uploaded_by,
    updated_by: signature.updated_by,
    file_url: `/api/admin/signatures/${signature.id}/file`,
    created_at: signature.created_at,
    updated_at: signature.updated_at,
    prodi: signature.prodi
      ? {
          id: signature.prodi.id,
          kodeProdi: signature.prodi.kodeProdi,
          namaProdi: signature.prodi.namaProdi,
        }
      : null,
  };
}

export function resolveOfficialSignatureFilePath(filename: string): string {
  const resolved = path.resolve(SIGNATURE_ROOT, filename);
  const rootPrefix = `${SIGNATURE_ROOT}${path.sep}`;
  if (!resolved.startsWith(rootPrefix)) {
    throw HttpError.badRequest("Path signature tidak valid");
  }
  return resolved;
}

async function archiveSignatureFile(
  signatureKey: string,
  signatureId: string,
  storedFilename: string
): Promise<void> {
  const archiveDir = path.resolve(SIGNATURE_ROOT, "archive");
  await fs.mkdir(archiveDir, { recursive: true });

  const sourcePath = resolveOfficialSignatureFilePath(storedFilename);
  try {
    await fs.access(sourcePath);
  } catch (error: any) {
    if (error.code === "ENOENT") return;
    throw error;
  }

  const timestamp = new Date().toISOString().replace(/[.:]/g, "-");
  const extension = path.extname(storedFilename || ".png") || ".png";
  const originalBaseName = path.basename(storedFilename || "signature", extension);

  const normalize = (val: string, fallback: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60);
    return cleaned || fallback;
  };

  const archivedFilename = `${normalize(signatureKey, "signature")}-${normalize(signatureId, crypto.randomUUID())}-${timestamp}-${normalize(originalBaseName, "file")}${extension}`;
  const destPath = path.resolve(archiveDir, archivedFilename);

  try {
    await fs.rename(sourcePath, destPath);
  } catch (error: any) {
    if (error.code === "EXDEV") {
      await fs.copyFile(sourcePath, destPath);
      await fs.unlink(sourcePath);
    } else {
      throw error;
    }
  }
}

async function assertValidSignatureFile(file: Express.Multer.File): Promise<{ filename: string; sha256: string }> {
  if (file.mimetype !== "image/png") throw HttpError.badRequest("Hanya file PNG (image/png) yang diperbolehkan untuk signature");
  const extension = path.extname(file.originalname || "").toLowerCase();
  if (extension && extension !== ".png") {
    throw HttpError.badRequest("Ekstensi file signature harus .png");
  }
  if (file.size > MAX_SIGNATURE_SIZE_BYTES) throw HttpError.badRequest("Ukuran signature maksimal 1000KB");
  if (!isPng(file.buffer)) throw HttpError.badRequest("File signature bukan PNG yang valid");
  const metadata = await sharp(file.buffer).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (width <= 0 || height <= 0) {
    throw HttpError.badRequest("Dimensi file signature tidak valid");
  }
  if (width > 4000 || height > 2000) {
    throw HttpError.badRequest("Dimensi signature terlalu besar");
  }
  return {
    filename: createUploadFilename(file.originalname.endsWith(".png") ? file.originalname : `${file.originalname}.png`),
    sha256: crypto.createHash("sha256").update(file.buffer).digest("hex"),
  };
}

async function persistSignatureFile(file: Express.Multer.File, storedFilename: string): Promise<void> {
  await fs.mkdir(SIGNATURE_ROOT, { recursive: true });
  await fs.writeFile(resolveOfficialSignatureFilePath(storedFilename), file.buffer);
}

export async function getActiveOfficialSignatureByKeyAndProdi(signatureKey: string, kodeProdi: string): Promise<OfficialSignature | null> {
  return OfficialSignature.findOne({
    where: {
      signature_key: signatureKey,
      kode_prodi: kodeProdi,
      is_active: true,
    },
    order: [["activated_at", "DESC"], ["updated_at", "DESC"]],
  });
}

function parseBooleanQuery(value: boolean | "true" | "false" | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  return typeof value === "boolean" ? value : value === "true";
}

export class OfficialSignaturesService {
  async list(query: ListOfficialSignatureQuery, user: AuthenticatedUserContext): Promise<SignatureResponse[]> {
    const where: WhereOptions<OfficialSignature> = {};
    if (query.signature_key) where.signature_key = query.signature_key;
    if (query.kode_prodi) where.kode_prodi = query.kode_prodi;
    const isActive = parseBooleanQuery(query.is_active ?? query.isActive);
    if (isActive !== undefined) where.is_active = isActive;
    if (!isAdmin(user)) where.kode_prodi = userKodeProdi(user) ?? "__no_prodi__";
    const rows = await OfficialSignature.findAll({
      where,
      include: [{ model: Prodi, as: "prodi", attributes: ["id", "kodeProdi", "namaProdi"], required: false }],
      order: [["created_at", "DESC"]],
    });
    return rows.map(toResponse);
  }

  async create(body: CreateOfficialSignatureBody, file: Express.Multer.File | undefined, user: AuthenticatedUserContext, requestId?: string): Promise<SignatureResponse> {
    if (!file) throw HttpError.badRequest("File signature wajib diunggah");
    assertSameProdiScope(user, body.kode_prodi);
    const fileMeta = await assertValidSignatureFile(file);
    const activeExistingCount = await OfficialSignature.count({ where: { signature_key: body.signature_key, kode_prodi: body.kode_prodi, is_active: true } });
    const shouldActivate = activeExistingCount === 0;
    const created = await sequelize.transaction(async (transaction) => {
      const row = await OfficialSignature.create(
        {
          signature_key: body.signature_key,
          role_code: body.role_code ?? null,
          kode_prodi: body.kode_prodi,
          signer_name: body.signer_name,
          signer_nidn: body.signer_nidn ?? null,
          stored_filename: fileMeta.filename,
          original_filename: file.originalname,
          mime_type: "image/png",
          file_size: file.size,
          sha256: fileMeta.sha256,
          is_active: shouldActivate,
          activated_at: shouldActivate ? new Date() : null,
          uploaded_by: user.id,
          updated_by: user.id,
        },
        { transaction },
      );
      return row;
    });
    await persistSignatureFile(file, fileMeta.filename);
    auditService.persistNonBlocking({ action: AuditAction.CREATE, module: OFFICIAL_SIGNATURES_MODULE, entityId: created.id, userId: user.id, after: toResponse(created), requestId });
    return toResponse(created);
  }

  async update(id: string, body: UpdateOfficialSignatureBody, file: Express.Multer.File | undefined, user: AuthenticatedUserContext, requestId?: string): Promise<SignatureResponse> {
    const row = await OfficialSignature.findByPk(id);
    if (!row) throw HttpError.notFound("Signature tidak ditemukan");
    assertSameProdiScope(user, row.kode_prodi);
    if (body.kode_prodi) assertSameProdiScope(user, body.kode_prodi);
    const before = toResponse(row);
    const oldFilename = row.stored_filename;
    const fileMeta = file ? await assertValidSignatureFile(file) : null;
    await row.update({
      ...(body.signature_key !== undefined ? { signature_key: body.signature_key } : {}),
      ...(body.role_code !== undefined ? { role_code: body.role_code } : {}),
      ...(body.kode_prodi !== undefined ? { kode_prodi: body.kode_prodi } : {}),
      ...(body.signer_name !== undefined ? { signer_name: body.signer_name } : {}),
      ...(body.signer_nidn !== undefined ? { signer_nidn: body.signer_nidn } : {}),
      ...(fileMeta && file ? {
        stored_filename: fileMeta.filename,
        original_filename: file.originalname,
        mime_type: "image/png",
        file_size: file.size,
        sha256: fileMeta.sha256,
      } : {}),
      updated_by: user.id,
    });
    if (fileMeta && file) {
      await persistSignatureFile(file, fileMeta.filename);
      try {
        await archiveSignatureFile(row.signature_key, row.id, oldFilename);
      } catch (error) {
        console.error("Gagal mengarsipkan file signature lama:", error);
      }
    }
    auditService.persistNonBlocking({ action: AuditAction.UPDATE, module: OFFICIAL_SIGNATURES_MODULE, entityId: row.id, userId: user.id, before, after: toResponse(row), requestId });
    return toResponse(row);
  }

  async activate(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<SignatureResponse> {
    const row = await OfficialSignature.findByPk(id);
    if (!row) throw HttpError.notFound("Signature tidak ditemukan");
    assertSameProdiScope(user, row.kode_prodi);
    await sequelize.transaction(async (transaction) => {
      await OfficialSignature.update(
        { is_active: false },
        { where: { signature_key: row.signature_key, kode_prodi: row.kode_prodi, id: { [Op.ne]: row.id } }, transaction },
      );
      await row.update({ is_active: true, activated_at: new Date(), updated_by: user.id }, { transaction });
    });
    auditService.persistNonBlocking({ action: AuditAction.UPDATE, module: OFFICIAL_SIGNATURES_MODULE, entityId: row.id, userId: user.id, after: { is_active: true }, requestId });
    return toResponse(row);
  }

  async deactivate(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<SignatureResponse> {
    const row = await OfficialSignature.findByPk(id);
    if (!row) throw HttpError.notFound("Signature tidak ditemukan");
    assertSameProdiScope(user, row.kode_prodi);
    await row.update({ is_active: false, updated_by: user.id });
    auditService.persistNonBlocking({ action: AuditAction.UPDATE, module: OFFICIAL_SIGNATURES_MODULE, entityId: row.id, userId: user.id, after: { is_active: false }, requestId });
    return toResponse(row);
  }

  async delete(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const row = await OfficialSignature.findByPk(id);
    if (!row) throw HttpError.notFound("Signature tidak ditemukan");
    assertSameProdiScope(user, row.kode_prodi);
    const before = toResponse(row);
    await row.destroy();
    try {
      await archiveSignatureFile(row.signature_key, row.id, row.stored_filename);
    } catch (error) {
      console.error("Gagal mengarsipkan file signature terhapus:", error);
    }
    auditService.persistNonBlocking({ action: AuditAction.DELETE, module: OFFICIAL_SIGNATURES_MODULE, entityId: row.id, userId: user.id, before, requestId });
  }

  async resolveFile(id: string, user: AuthenticatedUserContext): Promise<{ absolutePath: string; filename: string; mimeType: string }> {
    const row = await OfficialSignature.findByPk(id);
    if (!row) throw HttpError.notFound("Signature tidak ditemukan");
    assertSameProdiScope(user, row.kode_prodi);
    return {
      absolutePath: resolveOfficialSignatureFilePath(row.stored_filename),
      filename: row.original_filename ?? row.stored_filename,
      mimeType: row.mime_type,
    };
  }

  async restore(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<SignatureResponse> {
    const row = await OfficialSignature.findOne({ where: { id }, paranoid: false });
    if (!row) throw HttpError.notFound("Signature tidak ditemukan");
    assertSameProdiScope(user, row.kode_prodi);
    if (!row.deletedAt) {
      throw HttpError.badRequest("Signature tidak dalam status terhapus");
    }
    await row.restore();
    auditService.persistNonBlocking({
      action: AuditAction.RESTORE,
      module: OFFICIAL_SIGNATURES_MODULE,
      entityId: row.id,
      userId: user.id,
      after: toResponse(row),
      requestId
    });
    return toResponse(row);
  }
}

export const officialSignaturesService = new OfficialSignaturesService();
