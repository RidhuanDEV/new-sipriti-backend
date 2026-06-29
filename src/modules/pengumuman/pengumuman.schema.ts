import { z } from "zod";

export const createPengumumanSchema = z.object({
  judul: z.string().trim().min(3, "Judul minimal 3 karakter").max(200, "Judul maksimal 200 karakter"),
  isi_pengumuman: z.string().trim().min(10, "Isi pengumuman minimal 10 karakter"),
});

export const updatePengumumanSchema = z.object({
  judul: z.string().trim().min(3, "Judul minimal 3 karakter").max(200, "Judul maksimal 200 karakter"),
  isi_pengumuman: z.string().trim().min(10, "Isi pengumuman minimal 10 karakter"),
  remove_gambar: z.union([z.boolean(), z.enum(["true", "false", "1", "0"])]).optional(),
  remove_file_lampiran: z.union([z.boolean(), z.enum(["true", "false", "1", "0"])]).optional(),
});

export const listPengumumanQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  q: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["ASC", "DESC", "asc", "desc"]).default("DESC"),
});

export const pengumumanIdParamSchema = z.object({
  id: z.string().trim().min(1, "ID pengumuman wajib diisi"),
});
