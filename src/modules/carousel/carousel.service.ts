import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { CAROUSEL_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { buildSimpleMeta, normalizeSimplePagination, parseBooleanLike } from "../../core/content/legacy-content.js";
import { HttpError } from "../../core/errors/http-error.js";
import { deleteFileSafe } from "../../core/storage/file-system.js";
import { fromPublicUploadUrl, toPublicUploadUrl } from "../../core/storage/storage-paths.js";
import { CarouselRepository } from "./carousel.repository.js";
import { toCarouselResponse } from "./mappers/carousel.mapper.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { SimplePaginationMeta } from "../../core/master-data/pagination.js";
import type { CarouselResponseDto, CreateCarouselDto, ListCarouselAdminQueryDto, ListCarouselQueryDto, UpdateCarouselDto } from "./dto/carousel.dto.js";

const repository = new CarouselRepository();

export class CarouselService {
  async listCarousel(query: ListCarouselQueryDto): Promise<CarouselResponseDto[]> {
    const rows = await repository.findPublic(query);
    return rows.map((row) => toCarouselResponse(row));
  }

  async listCarouselAdmin(
    query: ListCarouselAdminQueryDto,
  ): Promise<{ rows: CarouselResponseDto[]; meta: SimplePaginationMeta }> {
    const pagination = normalizeSimplePagination(query, 100, 200);
    const result = await repository.findAndCountAdmin(query, pagination);
    return {
      rows: result.rows.map((row) => toCarouselResponse(row)),
      meta: buildSimpleMeta(pagination.page, pagination.limit, result.count),
    };
  }

  async getCarouselById(id: string): Promise<CarouselResponseDto> {
    const carousel = await repository.findById(id);
    if (!carousel) throw HttpError.notFound("Carousel tidak ditemukan");
    return toCarouselResponse(carousel);
  }

  async createCarousel(
    data: CreateCarouselDto,
    file: Express.Multer.File | undefined,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<CarouselResponseDto> {
    const imageUrl = file ? toPublicUploadUrl("images", file.filename) : data.image_url;
    if (!imageUrl) throw HttpError.badRequest("Gambar carousel wajib diupload");

    const created = await sequelize.transaction((trx) =>
      repository.create(
        {
          ...data,
          image_url: imageUrl,
          is_active_normalized: parseBooleanLike(data.is_active) ?? true,
          page: data.page,
        },
        trx,
      ),
    );
    const response = toCarouselResponse(created);
    auditService.persistNonBlocking({
      action: AuditAction.CREATE,
      module: CAROUSEL_MODULE,
      entityId: created.id,
      userId: user.id,
      after: response,
      requestId,
    });
    return response;
  }

  async updateCarousel(
    id: string,
    data: UpdateCarouselDto,
    file: Express.Multer.File | undefined,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<CarouselResponseDto> {
    const carousel = await repository.findById(id);
    if (!carousel) throw HttpError.notFound("Carousel tidak ditemukan");

    const before = toCarouselResponse(carousel);
    const oldImageUrl = carousel.image_url;
    const imageUrl = file
      ? toPublicUploadUrl("images", file.filename)
      : data.image_url ?? carousel.image_url;
    const updated = await sequelize.transaction((trx) =>
      repository.update(
        carousel,
        {
          ...data,
          image_url: imageUrl,
          is_active_normalized: parseBooleanLike(data.is_active) ?? carousel.is_active,
          page: data.page ?? carousel.page,
        },
        trx,
      ),
    );

    if (file && oldImageUrl) await deleteFileSafe(fromPublicUploadUrl(oldImageUrl)?.absolutePath ?? null);
    const response = toCarouselResponse(updated);
    auditService.persistNonBlocking({
      action: AuditAction.UPDATE,
      module: CAROUSEL_MODULE,
      entityId: updated.id,
      userId: user.id,
      before,
      after: response,
      requestId,
    });
    return response;
  }

  async restoreCarousel(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<CarouselResponseDto> {
    const carousel = await repository.findByIdParanoid(id);
    if (!carousel) throw HttpError.notFound("Carousel tidak ditemukan");
    if (!carousel.deletedAt) throw HttpError.badRequest("Carousel tidak dalam status terhapus");
    const restored = await sequelize.transaction((trx) => repository.restore(carousel, trx));
    const response = toCarouselResponse(restored);
    auditService.persistNonBlocking({
      action: AuditAction.RESTORE,
      module: CAROUSEL_MODULE,
      entityId: restored.id,
      userId: user.id,
      after: response,
      requestId,
    });
    return response;
  }

  async deleteCarousel(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const carousel = await repository.findById(id);
    if (!carousel) throw HttpError.notFound("Carousel tidak ditemukan");
    const before = toCarouselResponse(carousel);
    await sequelize.transaction((trx) => repository.delete(carousel, trx));
    if (before.image_url) await deleteFileSafe(fromPublicUploadUrl(before.image_url)?.absolutePath ?? null);
    auditService.persistNonBlocking({
      action: AuditAction.DELETE,
      module: CAROUSEL_MODULE,
      entityId: before.id,
      userId: user.id,
      before,
      requestId,
    });
  }
}
