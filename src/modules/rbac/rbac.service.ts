import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { PERMISSION_MODULE, ROLE_MODULE, USER_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { cacheService } from "../../core/cache/cache.service.js";
import { HttpError } from "../../core/errors/http-error.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import { toRbacPermission, toRbacRole, toRbacUser } from "./mappers/rbac.mapper.js";
import { RbacRepository } from "./rbac.repository.js";
import type { RbacPaginationDto, RbacPermissionDto, RbacRoleDto, RbacUserDto } from "./dto/rbac.dto.js";
import type {
  AssignRbacPermissionsDto,
  AssignUserRolesDto,
  CreateRbacPermissionDto,
  CreateRbacRoleDto,
  ListUsersWithRolesQueryDto,
  PermissionListQueryDto,
  RoleListQueryDto,
  UpdateRbacRoleDto,
} from "./rbac.schema.js";

const repository = new RbacRepository();
const SYSTEM_ROLES = new Set(["admin", "dosen", "mahasiswa"]);

function normalizeIds(ids: ReadonlyArray<string>): string[] {
  return Array.from(new Set(ids.map((id) => id.trim()).filter((id) => id.length > 0)));
}

export class RbacService {
  async getAllPermissions(query: PermissionListQueryDto): Promise<{
    permissions: RbacPermissionDto[];
    grouped: Record<string, RbacPermissionDto[]>;
    total: number;
  }> {
    const permissions = (await repository.findPermissions(query.module)).map((permission) => toRbacPermission(permission));
    const grouped: Record<string, RbacPermissionDto[]> = {};

    for (const permission of permissions) {
      const moduleName = permission.module ?? "other";
      grouped[moduleName] = [...(grouped[moduleName] ?? []), permission];
    }

    return { permissions, grouped, total: permissions.length };
  }

  async createPermission(
    data: CreateRbacPermissionDto,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<{ permission: RbacPermissionDto }> {
    const existing = await repository.findPermissionByName(data.name);
    if (existing) {
      throw HttpError.badRequest(`Permission '${data.name}' sudah ada`);
    }

    const permission = await sequelize.transaction(async (trx) => {
      const created = await repository.createPermission(data, trx);
      await auditService.persist({
        action: AuditAction.CREATE,
        module: PERMISSION_MODULE,
        entityType: "Permission",
        entityId: created.id,
        userId: user.id,
        userName: user.name,
        description: `${user.name || "Admin"} membuat permission: ${data.name}`,
        after: toRbacPermission(created),
        requestId,
        trx,
      });
      return created;
    });

    await cacheService.invalidatePattern("auth-context:*");
    return { permission: toRbacPermission(permission) };
  }

  async deletePermission(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const permission = await repository.findPermissionById(id);
    if (!permission) {
      throw HttpError.notFound("Permission tidak ditemukan");
    }

    const before = toRbacPermission(permission);
    await sequelize.transaction(async (trx) => {
      await repository.deletePermission(permission, trx);
      await auditService.persist({
        action: AuditAction.DELETE,
        module: PERMISSION_MODULE,
        entityType: "Permission",
        entityId: permission.id,
        userId: user.id,
        userName: user.name,
        description: `${user.name || "Admin"} menghapus permission: ${permission.name}`,
        before,
        requestId,
        trx,
      });
    });

    await cacheService.invalidatePattern("auth-context:*");
  }

  async getAllRoles(query: RoleListQueryDto): Promise<{ roles: RbacRoleDto[]; total: number }> {
    const roles = await repository.findRoles(query.includePermissions === "true");
    return { roles: roles.map((role) => toRbacRole(role)), total: roles.length };
  }

  async getRoleById(id: string): Promise<{ role: RbacRoleDto }> {
    const role = await repository.findRoleById(id);
    if (!role) {
      throw HttpError.notFound("Role tidak ditemukan");
    }

    return { role: toRbacRole(role) };
  }

  async createRole(
    data: CreateRbacRoleDto,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<{ role: RbacRoleDto }> {
    const existing = await repository.findRoleByName(data.name);
    if (existing) {
      throw HttpError.badRequest(`Role '${data.name}' sudah ada`);
    }

    const permissionIds = normalizeIds(data.permissions ?? []);
    if (permissionIds.length > 0) {
      const permissions = await repository.findPermissionsByIds(permissionIds);
      if (permissions.length !== permissionIds.length) {
        throw HttpError.badRequest("Satu atau lebih ID permission tidak valid");
      }
    }

    const role = await sequelize.transaction(async (trx) => {
      const created = await repository.createRole(data, trx);
      await repository.setRolePermissions(created.id, permissionIds, trx);
      const withPermissions = await repository.findRoleById(created.id, trx);
      if (!withPermissions) {
        throw HttpError.internal("Role gagal dimuat setelah dibuat");
      }
      await auditService.persist({
        action: AuditAction.CREATE,
        module: ROLE_MODULE,
        entityType: "Role",
        entityId: created.id,
        userId: user.id,
        userName: user.name,
        description: `${user.name || "Admin"} membuat role: ${data.name}`,
        after: toRbacRole(withPermissions),
        requestId,
        trx,
      });
      return withPermissions;
    });

    await cacheService.invalidatePattern("auth-context:*");
    return { role: toRbacRole(role) };
  }

  async updateRole(
    id: string,
    data: UpdateRbacRoleDto,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<{ role: RbacRoleDto }> {
    const role = await repository.findRoleById(id);
    if (!role) {
      throw HttpError.notFound("Role tidak ditemukan");
    }

    if (role.name === "admin" && data.name && data.name !== "admin") {
      throw HttpError.badRequest("Tidak dapat mengubah nama role admin");
    }

    if (data.name) {
      const existing = await repository.findRoleByName(data.name);
      if (existing && existing.id !== id) {
        throw HttpError.badRequest(`Role '${data.name}' sudah ada`);
      }
    }

    const before = toRbacRole(role);
    const updated = await sequelize.transaction(async (trx) => {
      await repository.updateRole(role, data, trx);
      const reloaded = await repository.findRoleById(id, trx);
      if (!reloaded) {
        throw HttpError.internal("Role gagal dimuat setelah update");
      }
      await auditService.persist({
        action: AuditAction.UPDATE,
        module: ROLE_MODULE,
        entityType: "Role",
        entityId: id,
        userId: user.id,
        userName: user.name,
        description: `${user.name || "Admin"} memperbarui role: ${reloaded.name}`,
        before,
        after: toRbacRole(reloaded),
        requestId,
        trx,
      });
      return reloaded;
    });

    await cacheService.invalidatePattern("auth-context:*");
    return { role: toRbacRole(updated) };
  }

  async deleteRole(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const role = await repository.findRoleById(id);
    if (!role) {
      throw HttpError.notFound("Role tidak ditemukan");
    }

    if (SYSTEM_ROLES.has(role.name)) {
      throw HttpError.badRequest(`Tidak dapat menghapus role sistem '${role.name}'`);
    }

    const before = toRbacRole(role);
    await sequelize.transaction(async (trx) => {
      await repository.deleteRole(role, trx);
      await auditService.persist({
        action: AuditAction.DELETE,
        module: ROLE_MODULE,
        entityType: "Role",
        entityId: id,
        userId: user.id,
        userName: user.name,
        description: `${user.name || "Admin"} menghapus role: ${role.name}`,
        before,
        requestId,
        trx,
      });
    });

    await cacheService.invalidatePattern("auth-context:*");
  }

  async assignPermissions(
    id: string,
    data: AssignRbacPermissionsDto,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<{ role: RbacRoleDto }> {
    const role = await repository.findRoleById(id);
    if (!role) {
      throw HttpError.notFound("Role tidak ditemukan");
    }

    const permissionIds = normalizeIds(data.permissions);
    if (permissionIds.length > 0) {
      const permissions = await repository.findPermissionsByIds(permissionIds);
      if (permissions.length !== permissionIds.length) {
        throw HttpError.badRequest("Satu atau lebih ID permission tidak valid");
      }
    }

    const before = toRbacRole(role);
    const updated = await sequelize.transaction(async (trx) => {
      await repository.setRolePermissions(id, permissionIds, trx);
      const reloaded = await repository.findRoleById(id, trx);
      if (!reloaded) {
        throw HttpError.internal("Role gagal dimuat setelah permission ditetapkan");
      }
      await auditService.persist({
        action: AuditAction.ASSIGN_PERMISSIONS,
        module: ROLE_MODULE,
        entityType: "Role",
        entityId: id,
        userId: user.id,
        userName: user.name,
        description: `${user.name || "Admin"} menetapkan ${permissionIds.length} permission ke role: ${role.name}`,
        before,
        after: toRbacRole(reloaded),
        requestId,
        trx,
      });
      return reloaded;
    });

    await cacheService.invalidatePattern("auth-context:*");
    return { role: toRbacRole(updated) };
  }

  async getRolePermissions(id: string): Promise<{
    role: string;
    permissions: RbacPermissionDto[];
    total: number;
  }> {
    const role = await repository.findRoleById(id);
    if (!role) {
      throw HttpError.notFound("Role tidak ditemukan");
    }

    const permissions = role.permissions?.map((permission) => toRbacPermission(permission)) ?? [];
    return { role: role.name, permissions, total: permissions.length };
  }

  async getUsersWithRoles(query: ListUsersWithRolesQueryDto): Promise<{
    users: RbacUserDto[];
    pagination: RbacPaginationDto;
  }> {
    const { rows, count } = await repository.findUsersWithRoles(query);
    return {
      users: rows.map((user) => toRbacUser(user)),
      pagination: {
        total: count,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(count / query.limit),
      },
    };
  }

  async getUserRoles(userId: string): Promise<{
    user: Pick<RbacUserDto, "id" | "name" | "username" | "email">;
    roles: RbacRoleDto[];
    roleNames: string[];
    permissions: string[];
  }> {
    const user = await repository.findUserWithRoles(userId);
    if (!user) {
      throw HttpError.notFound("User tidak ditemukan");
    }

    const roles = user.roles?.map((role) => toRbacRole(role)) ?? [];
    const permissions = new Set<string>();
    for (const role of user.roles ?? []) {
      for (const permission of role.permissions ?? []) {
        permissions.add(permission.name);
      }
    }

    return {
      user: {
        id: user.id,
        name: user.name ?? null,
        username: user.username ?? null,
        email: user.email ?? null,
      },
      roles,
      roleNames: roles.map((role) => role.name),
      permissions: Array.from(permissions),
    };
  }

  async assignUserRoles(
    userId: string,
    data: AssignUserRolesDto,
    currentUser: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<{ user: RbacUserDto; roleNames: string[] }> {
    const user = await repository.findUserById(userId);
    if (!user) {
      throw HttpError.notFound("User tidak ditemukan");
    }

    const roleIds = normalizeIds(data.role_id);
    if (roleIds.length > 0) {
      const roles = await repository.findRolesByIds(roleIds);
      if (roles.length !== roleIds.length) {
        throw HttpError.badRequest("Satu atau lebih ID role tidak valid");
      }
    }

    await sequelize.transaction(async (trx) => {
      await repository.setUserRoles(user, roleIds, currentUser.id, trx);
      await auditService.persist({
        action: AuditAction.UPDATE,
        module: USER_MODULE,
        entityType: "User",
        entityId: userId,
        userId: currentUser.id,
        userName: currentUser.name,
        description: `${currentUser.name || "Admin"} menetapkan ${roleIds.length} role ke user: ${user.name}`,
        after: { role_id: roleIds },
        requestId,
        trx,
      });
    });

    await cacheService.del(`auth-context:${userId}`);

    const updated = await repository.findUserWithRoles(userId);
    if (!updated) {
      throw HttpError.internal("User gagal dimuat setelah role ditetapkan");
    }
    const response = toRbacUser(updated);
    return { user: response, roleNames: response.roleNames };
  }

  async addUserRole(
    userId: string,
    roleId: string,
    currentUser: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<string> {
    const user = await repository.findUserById(userId);
    if (!user) {
      throw HttpError.notFound("User tidak ditemukan");
    }

    const role = await repository.findRoleById(roleId);
    if (!role) {
      throw HttpError.notFound("Role tidak ditemukan");
    }

    const existing = await repository.findUserRole(userId, roleId);
    if (existing) {
      throw HttpError.badRequest(`User sudah memiliki role '${role.name}'`);
    }

    await sequelize.transaction(async (trx) => {
      await repository.createUserRole(userId, roleId, currentUser.id, trx);
      await auditService.persist({
        action: AuditAction.CREATE,
        module: USER_MODULE,
        entityType: "UserRole",
        entityId: userId,
        userId: currentUser.id,
        userName: currentUser.name,
        description: `${currentUser.name || "Admin"} menambahkan role '${role.name}' ke user: ${user.name}`,
        after: { userId, roleId, roleName: role.name },
        requestId,
        trx,
      });
    });

    await cacheService.del(`auth-context:${userId}`);
    return role.name;
  }

  async removeUserRole(
    userId: string,
    roleId: string,
    currentUser: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<string> {
    const user = await repository.findUserById(userId);
    if (!user) {
      throw HttpError.notFound("User tidak ditemukan");
    }

    const role = await repository.findRoleById(roleId);
    if (!role) {
      throw HttpError.notFound("Role tidak ditemukan");
    }

    await sequelize.transaction(async (trx) => {
      const deleted = await repository.deleteUserRole(userId, roleId, trx);
      if (deleted === 0) {
        throw HttpError.notFound(`User tidak memiliki role '${role.name}'`);
      }
      await auditService.persist({
        action: AuditAction.DELETE,
        module: USER_MODULE,
        entityType: "UserRole",
        entityId: userId,
        userId: currentUser.id,
        userName: currentUser.name,
        description: `${currentUser.name || "Admin"} menghapus role '${role.name}' dari user: ${user.name}`,
        before: { userId, roleId, roleName: role.name },
        requestId,
        trx,
      });
    });

    await cacheService.del(`auth-context:${userId}`);
    return role.name;
  }

  async getRoleUsers(id: string): Promise<{ role: string; users: RbacUserDto[]; total: number }> {
    const role = await repository.findRoleById(id);
    if (!role) {
      throw HttpError.notFound("Role tidak ditemukan");
    }

    const users = (await repository.findRoleUsers(id)).map((user) => toRbacUser(user));
    return { role: role.name, users, total: users.length };
  }
}
