import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission, requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { HkiController } from "../hki/hki.controller.js";
import { approveHkiSchema, hkiIdParamSchema, rejectHkiSchema } from "../hki/hki.schema.js";

const router = Router();
const controller = new HkiController();

router.get("/stats", authenticate, requireAnyPermission(["view_hki", "manage_hki"]), controller.getHKIReviewStats);
router.get("/all", authenticate, requireAnyPermission(["view_hki", "manage_hki"]), controller.getAllHKI);
router.get("/", authenticate, requireAnyPermission(["view_hki", "manage_hki"]), controller.getHKIForReview);
router.get("/:id", authenticate, requireAnyPermission(["view_hki", "manage_hki"]), validate({ params: hkiIdParamSchema }), controller.getHKIDetailForReview);
router.post(
  "/:id/approve",
  authenticate,
  requirePermission("approve_hki"),
  validate({ params: hkiIdParamSchema, body: approveHkiSchema }),
  controller.approveHKI,
);
router.post(
  "/:id/reject",
  authenticate,
  requirePermission("approve_hki"),
  validate({ params: hkiIdParamSchema, body: rejectHkiSchema }),
  controller.rejectHKI,
);

export const path = "/hki-review";
export default router;
