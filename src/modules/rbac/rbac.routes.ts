import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission, requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { RbacController } from "./rbac.controller.js";
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

const router = Router();
const controller = new RbacController();

router.use(authenticate);

router.get("/permissions", requirePermission("view_permissions"), validate({ query: permissionListQuerySchema }), controller.getAllPermissions);
router.post("/permissions", requirePermission("assign_permissions"), validate({ body: createPermissionSchema }), controller.createPermission);
router.delete(
  "/permissions/:id",
  requirePermission("assign_permissions"),
  validate({ params: permissionIdParamSchema }),
  controller.deletePermission,
);

router.get("/roles", requirePermission("view_roles"), validate({ query: roleListQuerySchema }), controller.getAllRoles);
router.get("/roles/:id", requirePermission("view_roles"), validate({ params: roleIdParamSchema }), controller.getRoleById);
router.post("/roles", requirePermission("create_role"), validate({ body: createRoleSchema }), controller.createRole);
router.put(
  "/roles/:id",
  requirePermission("edit_role"),
  validate({ params: roleIdParamSchema, body: updateRoleSchema }),
  controller.updateRole,
);
router.delete("/roles/:id", requirePermission("delete_role"), validate({ params: roleIdParamSchema }), controller.deleteRole);
router.put(
  "/roles/:id/permissions",
  requirePermission("assign_permissions"),
  validate({ params: roleIdParamSchema, body: assignPermissionsSchema }),
  controller.assignPermissions,
);
router.get(
  "/roles/:id/permissions",
  requirePermission("view_permissions"),
  validate({ params: roleIdParamSchema }),
  controller.getRolePermissions,
);
router.get(
  "/roles/:id/users",
  requirePermission("view_roles"),
  validate({ params: roleIdParamSchema }),
  controller.getRoleUsers,
);

router.get(
  "/users",
  requireAnyPermission(["view_roles", "view_users"]),
  validate({ query: listUsersWithRolesQuerySchema }),
  controller.getUsersWithRoles,
);
router.get(
  "/users/:userId/roles",
  requireAnyPermission(["view_roles", "view_users"]),
  validate({ params: userRoleParamSchema }),
  controller.getUserRoles,
);
router.put(
  "/users/:userId/roles",
  requirePermission("assign_roles"),
  validate({ params: userRoleParamSchema, body: assignUserRolesSchema }),
  controller.assignUserRoles,
);
router.post(
  "/users/:userId/roles/:roleId",
  requirePermission("assign_roles"),
  validate({ params: userRoleDetailParamSchema }),
  controller.addUserRole,
);
router.delete(
  "/users/:userId/roles/:roleId",
  requirePermission("assign_roles"),
  validate({ params: userRoleDetailParamSchema }),
  controller.removeUserRole,
);

export const path = "/rbac";
export default router;
