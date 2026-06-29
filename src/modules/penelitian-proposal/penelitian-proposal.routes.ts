import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { PenelitianProposalController } from "./penelitian-proposal.controller.js";
import { penelitianProposalBodySchema, proposalSectionIdParamSchema } from "./penelitian-proposal.schema.js";

const controller = new PenelitianProposalController();
const router = Router({ mergeParams: true });

router.get("/", authenticate, requireAnyPermission(["view_proposal", "view_penelitian", "manage_proposal", "create_proposal", "edit_proposal", "edit_usulan_by_prodi", "forward_usulan_penelitian"]), validate({ params: proposalSectionIdParamSchema }), controller.getPenelitian);
router.put("/", authenticate, requireAnyPermission(["manage_proposal", "create_proposal", "edit_proposal", "edit_usulan_by_prodi", "forward_usulan_penelitian"]), validate({ params: proposalSectionIdParamSchema, body: penelitianProposalBodySchema }), controller.upsertPenelitian);

export default router;
