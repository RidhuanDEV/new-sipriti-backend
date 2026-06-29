import { z } from "zod";

export const createPanduanSchema = z.object({
  judul: z.string().trim().min(3, "Judul minimal 3 karakter").max(200, "Judul maksimal 200 karakter"),
  isi_panduan: z.string().trim().min(10, "Isi panduan minimal 10 karakter"),
});

export const updatePanduanSchema = z.object({
  judul: z.string().trim().min(3, "Judul minimal 3 karakter").max(200, "Judul maksimal 200 karakter"),
  isi_panduan: z.string().trim().min(10, "Isi panduan minimal 10 karakter"),
  remove_thumbnail: z.union([z.boolean(), z.enum(["true", "false", "1", "0"])]).optional(),
  remove_file: z.union([z.boolean(), z.enum(["true", "false", "1", "0"])]).optional(),
});

export const listPanduanQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  q: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["ASC", "DESC", "asc", "desc"]).default("DESC"),
});

export const panduanIdParamSchema = z.object({
  id: z.string().trim().min(1, "ID panduan wajib diisi"),
});
