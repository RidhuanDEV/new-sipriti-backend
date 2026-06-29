import { z } from "zod";

export const searchAnggotaQuerySchema = z.object({
  keyword: z.string().trim().max(100).optional().default(""),
});

export type SearchAnggotaQuerySchema = z.infer<typeof searchAnggotaQuerySchema>;
