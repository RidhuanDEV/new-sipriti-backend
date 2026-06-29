import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission, requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { HibahInternalController } from "./hibahinternal.controller.js";
import { hibahInternalPolicy } from "./policies/hibahinternal.policy.js";
import { createHibahInternalSchema, hibahInternalIdParamSchema, listHibahInternalQuerySchema, updateHibahInternalSchema } from "./hibahinternal.schema.js";

const controller = new HibahInternalController();
const router = Router();

router.get("/", validate({ query: listHibahInternalQuerySchema }), controller.listHibahInternal);
router.get("/:id", validate({ params: hibahInternalIdParamSchema }), controller.getHibahInternalById);
router.post("/", authenticate, requireAnyPermission([hibahInternalPolicy.createPermission, hibahInternalPolicy.managePermission]), validate({ body: createHibahInternalSchema }), controller.createHibahInternal);
router.put("/:id", authenticate, requireAnyPermission([hibahInternalPolicy.editPermission, hibahInternalPolicy.managePermission]), validate({ params: hibahInternalIdParamSchema, body: updateHibahInternalSchema }), controller.updateHibahInternal);
router.delete("/:id", authenticate, requireAnyPermission([hibahInternalPolicy.deletePermission, hibahInternalPolicy.managePermission]), validate({ params: hibahInternalIdParamSchema }), controller.deleteHibahInternal);
router.post("/:id/restore", authenticate, requirePermission(hibahInternalPolicy.deletePermission), validate({ params: hibahInternalIdParamSchema }), controller.restoreHibahInternal);

export const path = "/hibah-internal";
export default router;
