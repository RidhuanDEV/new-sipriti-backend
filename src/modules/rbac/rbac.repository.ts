import { Op } from "sequelize";
import { Permission } from "../permissions/permission.model.js";
import { RolePermission } from "../roles/role-permission.model.js";
import { Role } from "../roles/role.model.js";
import { UserRole } from "../roles/user-role.model.js";
import { User } from "../user/user.model.js";
import type { Transaction, WhereOptions } from "sequelize";
import type {
  CreateRbacPermissionDto,
  CreateRbacRoleDto,
  ListUsersWithRolesQueryDto,
  UpdateRbacRoleDto,
} from "./rbac.schema.js";

export class RbacRepository {
  findPermissions(moduleName?: string): Promise<Permission[]> {
    const where: WhereOptions<Permission> = moduleName ? { module: moduleName } : {};
    return Permission.findAll({
      where,
      order: [["module", "ASC"], ["name", "ASC"]],
    });
  }

  findPermissionById(id: string, trx?: Transaction): Promise<Permission | null> {
    return Permission.findByPk(id, trx ? { transaction: trx } : undefined);
  }

  findPermissionByName(name: string): Promise<Permission | null> {
    return Permission.findOne({ where: { name } });
  }

  createPermission(data: CreateRbacPermissionDto, trx?: Transaction): Promise<Permission> {
    return Permission.create(
      {
        name: data.name,
        description: data.description ?? null,
        module: data.module ?? null,
      },
      trx ? { transaction: trx } : undefined,
    );
  }

  deletePermission(permission: Permission, trx?: Transaction): Promise<void> {
    return permission.destroy(trx ? { transaction: trx } : undefined);
  }

  findRoles(includePermissions: boolean): Promise<Role[]> {
    return Role.findAll({
      where: { isActive: true },
      order: [["name", "ASC"]],
      ...(includePermissions
        ? {
            include: [
              {
                model: Permission,
                as: "permissions",
                through: { attributes: [] },
              },
            ],
          }
        : {}),
    });
  }

  findRoleById(id: string, trx?: Transaction): Promise<Role | null> {
    return Role.findByPk(id, {
      ...(trx ? { transaction: trx } : {}),
      include: [
        {
          model: Permission,
          as: "permissions",
          through: { attributes: [] },
        },
      ],
    });
  }

  findRoleByName(name: string): Promise<Role | null> {
    return Role.findOne({ where: { name } });
  }

  createRole(data: CreateRbacRoleDto, trx?: Transaction): Promise<Role> {
    return Role.create(
      {
        name: data.name,
        description: data.description ?? null,
        isActive: true,
      },
      trx ? { transaction: trx } : undefined,
    );
  }

  async updateRole(role: Role, data: UpdateRbacRoleDto, trx?: Transaction): Promise<Role> {
    const fields: Partial<Pick<Role, "name" | "description" | "isActive">> = {};
    if (data.name !== undefined) fields.name = data.name;
    if (data.description !== undefined) fields.description = data.description;
    if (data.is_active !== undefined) fields.isActive = data.is_active;
    await role.update(fields, trx ? { transaction: trx } : undefined);
    return role;
  }

  deleteRole(role: Role, trx?: Transaction): Promise<void> {
    return role.destroy(trx ? { transaction: trx } : undefined);
  }

  async setRolePermissions(
    roleId: string,
    permissionIds: string[],
    trx?: Transaction,
  ): Promise<void> {
    await RolePermission.destroy({
      where: { roleId },
      ...(trx ? { transaction: trx } : {}),
    });

    if (permissionIds.length === 0) {
      return;
    }

    await RolePermission.bulkCreate(
      permissionIds.map((permissionId) => ({ roleId, permissionId })),
      {
        ignoreDuplicates: true,
        ...(trx ? { transaction: trx } : {}),
      },
    );
  }

  findPermissionsByIds(permissionIds: string[]): Promise<Permission[]> {
    return Permission.findAll({ where: { id: { [Op.in]: permissionIds } } });
  }

  findRolesByIds(roleIds: string[]): Promise<Role[]> {
    return Role.findAll({ where: { id: { [Op.in]: roleIds } } });
  }

  findUsersWithRoles(
    query: ListUsersWithRolesQueryDto,
  ): Promise<{ rows: User[]; count: number }> {
    const search = query.search?.trim();
    const where: WhereOptions<User> =
      search && search.length > 0
        ? {
            [Op.or]: [
              { name: { [Op.like]: `%${search}%` } },
              { username: { [Op.like]: `%${search}%` } },
              { email: { [Op.like]: `%${search}%` } },
            ],
          }
        : {};

    return User.findAndCountAll({
      where,
      include: [
        {
          model: Role,
          as: "roles",
          through: { attributes: ["assignedAt"] },
          attributes: ["id", "name", "description", "isActive", "createdAt", "updatedAt"],
        },
        {
          model: Role,
          as: "role",
          attributes: ["id", "name", "description", "isActive", "createdAt", "updatedAt"],
        },
      ],
      attributes: { exclude: ["password"] },
      order: [["name", "ASC"]],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
      distinct: true,
    });
  }

  findUserWithRoles(userId: string): Promise<User | null> {
    return User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: "roles",
          through: { attributes: ["assignedAt", "assignedBy"] },
          include: [
            {
              model: Permission,
              as: "permissions",
              through: { attributes: [] },
            },
          ],
        },
      ],
      attributes: ["id", "name", "username", "email", "roleId"],
    });
  }

  findUserById(userId: string, trx?: Transaction): Promise<User | null> {
    return User.findByPk(userId, trx ? { transaction: trx } : undefined);
  }

  async setUserRoles(
    user: User,
    roleIds: string[],
    assignedBy: string | null,
    trx?: Transaction,
  ): Promise<void> {
    await UserRole.destroy({
      where: { userId: user.id },
      ...(trx ? { transaction: trx } : {}),
    });

    if (roleIds.length > 0) {
      await UserRole.bulkCreate(
        roleIds.map((roleId) => ({
          userId: user.id,
          roleId,
          assignedBy,
          assignedAt: new Date(),
        })),
        {
          ignoreDuplicates: true,
          ...(trx ? { transaction: trx } : {}),
        },
      );

      const primaryRoleId = roleIds[0];
      if (primaryRoleId) {
        await user.update({ roleId: primaryRoleId }, trx ? { transaction: trx } : undefined);
      }
    }
  }

  findUserRole(userId: string, roleId: string): Promise<UserRole | null> {
    return UserRole.findOne({ where: { userId, roleId } });
  }

  createUserRole(
    userId: string,
    roleId: string,
    assignedBy: string | null,
    trx?: Transaction,
  ): Promise<UserRole> {
    return UserRole.create(
      { userId, roleId, assignedBy, assignedAt: new Date() },
      trx ? { transaction: trx } : undefined,
    );
  }

  async deleteUserRole(userId: string, roleId: string, trx?: Transaction): Promise<number> {
    return UserRole.destroy({
      where: { userId, roleId },
      ...(trx ? { transaction: trx } : {}),
    });
  }

  findRoleUsers(roleId: string): Promise<User[]> {
    return User.findAll({
      include: [
        {
          model: Role,
          as: "roles",
          where: { id: roleId },
          through: { attributes: ["assignedAt"] },
        },
      ],
      attributes: { exclude: ["password"] },
      order: [["name", "ASC"]],
    });
  }
}
