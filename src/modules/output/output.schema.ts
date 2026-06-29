import { z } from "zod";

export const createOutputSchema = z.object({
  nama_output: z.string().trim().min(1, "Nama output tidak boleh kosong").max(255, "Nama output maksimal 255 karakter"),
});

export const updateOutputSchema = z.object({
  nama_output: z.string().trim().min(1, "Nama output tidak boleh kosong").max(255, "Nama output maksimal 255 karakter").optional(),
});

export const outputIdParamSchema = z.object({
  id: z.uuid("Format ID Output tidak valid"),
});

export const listOutputQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  search: z.string().optional().default(""),
});
