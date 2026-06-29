import { z } from "zod";

const optionalText = z.string().trim().optional().nullable();

export const createPenghargaanRisetSchema = z.object({
  penghargaan_description: optionalText,
  penghargaan_image: optionalText,
});

export const updatePenghargaanRisetSchema = z.object({
  penghargaan_description: optionalText,
  penghargaan_image: optionalText,
});

export const listPenghargaanRisetQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
});

export const penghargaanRisetIdParamSchema = z.object({
  id: z.coerce.number().int().min(1, "ID Penghargaan Riset tidak valid"),
});
