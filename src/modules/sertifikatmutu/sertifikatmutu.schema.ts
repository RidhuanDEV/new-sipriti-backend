import { z } from "zod";

const optionalString = z.string().trim().optional().nullable();

export const createSertifikatMutuSchema = z.object({
  sertifikat_description: optionalString,
});

export const updateSertifikatMutuSchema = z.object({
  sertifikat_description: optionalString,
});

export const sertifikatMutuIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID Sertifikat Mutu tidak valid"),
});

export const listSertifikatMutuQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
});
