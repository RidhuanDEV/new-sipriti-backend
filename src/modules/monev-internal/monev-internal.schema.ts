import { z } from "zod";

export const monevDocumentStatusSchema = z.enum(["Pending", "Complete", "Uploaded"]);
export const monevDirektoratSchema = z.enum(["PRPM", "PRODI", "PKA"]);
export const monevJenisUsulanSchema = z.enum(["Penelitian", "Pengabdian"]);

const optionalString = z
  .string()
  .trim()
  .optional()
  .nullable();

export const createMonevInternalSchema = z.object({
  usulan_id: z.uuid("ID Usulan tidak valid"),
  tgl_monev: z.string().trim().min(1, "Tanggal monev wajib diisi"),
  direktorat: monevDirektoratSchema,
  jenis_usulan: monevJenisUsulanSchema,
  catatan: optionalString,
});

export const updateMonevInternalSchema = z.object({
  tgl_monev: z.string().trim().min(1, "Tanggal monev wajib diisi").optional(),
  direktorat: monevDirektoratSchema.optional(),
  catatan: optionalString,
  status_dokumen: monevDocumentStatusSchema.optional(),
  berita_acara: optionalString,
  form_penilaian: optionalString,
  ringkasan_monev: optionalString,
});

export const monevInternalIdParamSchema = z.object({
  id: z.uuid("ID Monev Internal tidak valid"),
});

export const monevListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  jenisUsulan: z.string().trim().optional(),
  direktorat: z.string().trim().optional(),
  status: z.string().trim().optional(),
  sortBy: z.string().trim().default("tgl_monev"),
  sortOrder: z.string().trim().default("DESC"),
});

export const monevUsulanOptionsQuerySchema = z.object({
  tipe: z.enum(["Penelitian", "Pengabdian"]).optional(),
});

export type CreateMonevInternalBody = z.infer<typeof createMonevInternalSchema>;
export type UpdateMonevInternalBody = z.infer<typeof updateMonevInternalSchema>;
export type MonevListQuery = z.infer<typeof monevListQuerySchema>;
export type MonevUsulanOptionsQuery = z.infer<typeof monevUsulanOptionsQuerySchema>;
