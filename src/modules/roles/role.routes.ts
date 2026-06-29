import { Router } from "express";
import { RoleController } from "./role.controller.js";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import {
  createRoleSchema,
  updateRoleSchema,
  roleIdSchema,
  assignPermissionsSchema,
} from "./role.schema.js";

const router = Router();
const controller = new RoleController();

router.get(
  "/",
  authenticate,
  requirePermission("view_roles"),
  controller.getAll,
);

router.get(
  "/:id",
  authenticate,
  requirePermission("view_roles"),
  validate({ params: roleIdSchema }),
  controller.getById,
);

router.post(
  "/",
  authenticate,
  requirePermission("create_role"),
  validate({ body: createRoleSchema }),
  controller.create,
);

router.patch(
  "/:id",
  authenticate,
  requirePermission("edit_role"),
  validate({ params: roleIdSchema, body: updateRoleSchema }),
  controller.update,
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("delete_role"),
  validate({ params: roleIdSchema }),
  controller.delete,
);

router.post(
  "/:id/permissions",
  authenticate,
  requirePermission("assign_permissions"),
  validate({ params: roleIdSchema, body: assignPermissionsSchema }),
  controller.assignPermissions,
);

export const path = "/roles";
export default router;
