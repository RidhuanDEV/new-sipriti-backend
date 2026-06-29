import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission, requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { createFieldsUpload, createUploadErrorHandler } from "../../core/storage/upload.middleware.js";
import { MonevInternalController } from "./monev-internal.controller.js";
import {
  createMonevInternalSchema,
  monevInternalIdParamSchema,
  updateMonevInternalSchema,
} from "./monev-internal.schema.js";

const router = Router();
const controller = new MonevInternalController();

const pdfOnlyPolicy = {
  subdir: "monev",
  allowedMimes: new Set(["application/pdf"]),
  allowedExtensions: new Set([".pdf"]),
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxFiles: 3,
};

const monevUpload = createFieldsUpload(
  [
    { name: "beritaAcara", maxCount: 1 },
    { name: "formPenilaian", maxCount: 1 },
    { name: "ringkasanMonev", maxCount: 1 },
  ],
  pdfOnlyPolicy,
);

router.get("/", authenticate, requireAnyPermission(["view_monev", "create_monev", "edit_monev", "delete_monev"]), controller.getAllMonev);
router.get("/options/usulan", authenticate, requireAnyPermission(["view_monev", "create_monev", "edit_monev", "delete_monev"]), controller.getUsulanOptionsForMonev);
router.get("/:id", authenticate, requireAnyPermission(["view_monev", "create_monev", "edit_monev", "delete_monev"]), controller.getMonevById);
router.post(
  "/",
  authenticate,
  requirePermission("create_monev"),
  validate({ body: createMonevInternalSchema }),
  controller.createMonev,
);
router.put(
  "/:id",
  authenticate,
  requirePermission("edit_monev"),
  validate({ params: monevInternalIdParamSchema, body: updateMonevInternalSchema }),
  controller.updateMonev,
);
router.delete(
  "/:id",
  authenticate,
  requirePermission("delete_monev"),
  validate({ params: monevInternalIdParamSchema }),
  controller.deleteMonev,
);
router.post(
  "/:id/restore",
  authenticate,
  requirePermission("delete_monev"),
  validate({ params: monevInternalIdParamSchema }),
  controller.restoreMonev,
);
router.post(
  "/:id/upload",
  authenticate,
  requirePermission("edit_monev"),
  validate({ params: monevInternalIdParamSchema }),
  ...monevUpload,
  controller.uploadMonevDocuments,
);

router.use(createUploadErrorHandler(10));

export const path = "/admin/monev";
export default router;
