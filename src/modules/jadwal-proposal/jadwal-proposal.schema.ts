import { z } from "zod";
import { proposalSectionIdParamSchema } from "../penelitian-proposal/penelitian-proposal.schema.js";

export const jadwalItemSchema = z.object({
  nama_kegiatan: z.string().trim().min(1).optional(),
  tahun: z.coerce.number().int().min(1).optional().default(1),
  bulan_aktif: z.array(z.coerce.number().int().min(1).max(12)).optional(),
  urutan: z.coerce.number().int().min(1).optional().default(1),
});

export const jadwalBodySchema = z.union([
  z.array(jadwalItemSchema),
  z.object({ items: z.array(jadwalItemSchema).optional().default([]) }),
]);

export type JadwalItemSchema = z.infer<typeof jadwalItemSchema>;
export type JadwalBodySchema = z.infer<typeof jadwalBodySchema>;
export { proposalSectionIdParamSchema };
