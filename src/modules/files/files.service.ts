import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import { HttpError } from "../../core/errors/http-error.js";
import { calculateSha256IfExists, deleteFileSafe, fileExists } from "../../core/storage/file-system.js";
import {
  PUBLIC_STATIC_SUBDIRS,
  resolveUploadPath,
  toPublicUploadUrl,
} from "../../core/storage/storage-paths.js";
import { FilesRepository } from "./files.repository.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { RegisterUploadedFileDto, ResolvedFileDto } from "./dto/files.dto.js";
import type { UploadedFile } from "./uploaded-file.model.js";
import { HKI } from "../hki/hki.model.js";
import { LaporanUsulan } from "../proposal/laporan-usulan.model.js";
import { HakiProposal } from "../proposal/proposal.model.js";
import { Monev } from "../monev-internal/monev.model.js";
import { canViewProposal, assertCanViewProposal } from "../proposal/policies/proposal.policy.js";

export const PRIVATE_UPLOAD_SUBDIRS = Object.freeze([
  "laporan-kemajuan",
  "laporan-akhir",
  "laporan-usulan",
  "proposals",
  "proposal-final-pdf",
  "monev",
  "richtext",
]);

const repository = new FilesRepository();

export class FilesService {
  getContentDisposition(filename: string, disposition: "inline" | "attachment"): string {
    const safeFilename = filename.replace(/["\r\n]/g, "_");
    return `${disposition}; filename="${safeFilename}"`;
  }

  async registerUploadedFile(data: RegisterUploadedFileDto): Promise<UploadedFile | null> {
    if (!data.file.filename) return null;

    const resolved = resolveUploadPath(data.subdir, data.file.filename);
    const sha256 = await calculateSha256IfExists(resolved.absolutePath);

    return repository.findOrCreate({
      ownerUserId: data.ownerUserId,
      entityType: data.entityType,
      entityId: data.entityId ?? null,
      visibility: data.visibility,
      subdir: resolved.subdir,
      storedFilename: resolved.filename,
      originalFilename: data.file.originalname || resolved.filename,
      mimeType: data.file.mimetype || null,
      sizeBytes: data.file.size || null,
      sha256,
      createdBy: data.createdBy,
    });
  }

  async resolveFileById(
    id: string,
    user: AuthenticatedUserContext | null,
  ): Promise<ResolvedFileDto> {
    const record = await repository.findById(id);
    if (!record) throw HttpError.notFound("File tidak ditemukan");

    await this.assertCanReadMetadataFile(record, user);
    const resolved = resolveUploadPath(record.subdir, record.storedFilename);
    if (!(await fileExists(resolved.absolutePath))) {
      throw HttpError.notFound("File tidak ditemukan");
    }

    return {
      absolutePath: resolved.absolutePath,
      filename: record.originalFilename ?? record.storedFilename,
      mimeType: record.mimeType,
    };
  }

  async resolveFileByPath(
    subdir: string,
    filename: string,
    user: AuthenticatedUserContext | null,
  ): Promise<ResolvedFileDto> {
    const resolved = resolveUploadPath(subdir, filename);
    const record = await repository.findByStoragePath(resolved.subdir, resolved.filename);

    if (record) {
      await this.assertCanReadMetadataFile(record, user);
    } else {
      await this.assertCanReadLegacyFile(resolved.subdir, resolved.filename, user);
    }

    if (!(await fileExists(resolved.absolutePath))) {
      throw HttpError.notFound("File tidak ditemukan");
    }

    return {
      absolutePath: resolved.absolutePath,
      filename: resolved.filename,
      mimeType: record?.mimeType ?? null,
    };
  }

  async markDeletedByPath(
    subdir: string,
    filename: string,
    user: AuthenticatedUserContext | null,
  ): Promise<void> {
    const resolved = resolveUploadPath(subdir, filename);
    const record = await repository.findByStoragePath(resolved.subdir, resolved.filename);

    if (!record || record.status !== "active") {
      throw HttpError.notFound("File metadata tidak ditemukan");
    }

    if (!this.isAdminUser(user) && record.ownerUserId !== user?.id) {
      throw HttpError.forbidden("Anda tidak memiliki akses untuk menghapus file ini");
    }

    await sequelize.transaction((trx) => repository.markDeleted(record, user?.id ?? null, trx));
    await deleteFileSafe(resolved.absolutePath);
  }

  toPublicUrl(subdir: string, filename: string): string {
    return toPublicUploadUrl(subdir, filename);
  }

  private async assertCanReadMetadataFile(
    record: UploadedFile,
    user: AuthenticatedUserContext | null,
  ): Promise<void> {
    if (record.status !== "active") {
      throw HttpError.notFound("File tidak ditemukan");
    }

    if (record.visibility === "public") {
      if (record.entityType === "hki" && record.entityId) {
        const hki = await HKI.findByPk(record.entityId, {
          attributes: ["id", "status"],
        });
        if (!hki || hki.status !== "Approved") {
          throw HttpError.forbidden("File HKI belum dipublikasikan");
        }
      }
      return;
    }

    if (!user) throw HttpError.unauthorized("Silakan login terlebih dahulu");
    if (this.isAdminUser(user)) return;
    if (record.ownerUserId && record.ownerUserId === user.id) return;

    if (record.entityType === "proposal" && record.entityId) {
      await assertCanViewProposal(record.entityId, user);
      return;
    }

    if (record.entityType === "laporan_usulan" && record.entityId) {
      const laporan = await LaporanUsulan.findByPk(record.entityId, {
        include: [{ model: HakiProposal, as: "proposal" }],
      });
      if (laporan?.proposal && (await canViewProposal(laporan.proposal, user))) {
        return;
      }
    }

    throw HttpError.forbidden("Anda tidak memiliki akses ke file ini");
  }

  private async assertCanReadLegacyFile(
    subdir: string,
    filename: string,
    user: AuthenticatedUserContext | null,
  ): Promise<void> {
    const publicUrl = `/uploads/${subdir}/${filename}`;

    if (PUBLIC_STATIC_SUBDIRS.includes(subdir)) return;

    if (subdir === "proposals") {
      const approvedHki = await HKI.findOne({
        where: {
          status: "Approved",
          [Op.or]: [
            { file_sertifikat: publicUrl },
            { file_dokumen_pendukung: publicUrl },
            { file_surat_pernyataan: publicUrl },
            { file_bukti_pengalihan: publicUrl },
          ],
        },
        attributes: ["id"],
      });
      if (approvedHki) return;
    }

    if (!user) throw HttpError.unauthorized("Silakan login terlebih dahulu");
    if (this.isAdminUser(user)) return;

    if (["laporan-kemajuan", "laporan-akhir", "laporan-usulan"].includes(subdir)) {
      const laporan = await LaporanUsulan.findOne({
        where: { file_url: publicUrl },
        include: [{ model: HakiProposal, as: "proposal" }],
      });
      if (laporan?.proposal && (await canViewProposal(laporan.proposal, user))) {
        return;
      }
    }

    if (subdir === "monev") {
      const monev = await Monev.findOne({
        where: {
          [Op.or]: [
            { berita_acara: publicUrl },
            { form_penilaian: publicUrl },
            { ringkasan_monev: publicUrl },
          ],
        },
        include: [{ model: HakiProposal, as: "usulan" }],
      });
      if (monev?.usulan && (await canViewProposal(monev.usulan, user))) {
        return;
      }
    }

    if (subdir === "proposals") {
      const hki = await HKI.findOne({
        where: {
          [Op.or]: [
            { file_sertifikat: publicUrl },
            { file_dokumen_pendukung: publicUrl },
            { file_surat_pernyataan: publicUrl },
            { file_bukti_pengalihan: publicUrl },
          ],
        },
      });
      if (hki) {
        if (hki.status === "Approved" || hki.user_id === user.id) {
          return;
        }
        throw HttpError.forbidden("File HKI belum dipublikasikan");
      }
    }

    if (subdir === "richtext") return;

    throw HttpError.forbidden("Anda tidak memiliki akses ke file ini");
  }

  private isAdminUser(user: AuthenticatedUserContext | null): boolean {
    if (!user) return false;
    return user.roles.some((role) => role.name.toLowerCase() === "admin");
  }
}

export const filesService = new FilesService();
