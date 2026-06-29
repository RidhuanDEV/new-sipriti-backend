import { z } from "zod";

export const createBidangFokusSchema = z.object({
  nama_bidang: z.string().trim().min(1, "Nama bidang minimal 1 karakter").max(100, "Nama bidang maksimal 100 karakter"),
});

export const updateBidangFokusSchema = z.object({
  nama_bidang: z.string().trim().min(1, "Nama bidang minimal 1 karakter").max(100, "Nama bidang maksimal 100 karakter").optional(),
});

export const bidangFokusIdParamSchema = z.object({
  id: z.uuid("Format ID Bidang Fokus tidak valid"),
});

export const listBidangFokusQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  search: z.string().optional().default(""),
  sortBy: z.enum(["created_at", "updated_at", "nama_bidang"]).default("created_at"),
  sortOrder: z.enum(["ASC", "DESC", "asc", "desc"]).default("DESC"),
});
