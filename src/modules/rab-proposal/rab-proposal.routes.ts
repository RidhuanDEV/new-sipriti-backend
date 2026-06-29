import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { RabProposalController } from "./rab-proposal.controller.js";
import { proposalSectionIdParamSchema, rabBodySchema } from "./rab-proposal.schema.js";

const controller = new RabProposalController();
const router = Router({ mergeParams: true });

router.use(authenticate);
router.get("/", requireAnyPermission(["view_proposal", "view_penelitian", "view_pengabdian", "manage_proposal", "create_proposal", "edit_proposal", "edit_usulan_by_prodi", "forward_usulan_penelitian", "forward_usulan_pengabdian"]), validate({ params: proposalSectionIdParamSchema }), controller.getRab);
router.post("/", requireAnyPermission(["manage_proposal", "create_proposal", "edit_proposal", "edit_usulan_by_prodi", "forward_usulan_penelitian", "forward_usulan_pengabdian"]), validate({ params: proposalSectionIdParamSchema, body: rabBodySchema }), controller.upsertRab);

export default router;
