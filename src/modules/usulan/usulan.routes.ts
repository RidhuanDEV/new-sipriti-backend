import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { UsulanController } from "./usulan.controller.js";
import type { PermissionName } from "../../constants/permissions.constants.js";
import {
  listUsulanQuerySchema,
  usulanIdParamSchema,
  usulanStatisticsQuerySchema,
} from "./usulan.schema.js";

const router = Router();
const controller = new UsulanController();
const adminUsulanPermissions: ReadonlyArray<PermissionName> = [
  "view_proposal",
  "manage_penelitian",
  "manage_pengabdian",
];

router.get(
  "/",
  authenticate,
  requireAnyPermission(adminUsulanPermissions),
  validate({ query: listUsulanQuerySchema }),
  controller.getAllUsulan,
);
router.get(
  "/statistics",
  authenticate,
  requireAnyPermission(adminUsulanPermissions),
  validate({ query: usulanStatisticsQuerySchema }),
  controller.getUsulanStatistics,
);
router.get(
  "/:id",
  authenticate,
  requireAnyPermission(adminUsulanPermissions),
  validate({ params: usulanIdParamSchema }),
  controller.getUsulanById,
);

export const path = "/admin/usulan";
export default router;
