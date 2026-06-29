import { z } from "zod";

export const landingSliderStatusSchema = z.enum(["active", "inactive"]);

const optionalText = z.string().trim().optional().nullable();

export const createLandingSliderSchema = z.object({
  title: z.string().trim().min(1, "Title tidak boleh kosong"),
  description: optionalText,
  btn_text: optionalText,
  btn_link: optionalText,
  btn_color: optionalText,
  order_index: z.coerce.number().int().min(0, "Order index harus berupa angka positif").optional(),
  status: landingSliderStatusSchema.optional(),
});

export const updateLandingSliderSchema = z.object({
  title: z.string().trim().min(1, "Title tidak boleh kosong").optional(),
  description: optionalText,
  btn_text: optionalText,
  btn_link: optionalText,
  btn_color: optionalText,
  order_index: z.coerce.number().int().min(0, "Order index harus berupa angka positif").optional(),
  status: landingSliderStatusSchema.optional(),
});

export const listLandingSliderAdminQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  status: landingSliderStatusSchema.optional(),
});

export const landingSliderIdParamSchema = z.object({
  id: z.string().uuid("Format ID Landing Slider tidak valid"),
});
