import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { LuaranProposalController } from "./luaran-proposal.controller.js";
import { luaranBodySchema, proposalSectionIdParamSchema } from "./luaran-proposal.schema.js";

const controller = new LuaranProposalController();
const router = Router({ mergeParams: true });

router.get("/", authenticate, requireAnyPermission(["view_proposal", "view_penelitian", "view_pengabdian", "manage_proposal", "create_proposal", "edit_proposal", "edit_usulan_by_prodi", "forward_usulan_penelitian", "forward_usulan_pengabdian"]), validate({ params: proposalSectionIdParamSchema }), controller.getLuaran);
router.put("/", authenticate, requireAnyPermission(["manage_proposal", "create_proposal", "edit_proposal", "edit_usulan_by_prodi", "forward_usulan_penelitian", "forward_usulan_pengabdian"]), validate({ params: proposalSectionIdParamSchema, body: luaranBodySchema }), controller.bulkUpsertLuaran);

export default router;
