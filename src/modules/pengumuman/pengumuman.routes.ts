import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import {
  createContentUploadPolicy,
  createFieldsUpload,
  createUploadErrorHandler,
} from "../../core/storage/upload.middleware.js";
import { PengumumanController } from "./pengumuman.controller.js";
import { pengumumanPolicy } from "./policies/pengumuman.policy.js";
import {
  createPengumumanSchema,
  listPengumumanQuerySchema,
  pengumumanIdParamSchema,
  updatePengumumanSchema,
} from "./pengumuman.schema.js";

const controller = new PengumumanController();
const router = Router();
const pengumumanUploadPolicy = createContentUploadPolicy("pengumuman");

router.get("/", validate({ query: listPengumumanQuerySchema }), controller.listPengumuman);
router.get("/:id", validate({ params: pengumumanIdParamSchema }), controller.getPengumumanById);

router.post(
  "/",
  authenticate,
  requireAnyPermission(pengumumanPolicy.createPermissions),
  ...createFieldsUpload(
    [
      { name: "gambar", maxCount: 1 },
      { name: "file_lampiran", maxCount: 1 },
    ],
    pengumumanUploadPolicy,
  ),
  createUploadErrorHandler(5),
  validate({ body: createPengumumanSchema }),
  controller.createPengumuman,
);

router.put(
  "/:id",
  authenticate,
  requireAnyPermission(pengumumanPolicy.editPermissions),
  validate({ params: pengumumanIdParamSchema }),
  ...createFieldsUpload(
    [
      { name: "gambar", maxCount: 1 },
      { name: "file_lampiran", maxCount: 1 },
    ],
    pengumumanUploadPolicy,
  ),
  createUploadErrorHandler(5),
  validate({ body: updatePengumumanSchema }),
  controller.updatePengumuman,
);

router.delete(
  "/:id",
  authenticate,
  requireAnyPermission(pengumumanPolicy.deletePermissions),
  validate({ params: pengumumanIdParamSchema }),
  controller.deletePengumuman,
);
router.post(
  "/:id/restore",
  authenticate,
  requireAnyPermission(pengumumanPolicy.deletePermissions),
  validate({ params: pengumumanIdParamSchema }),
  controller.restorePengumuman,
);

export const path = "/pengumuman";
export default router;
