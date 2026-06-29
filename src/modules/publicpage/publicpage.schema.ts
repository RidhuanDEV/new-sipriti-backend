import { z } from "zod";
import { beritaKategoriSchema } from "../berita/berita.schema.js";

export const publicPageListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  kategori: z.union([beritaKategoriSchema, z.literal("Semua")]).optional(),
});

export const publicPageSlugParamSchema = z.object({
  slug: z.string().trim().min(1, "Slug wajib diisi"),
});

export const publicPageIdParamSchema = z.object({
  id: z.string().trim().min(1, "ID wajib diisi"),
});
