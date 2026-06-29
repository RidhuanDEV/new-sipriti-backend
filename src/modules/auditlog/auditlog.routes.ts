import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission } from "../../core/auth/rbac.middleware.js";
import { AuditlogController } from "./auditlog.controller.js";

const router = Router();
const controller = new AuditlogController();

router.use(authenticate, requireAnyPermission(["view_audit_log"]));
router.get("/", controller.getAuditLogs);
router.get("/:id", controller.getAuditLogById);

export const path = "/audit-logs";
export default router;
