import type { Permission } from "../../permissions/permission.model.js";
import type { Role } from "../../roles/role.model.js";
import type { User } from "../../user/user.model.js";
import type { RbacPermissionDto, RbacRoleDto, RbacUserDto } from "../dto/rbac.dto.js";

export function toRbacPermission(permission: Permission): RbacPermissionDto {
  return {
    id: permission.id,
    name: permission.name,
    description: permission.description ?? null,
    module: permission.module ?? null,
    createdAt: permission.createdAt,
    updatedAt: permission.updatedAt,
  };
}

export function toRbacRole(role: Role): RbacRoleDto {
  return {
    id: role.id,
    name: role.name,
    description: role.description ?? null,
    is_active: role.isActive,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    ...(role.permissions ? { permissions: role.permissions.map((permission) => toRbacPermission(permission)) } : {}),
  };
}

export function toRbacUser(user: User): RbacUserDto {
  const roles = user.roles?.map((role) => toRbacRole(role)) ?? [];
  return {
    id: user.id,
    name: user.name ?? null,
    username: user.username ?? null,
    email: user.email ?? null,
    roles,
    roleNames: roles.map((role) => role.name),
  };
}
