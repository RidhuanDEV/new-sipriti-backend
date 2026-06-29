import { z } from "zod";

export const notificationIdParamSchema = z.object({
  id: z.string().uuid("ID Notification tidak valid"),
});

export const inviteIdParamSchema = z.object({
  id: z.string().uuid("ID Invite tidak valid"),
});

export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(10).optional().default(10),
  status: z.enum(["read", "unread"]).optional(),
});

export const inviteActionBodySchema = z.object({
  type: z.string().optional(),
});

export type NotificationListQuerySchema = z.infer<typeof notificationListQuerySchema>;
