import type { Carousel } from "../carousel.model.js";
import type { CarouselResponseDto } from "../dto/carousel.dto.js";

export function toCarouselResponse(row: Carousel): CarouselResponseDto {
  return {
    id: row.id,
    image_url: row.image_url,
    title: row.title,
    description: row.description,
    is_active: row.is_active,
    display_order: row.display_order,
    page: row.page,
    tentang_prpm_description: row.tentang_prpm_description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
