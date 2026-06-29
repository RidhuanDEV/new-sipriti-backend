import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import {
  createContentUploadPolicy,
  createFieldsUpload,
  createUploadErrorHandler,
} from "../../core/storage/upload.middleware.js";
import { BeritaController } from "./berita.controller.js";
import { beritaPolicy } from "./policies/berita.policy.js";
import {
  beritaIdParamSchema,
  createBeritaSchema,
  listBeritaQuerySchema,
  updateBeritaSchema,
} from "./berita.schema.js";

const controller = new BeritaController();
const router = Router();
const beritaUploadPolicy = createContentUploadPolicy("berita");

router.get("/", validate({ query: listBeritaQuerySchema }), controller.listBerita);
router.get("/:id", validate({ params: beritaIdParamSchema }), controller.getBeritaById);

router.post(
  "/",
  authenticate,
  requireAnyPermission(beritaPolicy.createPermissions),
  ...createFieldsUpload(
    [
      { name: "photo", maxCount: 1 },
      { name: "file", maxCount: 1 },
    ],
    beritaUploadPolicy,
  ),
  createUploadErrorHandler(5),
  validate({ body: createBeritaSchema }),
  controller.createBerita,
);

router.put(
  "/:id",
  authenticate,
  requireAnyPermission(beritaPolicy.editPermissions),
  validate({ params: beritaIdParamSchema }),
  ...createFieldsUpload(
    [
      { name: "photo", maxCount: 1 },
      { name: "file", maxCount: 1 },
    ],
    beritaUploadPolicy,
  ),
  createUploadErrorHandler(5),
  validate({ body: updateBeritaSchema }),
  controller.updateBerita,
);

router.delete(
  "/:id",
  authenticate,
  requireAnyPermission(beritaPolicy.deletePermissions),
  validate({ params: beritaIdParamSchema }),
  controller.deleteBerita,
);
router.post(
  "/:id/restore",
  authenticate,
  requireAnyPermission(beritaPolicy.deletePermissions),
  validate({ params: beritaIdParamSchema }),
  controller.restoreBerita,
);

export const path = "/berita";
export default router;
