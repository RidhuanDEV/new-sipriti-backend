import { z } from "zod";

export const jenjangProdiSchema = z.enum(["D3", "S1", "S2", "S3"]);

export const createProdiSchema = z.object({
  kode_prodi: z.string().trim().min(1, "Kode prodi tidak boleh kosong").max(20, "Kode prodi maksimal 20 karakter"),
  nama_prodi: z.string().trim().min(1, "Nama prodi tidak boleh kosong").max(255, "Nama prodi maksimal 255 karakter"),
  jenjang: jenjangProdiSchema,
});

export const updateProdiSchema = z.object({
  kode_prodi: z.string().trim().min(1, "Kode prodi tidak boleh kosong").max(20, "Kode prodi maksimal 20 karakter").optional(),
  nama_prodi: z.string().trim().min(1, "Nama prodi tidak boleh kosong").max(255, "Nama prodi maksimal 255 karakter").optional(),
  jenjang: jenjangProdiSchema.optional(),
});

export const prodiIdParamSchema = z.object({
  id: z.uuid("Format ID Prodi tidak valid"),
});

export const listProdiQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  search: z.string().optional().default(""),
  jenjang: z.string().optional().default(""),
  sortBy: z.enum(["created_at", "updated_at", "kode_prodi", "nama_prodi", "jenjang"]).default("created_at"),
  sortOrder: z.enum(["ASC", "DESC", "asc", "desc"]).default("DESC"),
});
