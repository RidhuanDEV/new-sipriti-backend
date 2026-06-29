import { z } from "zod";

export const beritaKategoriSchema = z.enum(["Pendanaan", "Workshop", "Panduan", "Umum"]);

export const createBeritaSchema = z.object({
  judul: z.string().trim().min(3, "Judul minimal 3 karakter").max(200, "Judul maksimal 200 karakter"),
  isi_berita: z.string().trim().min(10, "Isi berita minimal 10 karakter"),
  kategori: beritaKategoriSchema.default("Umum"),
});

export const updateBeritaSchema = z.object({
  judul: z.string().trim().min(3, "Judul minimal 3 karakter").max(200, "Judul maksimal 200 karakter"),
  isi_berita: z.string().trim().min(10, "Isi berita minimal 10 karakter"),
  kategori: beritaKategoriSchema.optional(),
  remove_photo: z.union([z.boolean(), z.enum(["true", "false", "1", "0"])]).optional(),
  remove_file: z.union([z.boolean(), z.enum(["true", "false", "1", "0"])]).optional(),
});

export const listBeritaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  q: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["ASC", "DESC", "asc", "desc"]).default("DESC"),
  kategori: z.union([beritaKategoriSchema, z.literal("Semua")]).optional(),
});

export const beritaIdParamSchema = z.object({
  id: z.string().trim().min(1, "ID berita wajib diisi"),
});
