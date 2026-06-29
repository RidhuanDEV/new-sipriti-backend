import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(1).max(64),
  description: z.string().trim().max(255).optional().nullable(),
  is_active: z.coerce.boolean().optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  description: z.string().trim().max(255).optional().nullable(),
  is_active: z.coerce.boolean().optional(),
});

export const roleIdSchema = z.object({
  id: z.uuid(),
});

export const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.uuid()).optional(),
  permissions: z.array(z.uuid()).optional(),
});

export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
export type AssignPermissionsDto = z.infer<typeof assignPermissionsSchema>;
