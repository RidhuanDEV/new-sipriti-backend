import { z } from "zod";

export const jenisHkiSchema = z.enum(["Paten", "Merek", "Hak Cipta", "Desain Industri", "Rahasia Dagang"]);
export const statusHkiSchema = z.enum(["Draft", "Pending", "Approved", "Declined", "Registered"]);

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .nullable();

export const createHkiSchema = z
  .object({
    judul: z.string().trim().min(3, "Judul minimal 3 karakter").max(300, "Judul maksimal 300 karakter"),
    jenis_hki: jenisHkiSchema,
    sub_jenis_ciptaan: optionalTrimmedString,
    nomor_permohonan: optionalTrimmedString,
    tanggal_permohonan: optionalTrimmedString,
    status_hki: statusHkiSchema.optional(),
    inventor: z.string().trim().min(3, "Inventor minimal 3 karakter").max(500, "Inventor maksimal 500 karakter"),
    pemegang_hak: z.string().trim().min(3, "Pemegang hak minimal 3 karakter").max(500, "Pemegang hak maksimal 500 karakter"),
    deskripsi: optionalTrimmedString,
    sertifikatFileId: optionalTrimmedString,
    dokumenFileId: optionalTrimmedString,
    remove_sertifikatFile: z.coerce.boolean().optional(),
    remove_dokumenFile: z.coerce.boolean().optional(),
  })
  .strict();

export const updateHkiSchema = createHkiSchema.partial();

export const hkiDetailQuerySchema = z.object({
  id: z.string().trim().min(1, "ID HKI wajib diisi"),
});

export const listHkiQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.string().trim().optional(),
  jenis_hki: z.string().trim().optional(),
});

export const hkiIdParamSchema = z.object({
  id: z.string().trim().min(1, "ID HKI wajib diisi"),
});

export const hkiReviewQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.string().trim().optional(),
  search: z.string().trim().optional(),
  prodi: z.string().trim().optional(),
});

export const approveHkiSchema = z.object({
  catatan: optionalTrimmedString,
});

export const rejectHkiSchema = z.object({
  catatan: z.string().trim().min(1, "Catatan penolakan tidak boleh kosong"),
});

export type CreateHkiBody = z.infer<typeof createHkiSchema>;
export type UpdateHkiBody = z.infer<typeof updateHkiSchema>;
export type ListHkiQuery = z.infer<typeof listHkiQuerySchema>;
export type HkiReviewQuery = z.infer<typeof hkiReviewQuerySchema>;
export type ApproveHkiBody = z.infer<typeof approveHkiSchema>;
export type RejectHkiBody = z.infer<typeof rejectHkiSchema>;
