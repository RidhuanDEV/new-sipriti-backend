import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { LANDING_SLIDER_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { buildSimpleMeta, normalizeSimplePagination } from "../../core/content/legacy-content.js";
import { HttpError } from "../../core/errors/http-error.js";
import { deleteFileSafe } from "../../core/storage/file-system.js";
import { fromPublicUploadUrl } from "../../core/storage/storage-paths.js";
import { LandingSliderRepository } from "./landingslider.repository.js";
import { toLandingSliderImageInfo, toLandingSliderResponse } from "./mappers/landingslider.mapper.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { SimplePaginationMeta } from "../../core/master-data/pagination.js";
import type { ProcessedImageInfo } from "../../core/storage/image-processing.js";
import type { CreateLandingSliderDto, LandingSliderMutationResultDto, LandingSliderResponseDto, ListLandingSliderAdminQueryDto, UpdateLandingSliderDto } from "./dto/landingslider.dto.js";

const repository = new LandingSliderRepository();

export interface LandingSliderProcessedImages {
  img_desktop?: ProcessedImageInfo;
  img_mobile?: ProcessedImageInfo;
}

export class LandingSliderService {
  async listLandingSliderPublic(): Promise<LandingSliderResponseDto[]> {
    const rows = await repository.findPublic();
    return rows.map((row) => toLandingSliderResponse(row));
  }

  async listLandingSliderAdmin(
    query: ListLandingSliderAdminQueryDto,
  ): Promise<{ rows: LandingSliderResponseDto[]; meta: SimplePaginationMeta }> {
    const pagination = normalizeSimplePagination(query, 50, 200);
    const result = await repository.findAndCountAdmin(query.status, pagination);
    return {
      rows: result.rows.map((row) => toLandingSliderResponse(row)),
      meta: buildSimpleMeta(pagination.page, pagination.limit, result.count),
    };
  }

  async getLandingSliderById(id: string): Promise<LandingSliderResponseDto> {
    const slider = await repository.findById(id);
    if (!slider) throw HttpError.notFound("Slider tidak ditemukan");
    return toLandingSliderResponse(slider);
  }

  async createLandingSlider(
    data: CreateLandingSliderDto,
    processedImages: LandingSliderProcessedImages,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<LandingSliderMutationResultDto> {
    const desktopImage = processedImages.img_desktop;
    const mobileImage = processedImages.img_mobile;
    if (!desktopImage || !mobileImage) {
      throw HttpError.badRequest("Gambar desktop dan mobile wajib diupload dan harus memenuhi kriteria validasi");
    }

    const created = await sequelize.transaction((trx) =>
      repository.create(
        {
          title: data.title.trim(),
          description: data.description ?? null,
          img_desktop: desktopImage.url,
          img_mobile: mobileImage.url,
          btn_text: data.btn_text ?? null,
          btn_link: data.btn_link ?? null,
          btn_color: data.btn_color ?? null,
          order_index: data.order_index ?? 0,
          status: data.status ?? "active",
        },
        trx,
      ),
    );
    const slider = toLandingSliderResponse(created);
    auditService.persistNonBlocking({
      action: AuditAction.CREATE,
      module: LANDING_SLIDER_MODULE,
      entityId: created.id,
      userId: user.id,
      after: slider,
      requestId,
    });

    return {
      slider,
      imageInfo: {
        desktop: toLandingSliderImageInfo(desktopImage),
        mobile: toLandingSliderImageInfo(mobileImage),
      },
    };
  }

  async updateLandingSlider(
    id: string,
    data: UpdateLandingSliderDto,
    processedImages: LandingSliderProcessedImages,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<LandingSliderMutationResultDto> {
    const slider = await repository.findById(id);
    if (!slider) throw HttpError.notFound("Slider tidak ditemukan");

    const before = toLandingSliderResponse(slider);
    const oldImgDesktop = slider.img_desktop;
    const oldImgMobile = slider.img_mobile;
    const updated = await sequelize.transaction((trx) =>
      repository.update(
        slider,
        {
          title: data.title !== undefined ? data.title : slider.title,
          description: data.description !== undefined ? data.description : slider.description,
          img_desktop: processedImages.img_desktop?.url ?? slider.img_desktop,
          img_mobile: processedImages.img_mobile?.url ?? slider.img_mobile,
          btn_text: data.btn_text !== undefined ? data.btn_text : slider.btn_text,
          btn_link: data.btn_link !== undefined ? data.btn_link : slider.btn_link,
          btn_color: data.btn_color !== undefined ? data.btn_color : slider.btn_color,
          order_index: data.order_index ?? slider.order_index,
          status: data.status ?? slider.status,
        },
        trx,
      ),
    );

    if (processedImages.img_desktop) {
      await deleteFileSafe(fromPublicUploadUrl(oldImgDesktop)?.absolutePath ?? null);
    }
    if (processedImages.img_mobile) {
      await deleteFileSafe(fromPublicUploadUrl(oldImgMobile)?.absolutePath ?? null);
    }

    const response = toLandingSliderResponse(updated);
    auditService.persistNonBlocking({
      action: AuditAction.UPDATE,
      module: LANDING_SLIDER_MODULE,
      entityId: updated.id,
      userId: user.id,
      before,
      after: response,
      requestId,
    });

    const result: LandingSliderMutationResultDto = { slider: response };
    if (processedImages.img_desktop || processedImages.img_mobile) {
      result.imageInfo = {};
      if (processedImages.img_desktop) result.imageInfo.desktop = toLandingSliderImageInfo(processedImages.img_desktop);
      if (processedImages.img_mobile) result.imageInfo.mobile = toLandingSliderImageInfo(processedImages.img_mobile);
    }
    return result;
  }

  async deleteLandingSlider(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const slider = await repository.findById(id);
    if (!slider) throw HttpError.notFound("Slider tidak ditemukan");

    const before = toLandingSliderResponse(slider);
    await sequelize.transaction((trx) => repository.delete(slider, trx));
    await deleteFileSafe(fromPublicUploadUrl(before.img_desktop)?.absolutePath ?? null);
    await deleteFileSafe(fromPublicUploadUrl(before.img_mobile)?.absolutePath ?? null);
    auditService.persistNonBlocking({
      action: AuditAction.DELETE,
      module: LANDING_SLIDER_MODULE,
      entityId: before.id,
      userId: user.id,
      before,
      requestId,
    });
  }

  async restoreLandingSlider(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<LandingSliderResponseDto> {
    const slider = await repository.findByIdWithDeleted(id);
    if (!slider) throw HttpError.notFound("Slider tidak ditemukan");
    if (!slider.deletedAt) {
      throw HttpError.badRequest("Slider tidak dalam status terhapus");
    }
    await sequelize.transaction((trx) => repository.restore(slider, trx));

    const after = toLandingSliderResponse(slider);
    auditService.persistNonBlocking({
      action: AuditAction.RESTORE,
      module: LANDING_SLIDER_MODULE,
      entityId: slider.id,
      userId: user.id,
      after,
      requestId,
    });
    return after;
  }
}
