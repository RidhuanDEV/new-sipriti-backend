import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { PENGUMUMAN_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { buildSimpleMeta, ensureUniqueSlug, generateSlug, normalizeSimplePagination, parseBooleanLike } from "../../core/content/legacy-content.js";
import { HttpError } from "../../core/errors/http-error.js";
import { deleteFileSafe } from "../../core/storage/file-system.js";
import { fromPublicUploadUrl, toPublicUploadUrl } from "../../core/storage/storage-paths.js";
import { toPengumumanResponse } from "./mappers/pengumuman.mapper.js";
import { PengumumanRepository } from "./pengumuman.repository.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { SimplePaginationMeta } from "../../core/master-data/pagination.js";
import type { CreatePengumumanDto, ListPengumumanQueryDto, PengumumanResponseDto, UpdatePengumumanDto } from "./dto/pengumuman.dto.js";

interface PengumumanFiles {
  gambar?: Express.Multer.File[];
  file_lampiran?: Express.Multer.File[];
}

const repository = new PengumumanRepository();

export class PengumumanService {
  async listPengumuman(
    query: ListPengumumanQueryDto,
    isAdmin: boolean,
  ): Promise<{ rows: PengumumanResponseDto[]; meta: SimplePaginationMeta }> {
    const maxLimit = isAdmin ? 200 : 6;
    const pagination = normalizeSimplePagination(query, 10, maxLimit);
    const result = await repository.findAndCount(query, pagination, maxLimit);
    return {
      rows: result.rows.map((row) => toPengumumanResponse(row)),
      meta: buildSimpleMeta(pagination.page, pagination.limit, result.count),
    };
  }

  async getPengumumanById(id: string): Promise<PengumumanResponseDto> {
    const pengumuman = await repository.findById(id);
    if (!pengumuman) throw HttpError.notFound("Pengumuman tidak ditemukan");
    return toPengumumanResponse(pengumuman);
  }

  async getPengumumanBySlug(slug: string): Promise<PengumumanResponseDto> {
    const pengumuman = await repository.findBySlug(slug);
    if (!pengumuman) throw HttpError.notFound("Pengumuman tidak ditemukan");
    return toPengumumanResponse(pengumuman);
  }

  async createPengumuman(
    data: CreatePengumumanDto,
    files: PengumumanFiles,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<PengumumanResponseDto> {
    const slug = await this.createUniqueSlug(data.judul);
    const created = await sequelize.transaction((trx) =>
      repository.create(
        {
          ...data,
          slug,
          gambar: files.gambar?.[0] ? toPublicUploadUrl("pengumuman", files.gambar[0].filename) : null,
          file_lampiran: files.file_lampiran?.[0]
            ? toPublicUploadUrl("pengumuman", files.file_lampiran[0].filename)
            : null,
          tanggal_rilis: new Date(),
        },
        trx,
      ),
    );

    const response = toPengumumanResponse(created);
    auditService.persistNonBlocking({
      action: AuditAction.CREATE,
      module: PENGUMUMAN_MODULE,
      entityId: created.id,
      userId: user.id,
      after: response,
      requestId,
    });
    return response;
  }

  async updatePengumuman(
    id: string,
    data: UpdatePengumumanDto,
    files: PengumumanFiles,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<PengumumanResponseDto> {
    const pengumuman = await repository.findById(id);
    if (!pengumuman) throw HttpError.notFound("Pengumuman tidak ditemukan");

    const before = toPengumumanResponse(pengumuman);
    const oldGambar = pengumuman.gambar;
    const oldFile = pengumuman.file_lampiran;
    const slug = await this.createUniqueSlug(data.judul, id);
    const updated = await sequelize.transaction((trx) =>
      repository.update(
        pengumuman,
        {
          ...data,
          slug,
          gambar: this.resolveNextUrl(
            pengumuman.gambar,
            files.gambar?.[0],
            "pengumuman",
            parseBooleanLike(data.remove_gambar),
          ),
          file_lampiran: this.resolveNextUrl(
            pengumuman.file_lampiran,
            files.file_lampiran?.[0],
            "pengumuman",
            parseBooleanLike(data.remove_file_lampiran),
          ),
        },
        trx,
      ),
    );

    if (files.gambar?.[0] && oldGambar) await deleteFileSafe(fromPublicUploadUrl(oldGambar)?.absolutePath ?? null);
    if (files.file_lampiran?.[0] && oldFile) await deleteFileSafe(fromPublicUploadUrl(oldFile)?.absolutePath ?? null);
    if (parseBooleanLike(data.remove_gambar) && oldGambar) await deleteFileSafe(fromPublicUploadUrl(oldGambar)?.absolutePath ?? null);
    if (parseBooleanLike(data.remove_file_lampiran) && oldFile) await deleteFileSafe(fromPublicUploadUrl(oldFile)?.absolutePath ?? null);

    const response = toPengumumanResponse(updated);
    auditService.persistNonBlocking({
      action: AuditAction.UPDATE,
      module: PENGUMUMAN_MODULE,
      entityId: updated.id,
      userId: user.id,
      before,
      after: response,
      requestId,
    });
    return response;
  }

  async deletePengumuman(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const pengumuman = await repository.findById(id);
    if (!pengumuman) throw HttpError.notFound("Pengumuman tidak ditemukan");
    const before = toPengumumanResponse(pengumuman);
    await sequelize.transaction((trx) => repository.delete(pengumuman, trx));

    if (before.gambar) await deleteFileSafe(fromPublicUploadUrl(before.gambar)?.absolutePath ?? null);
    if (before.file_lampiran) await deleteFileSafe(fromPublicUploadUrl(before.file_lampiran)?.absolutePath ?? null);
    auditService.persistNonBlocking({
      action: AuditAction.DELETE,
      module: PENGUMUMAN_MODULE,
      entityId: before.id,
      userId: user.id,
      before,
      requestId,
    });
  }

  async restorePengumuman(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<PengumumanResponseDto> {
    const pengumuman = await repository.findByIdWithDeleted(id);
    if (!pengumuman) throw HttpError.notFound("Pengumuman tidak ditemukan");
    if (!pengumuman.deletedAt) {
      throw HttpError.badRequest("Pengumuman tidak dalam status terhapus");
    }
    await sequelize.transaction((trx) => repository.restore(pengumuman, trx));

    const after = toPengumumanResponse(pengumuman);
    auditService.persistNonBlocking({
      action: AuditAction.RESTORE,
      module: PENGUMUMAN_MODULE,
      entityId: pengumuman.id,
      userId: user.id,
      after,
      requestId,
    });
    return after;
  }

  private async createUniqueSlug(title: string, excludeId?: string): Promise<string> {
    return ensureUniqueSlug(generateSlug(title), async (slug) => {
      const count = await repository.countBySlug(slug, excludeId);
      return count > 0;
    });
  }

  private resolveNextUrl(
    currentUrl: string | null,
    file: Express.Multer.File | undefined,
    subdir: string,
    remove: boolean | undefined,
  ): string | null {
    if (file) return toPublicUploadUrl(subdir, file.filename);
    if (remove) return null;
    return currentUrl;
  }
}
