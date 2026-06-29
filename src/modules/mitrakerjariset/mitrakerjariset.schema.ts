import { z } from "zod";

const optionalText = z.string().trim().optional().nullable();

export const createMitraKerjaRisetSchema = z.object({
  nama_mitra: z.string().trim().min(1, "Nama mitra tidak boleh kosong"),
  mitra_description: optionalText,
});

export const updateMitraKerjaRisetSchema = z.object({
  nama_mitra: z.string().trim().min(1, "Nama mitra tidak boleh kosong").optional(),
  mitra_description: optionalText,
});

export const listMitraKerjaRisetQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  search: z.string().optional(),
  q: z.string().optional(),
});

export const mitraKerjaRisetIdParamSchema = z.object({
  id: z.string().uuid("Format ID Mitra Kerja Riset tidak valid"),
});
