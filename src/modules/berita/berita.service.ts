import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { BERITA_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { generateSlug, ensureUniqueSlug, normalizeSimplePagination, parseBooleanLike, buildSimpleMeta } from "../../core/content/legacy-content.js";
import { HttpError } from "../../core/errors/http-error.js";
import { deleteFileSafe } from "../../core/storage/file-system.js";
import { fromPublicUploadUrl, toPublicUploadUrl } from "../../core/storage/storage-paths.js";
import { BeritaRepository } from "./berita.repository.js";
import { toBeritaResponse } from "./mappers/berita.mapper.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { SimplePaginationMeta } from "../../core/master-data/pagination.js";
import type { BeritaResponseDto, CreateBeritaDto, ListBeritaQueryDto, UpdateBeritaDto } from "./dto/berita.dto.js";

interface BeritaFiles {
  photo?: Express.Multer.File[];
  file?: Express.Multer.File[];
}

const repository = new BeritaRepository();

export class BeritaService {
  async listBerita(
    query: ListBeritaQueryDto,
    isAdmin: boolean,
  ): Promise<{ rows: BeritaResponseDto[]; meta: SimplePaginationMeta }> {
    const maxLimit = isAdmin ? 200 : 6;
    const pagination = normalizeSimplePagination(query, 10, maxLimit);
    const result = await repository.findAndCount(query, pagination, maxLimit);

    return {
      rows: result.rows.map((row) => toBeritaResponse(row)),
      meta: buildSimpleMeta(pagination.page, pagination.limit, result.count),
    };
  }

  async getBeritaById(id: string): Promise<BeritaResponseDto> {
    const berita = await repository.findById(id);
    if (!berita) throw HttpError.notFound("Berita tidak ditemukan");
    return toBeritaResponse(berita);
  }

  async createBerita(
    data: CreateBeritaDto,
    files: BeritaFiles,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<BeritaResponseDto> {
    const slug = await this.createUniqueSlug(data.judul);
    const created = await sequelize.transaction((trx) =>
      repository.create(
        {
          ...data,
          slug,
          photo_url: files.photo?.[0] ? toPublicUploadUrl("berita", files.photo[0].filename) : null,
          file_url: files.file?.[0] ? toPublicUploadUrl("berita", files.file[0].filename) : null,
          tanggal_rilis: new Date(),
        },
        trx,
      ),
    );

    const response = toBeritaResponse(created);
    auditService.persistNonBlocking({
      action: AuditAction.CREATE,
      module: BERITA_MODULE,
      entityId: created.id,
      userId: user.id,
      after: response,
      requestId,
    });
    return response;
  }

  async updateBerita(
    id: string,
    data: UpdateBeritaDto,
    files: BeritaFiles,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<BeritaResponseDto> {
    const berita = await repository.findById(id);
    if (!berita) throw HttpError.notFound("Berita tidak ditemukan");

    const before = toBeritaResponse(berita);
    const oldPhotoUrl = berita.photo_url;
    const oldFileUrl = berita.file_url;
    const nextPhotoUrl = this.resolveNextUrl(
      berita.photo_url,
      files.photo?.[0],
      "berita",
      parseBooleanLike(data.remove_photo),
    );
    const nextFileUrl = this.resolveNextUrl(
      berita.file_url,
      files.file?.[0],
      "berita",
      parseBooleanLike(data.remove_file),
    );
    const slug = await this.createUniqueSlug(data.judul, id);

    const updated = await sequelize.transaction((trx) =>
      repository.update(
        berita,
        {
          ...data,
          slug,
          photo_url: nextPhotoUrl,
          file_url: nextFileUrl,
        },
        trx,
      ),
    );

    if (files.photo?.[0] && oldPhotoUrl) await deleteFileSafe(fromPublicUploadUrl(oldPhotoUrl)?.absolutePath ?? null);
    if (files.file?.[0] && oldFileUrl) await deleteFileSafe(fromPublicUploadUrl(oldFileUrl)?.absolutePath ?? null);
    if (parseBooleanLike(data.remove_photo) && oldPhotoUrl) await deleteFileSafe(fromPublicUploadUrl(oldPhotoUrl)?.absolutePath ?? null);
    if (parseBooleanLike(data.remove_file) && oldFileUrl) await deleteFileSafe(fromPublicUploadUrl(oldFileUrl)?.absolutePath ?? null);

    const response = toBeritaResponse(updated);
    auditService.persistNonBlocking({
      action: AuditAction.UPDATE,
      module: BERITA_MODULE,
      entityId: updated.id,
      userId: user.id,
      before,
      after: response,
      requestId,
    });
    return response;
  }

  async deleteBerita(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const berita = await repository.findById(id);
    if (!berita) throw HttpError.notFound("Berita tidak ditemukan");
    const before = toBeritaResponse(berita);

    await sequelize.transaction((trx) => repository.delete(berita, trx));
    if (before.photo_url) await deleteFileSafe(fromPublicUploadUrl(before.photo_url)?.absolutePath ?? null);
    if (before.file_url) await deleteFileSafe(fromPublicUploadUrl(before.file_url)?.absolutePath ?? null);

    auditService.persistNonBlocking({
      action: AuditAction.DELETE,
      module: BERITA_MODULE,
      entityId: before.id,
      userId: user.id,
      before,
      requestId,
    });
  }

  async restoreBerita(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<BeritaResponseDto> {
    const berita = await repository.findByIdWithDeleted(id);
    if (!berita) throw HttpError.notFound("Berita tidak ditemukan");
    if (!berita.deletedAt) {
      throw HttpError.badRequest("Berita tidak dalam status terhapus");
    }
    await sequelize.transaction((trx) => repository.restore(berita, trx));

    const after = toBeritaResponse(berita);
    auditService.persistNonBlocking({
      action: AuditAction.RESTORE,
      module: BERITA_MODULE,
      entityId: berita.id,
      userId: user.id,
      after,
      requestId,
    });
    return after;
  }

  private async createUniqueSlug(title: string, excludeId?: string): Promise<string> {
    const baseSlug = generateSlug(title);
    return ensureUniqueSlug(baseSlug, async (slug) => {
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
