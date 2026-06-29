import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { ResearchController } from "./research.controller.js";
import {
  createResearchSchema,
  idParamSchema,
  proposalByProdiQuerySchema,
  proposalDetailQuerySchema,
  proposalSearchBodySchema,
  publicLandingQuerySchema,
  researchIdParamSchema,
  updateResearchSchema,
} from "./research.schema.js";

const controller = new ResearchController();
const router = Router();

router.get("/landing", validate({ query: publicLandingQuerySchema }), controller.listPublicResearch);
router.get("/", authenticate, requireAnyPermission(["view_penelitian", "manage_penelitian", "edit_usulan_by_prodi"]), controller.listUserResearchProposals);
router.get("/options", authenticate, controller.getDropdownOptions);
router.post("/", authenticate, requireAnyPermission(["submit_proposal", "create_proposal"]), validate({ body: createResearchSchema }), controller.createUsulanPenelitian);
router.put("/:id", authenticate, requireAnyPermission(["edit_proposal", "edit_usulan_by_prodi"]), validate({ params: researchIdParamSchema, body: updateResearchSchema }), controller.updateUsulanPenelitian);
router.get("/detail", authenticate, requireAnyPermission(["view_penelitian", "manage_penelitian", "edit_usulan_by_prodi"]), validate({ query: proposalDetailQuerySchema }), controller.getDetailUsulanPenelitian);
router.post("/:id/submit", authenticate, requireAnyPermission(["submit_proposal", "create_proposal"]), validate({ params: idParamSchema }), controller.submitUsulanPenelitian);
router.delete("/:id", authenticate, requireAnyPermission(["delete_proposal"]), validate({ params: idParamSchema }), controller.deleteUsulanPenelitian);
router.post("/search", authenticate, requireAnyPermission(["view_penelitian", "manage_penelitian"]), validate({ body: proposalSearchBodySchema }), controller.searchUsulanPenelitian);
router.get("/by-prodi", authenticate, requireAnyPermission(["view_penelitian", "edit_usulan_by_prodi"]), validate({ query: proposalByProdiQuerySchema }), controller.listUsulanByProdi);
router.post("/:id/forward", authenticate, requireAnyPermission(["forward_usulan_penelitian", "manage_proposal"]), validate({ params: researchIdParamSchema }), controller.forwardUsulan);

export const path = "/penelitian";
export default router;
