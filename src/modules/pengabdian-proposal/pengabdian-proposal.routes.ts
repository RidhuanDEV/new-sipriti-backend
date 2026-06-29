import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { PengabdianProposalController } from "./pengabdian-proposal.controller.js";
import { pengabdianProposalBodySchema, proposalSectionIdParamSchema } from "./pengabdian-proposal.schema.js";

const controller = new PengabdianProposalController();
const router = Router({ mergeParams: true });

router.get("/", authenticate, requireAnyPermission(["view_proposal", "view_pengabdian", "manage_proposal", "create_proposal", "edit_proposal", "edit_usulan_by_prodi", "forward_usulan_pengabdian"]), validate({ params: proposalSectionIdParamSchema }), controller.getPengabdian);
router.put("/", authenticate, requireAnyPermission(["manage_proposal", "create_proposal", "edit_proposal", "edit_usulan_by_prodi", "forward_usulan_pengabdian"]), validate({ params: proposalSectionIdParamSchema, body: pengabdianProposalBodySchema }), controller.upsertPengabdian);

export default router;
