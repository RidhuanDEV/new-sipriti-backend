import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission } from "../../core/auth/rbac.middleware.js";
import { DashboardController } from "./dashboard.controller.js";

const router = Router();
const controller = new DashboardController();

router.get("/latest-statuses", authenticate, requireAnyPermission(["view_dashboard"]), controller.getUserLatestStatuses);
router.get("/counts", authenticate, requireAnyPermission(["view_dashboard"]), controller.getUserProposalCounts);

export const path = "/dashboard";
export default router;
