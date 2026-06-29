import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission, requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import {
  createFieldsUpload,
  createUploadErrorHandler,
  DOCUMENT_EXTENSIONS,
  DOCUMENT_MIME_TYPES,
  type UploadPolicy,
} from "../../core/storage/upload.middleware.js";
import { ProposalController } from "./proposal.controller.js";
import {
  adminReviewSchema,
  inviteMemberSchema,
  proposalCreateMultipartSchema,
  proposalIdParamSchema,
  respondInviteSchema,
} from "./proposal.schema.js";

const controller = new ProposalController();
const router = Router();

const proposalDocumentPolicy: UploadPolicy = {
  subdir: "proposals",
  allowedMimes: DOCUMENT_MIME_TYPES,
  allowedExtensions: DOCUMENT_EXTENSIONS,
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxFiles: 10,
};

router.post(
  "/",
  authenticate,
  requirePermission("create_proposal"),
  ...createFieldsUpload(
    [
      { name: "file", maxCount: 1 },
      { name: "proposal", maxCount: 1 },
      { name: "dokumenPendukung", maxCount: 1 },
      { name: "artikelJurnal", maxCount: 1 },
    ],
    proposalDocumentPolicy,
  ),
  createUploadErrorHandler(10),
  validate({ body: proposalCreateMultipartSchema }),
  controller.createProposal,
);

router.post(
  "/:proposalId/invite",
  authenticate,
  requirePermission("create_proposal"),
  validate({ params: proposalIdParamSchema, body: inviteMemberSchema }),
  controller.inviteMember,
);

router.post(
  "/:proposalId/respond",
  authenticate,
  requirePermission("view_proposal"),
  validate({ params: proposalIdParamSchema, body: respondInviteSchema }),
  controller.respondInvite,
);

router.post(
  "/:proposalId/review",
  authenticate,
  requireAnyPermission(["review_proposal"]),
  validate({ params: proposalIdParamSchema, body: adminReviewSchema }),
  controller.adminReviewProposal,
);

export const path = "/proposal";
export default router;
