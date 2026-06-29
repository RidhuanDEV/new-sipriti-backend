import { z } from "zod";
import { DESKRIPSI_CAPAIAN_SECTION_KEYS } from "./deskripsicapaian.model.js";

export const sectionKeySchema = z.enum(DESKRIPSI_CAPAIAN_SECTION_KEYS);

export const capaianRangeQuerySchema = z.object({
  tahun_mulai: z.coerce.number().int().optional(),
  tahun_selesai: z.coerce.number().int().optional(),
  limit_tahun: z.coerce.number().int().min(1).max(20).optional(),
});

export const sectionKeyParamSchema = z.object({
  sectionKey: sectionKeySchema,
});

export const upsertDeskripsiSchema = z.object({
  content: z.string().optional().nullable(),
  deskripsi: z.string().optional().nullable(),
});

const deskripsiItemSchema = z.object({
  section_key: sectionKeySchema,
  content: z.string().optional().nullable(),
  deskripsi: z.string().optional().nullable(),
});

export const batchUpsertDeskripsiSchema = z.object({
  items: z.array(deskripsiItemSchema).optional(),
  sections: z.array(deskripsiItemSchema).optional(),
});
