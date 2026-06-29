import type { LandingSlider } from "../landingslider.model.js";
import type { LandingSliderImageInfoDto, LandingSliderResponseDto } from "../dto/landingslider.dto.js";
import type { ProcessedImageInfo } from "../../../core/storage/image-processing.js";

export function toLandingSliderResponse(row: LandingSlider): LandingSliderResponseDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    img_desktop: row.img_desktop,
    img_mobile: row.img_mobile,
    btn_text: row.btn_text,
    btn_link: row.btn_link,
    btn_color: row.btn_color,
    order_index: row.order_index,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toLandingSliderImageInfo(image: ProcessedImageInfo): LandingSliderImageInfoDto {
  const response: LandingSliderImageInfoDto = {
    dimensions: image.dimensions,
    size: image.size,
  };
  if (image.metadata.safeArea) response.safeArea = image.metadata.safeArea;
  return response;
}
