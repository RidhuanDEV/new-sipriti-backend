import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission } from "../../core/auth/rbac.middleware.js";
import { createUploadErrorHandler, createFieldsUpload, DOCUMENT_EXTENSIONS, DOCUMENT_MIME_TYPES } from "../../core/storage/upload.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { HkiController } from "./hki.controller.js";
import {
  createHkiSchema,
  hkiDetailQuerySchema,
  hkiIdParamSchema,
  updateHkiSchema,
  approveHkiSchema,
  rejectHkiSchema,
} from "./hki.schema.js";

const router = Router();
const controller = new HkiController();

const hkiUploadPolicy = {
  subdir: "proposals",
  allowedMimes: DOCUMENT_MIME_TYPES,
  allowedExtensions: DOCUMENT_EXTENSIONS,
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxFiles: 4,
};

const hkiUploads = createFieldsUpload(
  [
    { name: "sertifikatFile", maxCount: 1 },
    { name: "dokumenFile", maxCount: 1 },
    { name: "suratPernyataanFile", maxCount: 1 },
    { name: "buktiPengalihanFile", maxCount: 1 },
  ],
  hkiUploadPolicy,
);

router.get("/", authenticate, requireAnyPermission(["view_hki", "manage_hki"]), controller.listUserHKI);
router.get(
  "/detail",
  authenticate,
  requireAnyPermission(["view_hki", "manage_hki"]),
  validate({ query: hkiDetailQuerySchema }),
  controller.getHKIDetail,
);
router.post(
  "/",
  authenticate,
  requireAnyPermission(["create_hki", "submit_hki"]),
  ...hkiUploads,
  validate({ body: createHkiSchema }),
  controller.createHKI,
);
router.put(
  "/:id",
  authenticate,
  requireAnyPermission(["edit_hki", "manage_hki"]),
  ...hkiUploads,
  validate({ params: hkiIdParamSchema, body: updateHkiSchema }),
  controller.updateHKI,
);
router.delete(
  "/:id",
  authenticate,
  requireAnyPermission(["delete_hki", "manage_hki"]),
  validate({ params: hkiIdParamSchema }),
  controller.deleteHKI,
);
router.post(
  "/:id/restore",
  authenticate,
  requireAnyPermission(["delete_hki", "manage_hki"]),
  validate({ params: hkiIdParamSchema }),
  controller.restoreHKI,
);
router.post(
  "/:id/submit",
  authenticate,
  requireAnyPermission(["submit_hki", "create_hki"]),
  validate({ params: hkiIdParamSchema }),
  controller.submitHKI,
);

router.use(createUploadErrorHandler(10));

export const path = "/hki";
export default router;
