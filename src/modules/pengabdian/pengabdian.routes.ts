import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { PengabdianController } from "./pengabdian.controller.js";
import {
  createPengabdianSchema,
  idParamSchema,
  pengabdianIdParamSchema,
  proposalByProdiQuerySchema,
  proposalSearchBodySchema,
  publicLandingQuerySchema,
  updatePengabdianSchema,
} from "./pengabdian.schema.js";

const controller = new PengabdianController();
const router = Router();

router.get("/landing", validate({ query: publicLandingQuerySchema }), controller.listPublicPengabdian);
router.get("/", authenticate, requireAnyPermission(["view_pengabdian", "manage_pengabdian", "edit_usulan_by_prodi"]), controller.listUserPengabdianProposals);
router.get("/options", authenticate, controller.getDropdownOptions);
router.get("/by-prodi", authenticate, requireAnyPermission(["view_pengabdian", "edit_usulan_by_prodi"]), validate({ query: proposalByProdiQuerySchema }), controller.listUsulanByProdi);
router.post("/", authenticate, requireAnyPermission(["submit_proposal", "create_proposal"]), validate({ body: createPengabdianSchema }), controller.createUsulanPengabdian);
router.put("/:id", authenticate, requireAnyPermission(["edit_proposal", "edit_usulan_by_prodi"]), validate({ params: pengabdianIdParamSchema, body: updatePengabdianSchema }), controller.updateUsulanPengabdian);
router.get("/:id", authenticate, requireAnyPermission(["view_pengabdian", "manage_pengabdian", "edit_usulan_by_prodi"]), validate({ params: idParamSchema }), controller.getDetailUsulanPengabdian);
router.post("/:id/submit", authenticate, requireAnyPermission(["submit_proposal", "create_proposal"]), validate({ params: idParamSchema }), controller.submitUsulanPengabdian);
router.post("/:id/forward", authenticate, requireAnyPermission(["forward_usulan_pengabdian", "manage_proposal"]), validate({ params: pengabdianIdParamSchema }), controller.forwardUsulanPengabdian);
router.delete("/:id", authenticate, requireAnyPermission(["delete_proposal"]), validate({ params: idParamSchema }), controller.deleteUsulanPengabdian);
router.post("/search", authenticate, requireAnyPermission(["view_pengabdian", "manage_pengabdian"]), validate({ body: proposalSearchBodySchema }), controller.searchUsulanPengabdian);

export const path = "/pengabdian";
export default router;
