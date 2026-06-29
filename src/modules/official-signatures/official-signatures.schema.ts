import { z } from "zod";

export const signatureIdParamSchema = z.object({
  id: z.uuid("ID signature tidak valid"),
});

export const listOfficialSignatureQuerySchema = z.object({
  signature_key: z.string().trim().max(100).optional(),
  kode_prodi: z.string().trim().max(20).optional(),
  is_active: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional(),
  isActive: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional(),
});

export const createOfficialSignatureSchema = z.object({
  signature_key: z.string().trim().max(100).default("mengetahui"),
  role_code: z.string().trim().max(100).optional().nullable(),
  kode_prodi: z.string().trim().min(1, "Kode prodi wajib diisi").max(20),
  signer_name: z.string().trim().min(1, "Nama penanda tangan wajib diisi").max(255),
  signer_nidn: z.string().trim().max(50).optional().nullable(),
});

export const updateOfficialSignatureSchema = createOfficialSignatureSchema.partial();

export type ListOfficialSignatureQuery = z.infer<typeof listOfficialSignatureQuerySchema>;
export type CreateOfficialSignatureBody = z.infer<typeof createOfficialSignatureSchema>;
export type UpdateOfficialSignatureBody = z.infer<typeof updateOfficialSignatureSchema>;
