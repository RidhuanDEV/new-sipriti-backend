import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { RbacService } from "./rbac.service.js";
import {
  assignPermissionsSchema,
  assignUserRolesSchema,
  createPermissionSchema,
  createRoleSchema,
  listUsersWithRolesQuerySchema,
  permissionIdParamSchema,
  permissionListQuerySchema,
  roleIdParamSchema,
  roleListQuerySchema,
  updateRoleSchema,
  userRoleDetailParamSchema,
  userRoleParamSchema,
} from "./rbac.schema.js";

const service = new RbacService();

export class RbacController {
  getAllPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.getAllPermissions(permissionListQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil data permission", data: result });
    } catch (err) {
      next(err);
    }
  };

  createPermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = createPermissionSchema.parse(req.body);
      const result = await service.createPermission(body, requireAuthenticatedUser(req), req.requestId);
      sendSuccess(res, { statusCode: 201, message: "Permission berhasil dibuat", data: result });
    } catch (err) {
      next(err);
    }
  };

  deletePermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = permissionIdParamSchema.parse(req.params);
      await service.deletePermission(params.id, requireAuthenticatedUser(req), req.requestId);
      sendSuccess(res, { message: "Permission berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };

  getAllRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.getAllRoles(roleListQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil data role", data: result });
    } catch (err) {
      next(err);
    }
  };

  getRoleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = roleIdParamSchema.parse(req.params);
      const result = await service.getRoleById(params.id);
      sendSuccess(res, { message: "Berhasil mengambil detail role", data: result });
    } catch (err) {
      next(err);
    }
  };

  createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = createRoleSchema.parse(req.body);
      const result = await service.createRole(body, requireAuthenticatedUser(req), req.requestId);
      sendSuccess(res, { statusCode: 201, message: "Role berhasil dibuat", data: result });
    } catch (err) {
      next(err);
    }
  };

  updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = roleIdParamSchema.parse(req.params);
      const body = updateRoleSchema.parse(req.body);
      const result = await service.updateRole(params.id, body, requireAuthenticatedUser(req), req.requestId);
      sendSuccess(res, { message: "Role berhasil diperbarui", data: result });
    } catch (err) {
      next(err);
    }
  };

  deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = roleIdParamSchema.parse(req.params);
      await service.deleteRole(params.id, requireAuthenticatedUser(req), req.requestId);
      sendSuccess(res, { message: "Role berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };

  assignPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = roleIdParamSchema.parse(req.params);
      const body = assignPermissionsSchema.parse(req.body);
      const result = await service.assignPermissions(params.id, body, requireAuthenticatedUser(req), req.requestId);
      sendSuccess(res, { message: "Permission berhasil ditetapkan", data: result });
    } catch (err) {
      next(err);
    }
  };

  getRolePermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = roleIdParamSchema.parse(req.params);
      const result = await service.getRolePermissions(params.id);
      sendSuccess(res, { message: "Berhasil mengambil permission role", data: result });
    } catch (err) {
      next(err);
    }
  };

  getUsersWithRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.getUsersWithRoles(listUsersWithRolesQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil data user beserta role", data: result });
    } catch (err) {
      next(err);
    }
  };

  getUserRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = userRoleParamSchema.parse(req.params);
      const result = await service.getUserRoles(params.userId);
      sendSuccess(res, { message: "Berhasil mengambil role user", data: result });
    } catch (err) {
      next(err);
    }
  };

  assignUserRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = userRoleParamSchema.parse(req.params);
      const body = assignUserRolesSchema.parse(req.body);
      const result = await service.assignUserRoles(params.userId, body, requireAuthenticatedUser(req), req.requestId);
      sendSuccess(res, { message: "Role user berhasil ditetapkan", data: result });
    } catch (err) {
      next(err);
    }
  };

  addUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = userRoleDetailParamSchema.parse(req.params);
      const roleName = await service.addUserRole(params.userId, params.roleId, requireAuthenticatedUser(req), req.requestId);
      sendSuccess(res, { statusCode: 201, message: `Role '${roleName}' berhasil ditambahkan ke user` });
    } catch (err) {
      next(err);
    }
  };

  removeUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = userRoleDetailParamSchema.parse(req.params);
      const roleName = await service.removeUserRole(params.userId, params.roleId, requireAuthenticatedUser(req), req.requestId);
      sendSuccess(res, { message: `Role '${roleName}' berhasil dihapus dari user` });
    } catch (err) {
      next(err);
    }
  };

  getRoleUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = roleIdParamSchema.parse(req.params);
      const result = await service.getRoleUsers(params.id);
      sendSuccess(res, { message: "Berhasil mengambil user dengan role ini", data: result });
    } catch (err) {
      next(err);
    }
  };
}
