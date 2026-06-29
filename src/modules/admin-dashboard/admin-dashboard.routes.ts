import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { AdminDashboardController } from "./admin-dashboard.controller.js";

const router = Router();
const controller = new AdminDashboardController();

router.get("/stats", authenticate, requirePermission("view_admin_dashboard"), controller.getDashboardStats);
router.get("/skema-stats", authenticate, requirePermission("view_admin_dashboard"), controller.getSkemaStats);
router.get("/prodi-stats", authenticate, requirePermission("view_admin_dashboard"), controller.getProdiStats);
router.get("/recent-activity", authenticate, requirePermission("view_admin_dashboard"), controller.getRecentActivity);
router.get("/tahun-options", authenticate, requirePermission("view_admin_dashboard"), controller.getTahunOptions);

export const path = "/admin/dashboard";
export default router;
