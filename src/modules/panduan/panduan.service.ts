import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { PANDUAN_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { buildSimpleMeta, normalizeSimplePagination, parseBooleanLike } from "../../core/content/legacy-content.js";
import { HttpError } from "../../core/errors/http-error.js";
import { deleteFileSafe } from "../../core/storage/file-system.js";
import { fromPublicUploadUrl, toPublicUploadUrl } from "../../core/storage/storage-paths.js";
import { toPanduanResponse } from "./mappers/panduan.mapper.js";
import { PanduanRepository } from "./panduan.repository.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { SimplePaginationMeta } from "../../core/master-data/pagination.js";
import type { CreatePanduanDto, ListPanduanQueryDto, PanduanResponseDto, UpdatePanduanDto } from "./dto/panduan.dto.js";

interface PanduanFiles {
  thumbnail?: Express.Multer.File[];
  file?: Express.Multer.File[];
}

const repository = new PanduanRepository();

export class PanduanService {
  async listPanduan(
    query: ListPanduanQueryDto,
    isAdmin: boolean,
  ): Promise<{ rows: PanduanResponseDto[]; meta: SimplePaginationMeta }> {
    const maxLimit = isAdmin ? 200 : 6;
    const pagination = normalizeSimplePagination(query, 10, maxLimit);
    const result = await repository.findAndCount(query, pagination, maxLimit);
    return {
      rows: result.rows.map((row) => toPanduanResponse(row)),
      meta: buildSimpleMeta(pagination.page, pagination.limit, result.count),
    };
  }

  async getPanduanById(id: string): Promise<PanduanResponseDto> {
    const panduan = await repository.findById(id);
    if (!panduan) throw HttpError.notFound("Panduan tidak ditemukan");
    return toPanduanResponse(panduan);
  }

  async createPanduan(
    data: CreatePanduanDto,
    files: PanduanFiles,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<PanduanResponseDto> {
    const created = await sequelize.transaction((trx) =>
      repository.create(
        {
          ...data,
          thumbnail: files.thumbnail?.[0] ? toPublicUploadUrl("panduan", files.thumbnail[0].filename) : null,
          file_url: files.file?.[0] ? toPublicUploadUrl("panduan", files.file[0].filename) : null,
        },
        trx,
      ),
    );

    const response = toPanduanResponse(created);
    auditService.persistNonBlocking({
      action: AuditAction.CREATE,
      module: PANDUAN_MODULE,
      entityId: created.id,
      userId: user.id,
      after: response,
      requestId,
    });
    return response;
  }

  async updatePanduan(
    id: string,
    data: UpdatePanduanDto,
    files: PanduanFiles,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<PanduanResponseDto> {
    const panduan = await repository.findById(id);
    if (!panduan) throw HttpError.notFound("Panduan tidak ditemukan");
    const before = toPanduanResponse(panduan);
    const oldThumbnail = panduan.thumbnail;
    const oldFileUrl = panduan.file_url;

    const updated = await sequelize.transaction((trx) =>
      repository.update(
        panduan,
        {
          ...data,
          thumbnail: this.resolveNextUrl(
            panduan.thumbnail,
            files.thumbnail?.[0],
            "panduan",
            parseBooleanLike(data.remove_thumbnail),
          ),
          file_url: this.resolveNextUrl(
            panduan.file_url,
            files.file?.[0],
            "panduan",
            parseBooleanLike(data.remove_file),
          ),
        },
        trx,
      ),
    );

    if (files.thumbnail?.[0] && oldThumbnail) await deleteFileSafe(fromPublicUploadUrl(oldThumbnail)?.absolutePath ?? null);
    if (files.file?.[0] && oldFileUrl) await deleteFileSafe(fromPublicUploadUrl(oldFileUrl)?.absolutePath ?? null);
    if (parseBooleanLike(data.remove_thumbnail) && oldThumbnail) await deleteFileSafe(fromPublicUploadUrl(oldThumbnail)?.absolutePath ?? null);
    if (parseBooleanLike(data.remove_file) && oldFileUrl) await deleteFileSafe(fromPublicUploadUrl(oldFileUrl)?.absolutePath ?? null);

    const response = toPanduanResponse(updated);
    auditService.persistNonBlocking({
      action: AuditAction.UPDATE,
      module: PANDUAN_MODULE,
      entityId: updated.id,
      userId: user.id,
      before,
      after: response,
      requestId,
    });
    return response;
  }

  async deletePanduan(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const panduan = await repository.findById(id);
    if (!panduan) throw HttpError.notFound("Panduan tidak ditemukan");
    const before = toPanduanResponse(panduan);
    await sequelize.transaction((trx) => repository.delete(panduan, trx));

    if (before.thumbnail) await deleteFileSafe(fromPublicUploadUrl(before.thumbnail)?.absolutePath ?? null);
    if (before.file_url) await deleteFileSafe(fromPublicUploadUrl(before.file_url)?.absolutePath ?? null);
    auditService.persistNonBlocking({
      action: AuditAction.DELETE,
      module: PANDUAN_MODULE,
      entityId: before.id,
      userId: user.id,
      before,
      requestId,
    });
  }

  async restorePanduan(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<PanduanResponseDto> {
    const panduan = await repository.findByIdWithDeleted(id);
    if (!panduan) throw HttpError.notFound("Panduan tidak ditemukan");
    if (!panduan.deletedAt) {
      throw HttpError.badRequest("Panduan tidak dalam status terhapus");
    }
    await sequelize.transaction((trx) => repository.restore(panduan, trx));

    const after = toPanduanResponse(panduan);
    auditService.persistNonBlocking({
      action: AuditAction.RESTORE,
      module: PANDUAN_MODULE,
      entityId: panduan.id,
      userId: user.id,
      after,
      requestId,
    });
    return after;
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
