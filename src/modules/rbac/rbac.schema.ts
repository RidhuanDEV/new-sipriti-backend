import { z } from "zod";

export const createPermissionSchema = z.object({
  name: z.string().trim().min(1, "Nama permission wajib diisi").max(128),
  description: z.string().trim().max(255).optional().nullable(),
  module: z.string().trim().max(50).optional().nullable(),
});

export const permissionIdParamSchema = z.object({
  id: z.string().trim().min(1, "ID Permission wajib diisi"),
});

export const createRoleSchema = z.object({
  name: z.string().trim().min(1, "Nama role wajib diisi").max(64),
  description: z.string().trim().max(255).optional().nullable(),
  permissions: z.array(z.uuid()).optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().trim().min(1, "Nama role wajib diisi").max(64).optional(),
  description: z.string().trim().max(255).optional().nullable(),
  is_active: z.coerce.boolean().optional(),
});

export const roleIdParamSchema = z.object({
  id: z.string().trim().min(1, "ID Role wajib diisi"),
});

export const assignPermissionsSchema = z.object({
  permissions: z.array(z.uuid(), "Daftar permission wajib diisi"),
});

export const listUsersWithRolesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(20),
  search: z.string().trim().optional(),
});

export const userRoleParamSchema = z.object({
  userId: z.string().trim().min(1, "ID User wajib diisi"),
});

export const assignUserRolesSchema = z.object({
  userId: z.uuid().optional(),
  role_id: z.array(z.uuid(), "Daftar role wajib diisi"),
});

export const userRoleDetailParamSchema = z.object({
  userId: z.string().trim().min(1, "ID User wajib diisi"),
  roleId: z.string().trim().min(1, "ID Role wajib diisi"),
});

export const permissionListQuerySchema = z.object({
  module: z.string().trim().optional(),
});

export const roleListQuerySchema = z.object({
  includePermissions: z.string().trim().optional(),
});

export type CreateRbacPermissionDto = z.infer<typeof createPermissionSchema>;
export type CreateRbacRoleDto = z.infer<typeof createRoleSchema>;
export type UpdateRbacRoleDto = z.infer<typeof updateRoleSchema>;
export type AssignRbacPermissionsDto = z.infer<typeof assignPermissionsSchema>;
export type ListUsersWithRolesQueryDto = z.infer<typeof listUsersWithRolesQuerySchema>;
export type AssignUserRolesDto = z.infer<typeof assignUserRolesSchema>;
export type PermissionListQueryDto = z.infer<typeof permissionListQuerySchema>;
export type RoleListQueryDto = z.infer<typeof roleListQuerySchema>;
