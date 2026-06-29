import { z } from "zod";

export const adminDashboardQuerySchema = z.object({
  tahun: z.string().trim().optional(),
  tipe: z.enum(["Penelitian", "Pengabdian", "HKI"]).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type AdminDashboardQuery = z.infer<typeof adminDashboardQuerySchema>;
