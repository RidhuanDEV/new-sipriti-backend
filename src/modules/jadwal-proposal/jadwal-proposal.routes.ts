import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { JadwalProposalController } from "./jadwal-proposal.controller.js";
import { jadwalBodySchema, proposalSectionIdParamSchema } from "./jadwal-proposal.schema.js";

const controller = new JadwalProposalController();
const router = Router({ mergeParams: true });

router.get("/", authenticate, requireAnyPermission(["view_proposal", "view_penelitian", "view_pengabdian", "manage_proposal", "create_proposal", "edit_proposal", "edit_usulan_by_prodi", "forward_usulan_penelitian", "forward_usulan_pengabdian"]), validate({ params: proposalSectionIdParamSchema }), controller.getJadwal);
router.put("/", authenticate, requireAnyPermission(["manage_proposal", "create_proposal", "edit_proposal", "edit_usulan_by_prodi", "forward_usulan_penelitian", "forward_usulan_pengabdian"]), validate({ params: proposalSectionIdParamSchema, body: jadwalBodySchema }), controller.bulkUpsertJadwal);

export default router;
