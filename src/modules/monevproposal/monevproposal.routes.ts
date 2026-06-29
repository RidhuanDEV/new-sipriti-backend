import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { MonevProposalController } from "./monevproposal.controller.js";
import { addMemberSchema, addRABSchema, proposalIdParamSchema } from "./monevproposal.schema.js";

const router = Router();
const controller = new MonevProposalController();

router.get("/:proposalId", authenticate, requirePermission("view_monev"), controller.getMonevProposal);
router.get("/", authenticate, requirePermission("view_monev"), controller.listMonevProposals);
router.post(
  "/:proposalId/anggota",
  authenticate,
  requirePermission("edit_monev"),
  validate({ params: proposalIdParamSchema, body: addMemberSchema }),
  controller.addMember,
);
router.post(
  "/:proposalId/substansi-luaran",
  authenticate,
  controller.decommissioned("Endpoint ini telah didekomisioning. Gunakan endpoint substansi proposal yang baru (/proposals/:id/penelitian atau /pengabdian)."),
);
router.post(
  "/:proposalId/rab",
  authenticate,
  requirePermission("edit_monev"),
  validate({ params: proposalIdParamSchema, body: addRABSchema }),
  controller.addRAB,
);
router.post(
  "/:proposalId/dokumen",
  authenticate,
  controller.decommissioned("Endpoint ini telah didekomisioning. Gunakan endpoint substansi proposal yang baru."),
);
router.post(
  "/:proposalId/mitra",
  authenticate,
  controller.decommissioned("Endpoint ini telah didekomisioning. Gunakan endpoint mitra proposal yang baru."),
);

export const path = "/monev";
export default router;
