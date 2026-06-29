import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission, requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { ProposalReviewController } from "./proposal-review.controller.js";
import {
  approveProposalSchema,
  rejectProposalSchema,
  reviewIdParamSchema,
  reviewTypeOnlyParamSchema,
  reviewTypeParamSchema,
} from "./proposal-review.schema.js";

const router = Router();
const controller = new ProposalReviewController();

router.get("/stats/:type", authenticate, requireAnyPermission(["review_proposal", "manage_penelitian", "manage_pengabdian"]), validate({ params: reviewTypeOnlyParamSchema }), controller.getReviewStats);
router.get("/:type", authenticate, requireAnyPermission(["review_proposal", "manage_penelitian", "manage_pengabdian"]), validate({ params: reviewTypeOnlyParamSchema }), controller.getProposalsForReview);

router.get("/user/revisi", authenticate, controller.getUserRevisionProposals);
router.get("/user/approved", authenticate, controller.getUserApprovedProposals);
router.post("/user/:id/resubmit", authenticate, validate({ params: reviewIdParamSchema }), controller.resubmitProposal);

router.get("/:type/:id", authenticate, requireAnyPermission(["review_proposal", "manage_penelitian", "manage_pengabdian"]), validate({ params: reviewTypeParamSchema }), controller.getProposalDetailForReview);
router.post("/:type/:id/approve", authenticate, requirePermission("approve_proposal"), validate({ params: reviewTypeParamSchema, body: approveProposalSchema }), controller.approveProposal);
router.post("/:type/:id/decline", authenticate, requirePermission("approve_proposal"), validate({ params: reviewTypeParamSchema, body: rejectProposalSchema }), controller.declineProposal);

export const path = "/proposal-review";
export default router;
