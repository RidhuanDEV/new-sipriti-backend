import multer from "multer";
import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { createUploadErrorHandler } from "../../core/storage/upload.middleware.js";
import { OfficialSignaturesController } from "./official-signatures.controller.js";
import {
  createOfficialSignatureSchema,
  listOfficialSignatureQuerySchema,
  signatureIdParamSchema,
  updateOfficialSignatureSchema,
} from "./official-signatures.schema.js";

const router = Router();
const controller = new OfficialSignaturesController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (file.mimetype !== "image/png") {
      callback(new Error("Hanya file PNG (image/png) yang diperbolehkan untuk signature"));
      return;
    }
    callback(null, true);
  },
});

router.get("/", authenticate, requirePermission("view_signature"), validate({ query: listOfficialSignatureQuerySchema }), controller.list);
router.post("/", authenticate, requirePermission("create_signature"), upload.single("file"), validate({ body: createOfficialSignatureSchema }), controller.create);
router.patch("/:id", authenticate, requirePermission("edit_signature"), validate({ params: signatureIdParamSchema }), upload.single("file"), validate({ body: updateOfficialSignatureSchema }), controller.update);
router.patch("/:id/activate", authenticate, requirePermission("edit_signature"), validate({ params: signatureIdParamSchema }), controller.activate);
router.patch("/:id/deactivate", authenticate, requirePermission("edit_signature"), validate({ params: signatureIdParamSchema }), controller.deactivate);
router.delete("/:id", authenticate, requirePermission("delete_signature"), validate({ params: signatureIdParamSchema }), controller.delete);
router.post("/:id/restore", authenticate, requirePermission("delete_signature"), validate({ params: signatureIdParamSchema }), controller.restore);
router.get("/:id/file", authenticate, requirePermission("view_signature"), validate({ params: signatureIdParamSchema }), controller.file);
router.use(createUploadErrorHandler(5));

export const path = "/admin/signatures";
export default router;
