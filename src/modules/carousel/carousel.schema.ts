import { z } from "zod";

export const carouselPageSchema = z.enum(["capaian", "dashboard", "landing"]);
const booleanLikeSchema = z.union([z.boolean(), z.enum(["true", "false", "1", "0"])]);

export const createCarouselSchema = z.object({
  title: z.string().trim().optional(),
  is_active: booleanLikeSchema.default(true),
  page: carouselPageSchema.default("capaian"),
  image_url: z.string().optional(),
});

export const updateCarouselSchema = z.object({
  title: z.string().trim().optional(),
  is_active: booleanLikeSchema.optional(),
  page: carouselPageSchema.optional(),
  image_url: z.string().optional(),
});

export const listCarouselQuerySchema = z.object({
  page: carouselPageSchema.optional(),
  active_only: z.union([z.string(), z.boolean()]).optional(),
});

export const listCarouselAdminQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  pageFilter: carouselPageSchema.optional(),
  search: z.string().optional(),
  q: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["ASC", "DESC", "asc", "desc"]).default("DESC"),
});

export const carouselIdParamSchema = z.object({
  id: z.string().trim().min(1, "ID carousel wajib diisi"),
});
