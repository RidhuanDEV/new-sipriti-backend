import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { NotificationController } from "../notification/notification.controller.js";
import { inviteActionBodySchema, inviteIdParamSchema } from "../notification/notification.schema.js";
import { ProposalController } from "../proposal/proposal.controller.js";

const proposalController = new ProposalController();
const notificationController = new NotificationController();
const router = Router();

router.get("/getMyInvites", authenticate, requirePermission("view_proposal"), proposalController.getMyInvites);
router.post("/:id/accept", authenticate, validate({ params: inviteIdParamSchema, body: inviteActionBodySchema }), notificationController.acceptInvite);
router.post("/:id/reject", authenticate, validate({ params: inviteIdParamSchema, body: inviteActionBodySchema }), notificationController.rejectInvite);

export const path = "/invites";
export default router;
