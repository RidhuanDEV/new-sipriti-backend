import { z } from "zod";

export const dashboardPaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(5),
});

export type DashboardPaginationQuery = z.infer<typeof dashboardPaginationQuerySchema>;
