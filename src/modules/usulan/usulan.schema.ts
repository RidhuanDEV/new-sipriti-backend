import { z } from "zod";

export const listUsulanQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(10),
  search: z.string().trim().optional().default(""),
  tahun: z.string().trim().optional().default(""),
  skema: z.string().trim().optional().default(""),
  status: z.string().trim().optional().default(""),
  tipe: z.string().trim().optional().default(""),
  tahun_akademik_id: z.string().trim().optional().default(""),
  sortBy: z.string().trim().optional().default("createdAt"),
  sortOrder: z.enum(["ASC", "DESC", "asc", "desc"]).optional().default("DESC"),
});

export const usulanIdParamSchema = z.object({
  id: z.string().min(1, "ID usulan wajib diisi"),
});

export const usulanStatisticsQuerySchema = z.object({
  tahun: z.string().trim().optional().default(""),
});

export type ListUsulanQueryDto = z.infer<typeof listUsulanQuerySchema>;
export type UsulanStatisticsQueryDto = z.infer<typeof usulanStatisticsQuerySchema>;
