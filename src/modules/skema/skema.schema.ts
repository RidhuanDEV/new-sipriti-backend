import { z } from "zod";

export const skemaTipeSchema = z.enum(["Penelitian", "Pengabdian", "HKI"]);
const optionalString = z.string().trim().optional().nullable();

export const createSkemaSchema = z.object({
  nama_skema: z.string().trim().min(3, "Nama skema minimal 3 karakter").max(200, "Nama skema maksimal 200 karakter"),
  tipe: skemaTipeSchema,
  deskripsi: optionalString,
});

export const updateSkemaSchema = z.object({
  nama_skema: z.string().trim().min(3, "Nama skema minimal 3 karakter").max(200, "Nama skema maksimal 200 karakter").optional(),
  tipe: skemaTipeSchema.optional(),
  deskripsi: optionalString,
  is_active: z.union([z.boolean(), z.enum(["true", "false", "1", "0"])]).optional(),
});

export const skemaIdParamSchema = z.object({ id: z.string().min(1, "ID skema wajib diisi") });

export const listSkemaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  search: z.string().optional().default(""),
  tipe: z.string().optional().default(""),
  sortBy: z.enum(["created_at", "updated_at", "nama_skema", "tipe", "is_active"]).default("created_at"),
  sortOrder: z.enum(["ASC", "DESC", "asc", "desc"]).default("DESC"),
});

export const skemaOptionsQuerySchema = z.object({
  tipe: z.string().optional().default(""),
});
