import type { z } from "zod";
import type { ImageDimensions, ImageSafeArea } from "../../../core/storage/image-processing.js";
import type { createLandingSliderSchema, landingSliderStatusSchema, listLandingSliderAdminQuerySchema, updateLandingSliderSchema } from "../landingslider.schema.js";

export type LandingSliderStatusDto = z.infer<typeof landingSliderStatusSchema>;
export type CreateLandingSliderDto = z.infer<typeof createLandingSliderSchema>;
export type UpdateLandingSliderDto = z.infer<typeof updateLandingSliderSchema>;
export type ListLandingSliderAdminQueryDto = z.infer<typeof listLandingSliderAdminQuerySchema>;

export interface LandingSliderResponseDto {
  id: string;
  title: string;
  description: string | null;
  img_desktop: string;
  img_mobile: string;
  btn_text: string | null;
  btn_link: string | null;
  btn_color: string | null;
  order_index: number;
  status: LandingSliderStatusDto;
  createdAt: Date;
  updatedAt: Date;
}

export interface LandingSliderImageInfoDto {
  dimensions: ImageDimensions;
  size: number;
  safeArea?: ImageSafeArea;
}

export interface LandingSliderMutationResultDto {
  slider: LandingSliderResponseDto;
  imageInfo?: {
    desktop?: LandingSliderImageInfoDto;
    mobile?: LandingSliderImageInfoDto;
  };
}
