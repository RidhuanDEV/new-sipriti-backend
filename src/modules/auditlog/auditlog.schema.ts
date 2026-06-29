import { z } from "zod";

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  action: z.string().trim().optional(),
  entity_type: z.string().trim().optional(),
  start_date: z.string().trim().optional(),
  end_date: z.string().trim().optional(),
});

export const auditLogIdParamSchema = z.object({
  id: z.uuid("ID audit log tidak valid"),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
