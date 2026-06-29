import { z } from "zod";
import type { createCarouselSchema, listCarouselAdminQuerySchema, listCarouselQuerySchema, updateCarouselSchema } from "../carousel.schema.js";
import type { CarouselPage } from "../carousel.model.js";

export type CreateCarouselDto = z.infer<typeof createCarouselSchema>;
export type UpdateCarouselDto = z.infer<typeof updateCarouselSchema>;
export type ListCarouselQueryDto = z.infer<typeof listCarouselQuerySchema>;
export type ListCarouselAdminQueryDto = z.infer<typeof listCarouselAdminQuerySchema>;

export interface CarouselResponseDto {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
  page: CarouselPage;
  tentang_prpm_description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
