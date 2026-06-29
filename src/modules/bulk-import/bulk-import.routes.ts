import nodePath from "node:path";
import multer from "multer";
import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { HttpError } from "../../core/errors/http-error.js";
import { downloadTemplateBodySchema } from "./bulk-import.schema.js";
import { BulkImportController } from "./bulk-import.controller.js";

const router = Router();
const controller = new BulkImportController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    const extension = nodePath.extname(file.originalname || "").toLowerCase();
    if (file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" && extension === ".xlsx") {
      cb(null, true);
      return;
    }
    cb(HttpError.badRequest("Format file tidak didukung. Gunakan file .xlsx"));
  },
});

const permissions = ["manage_penelitian", "manage_pengabdian"] as const;

router.post(
  "/template",
  authenticate,
  requireAnyPermission(permissions),
  validate({ body: downloadTemplateBodySchema }),
  controller.downloadTemplate,
);
router.post(
  "/",
  authenticate,
  requireAnyPermission(permissions),
  upload.single("file"),
  controller.importUsulan,
);

export const path = "/admin/usulan/import";
export default router;
