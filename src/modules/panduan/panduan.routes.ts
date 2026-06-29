import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import {
  createContentUploadPolicy,
  createFieldsUpload,
  createUploadErrorHandler,
} from "../../core/storage/upload.middleware.js";
import { PanduanController } from "./panduan.controller.js";
import { panduanPolicy } from "./policies/panduan.policy.js";
import {
  createPanduanSchema,
  listPanduanQuerySchema,
  panduanIdParamSchema,
  updatePanduanSchema,
} from "./panduan.schema.js";

const controller = new PanduanController();
const router = Router();
const panduanUploadPolicy = createContentUploadPolicy("panduan");

router.get("/", validate({ query: listPanduanQuerySchema }), controller.listPanduan);
router.get("/:id", validate({ params: panduanIdParamSchema }), controller.getPanduanById);

router.post(
  "/",
  authenticate,
  requireAnyPermission(panduanPolicy.createPermissions),
  ...createFieldsUpload(
    [
      { name: "thumbnail", maxCount: 1 },
      { name: "file", maxCount: 1 },
    ],
    panduanUploadPolicy,
  ),
  createUploadErrorHandler(5),
  validate({ body: createPanduanSchema }),
  controller.createPanduan,
);

router.put(
  "/:id",
  authenticate,
  requireAnyPermission(panduanPolicy.editPermissions),
  validate({ params: panduanIdParamSchema }),
  ...createFieldsUpload(
    [
      { name: "thumbnail", maxCount: 1 },
      { name: "file", maxCount: 1 },
    ],
    panduanUploadPolicy,
  ),
  createUploadErrorHandler(5),
  validate({ body: updatePanduanSchema }),
  controller.updatePanduan,
);

router.delete(
  "/:id",
  authenticate,
  requireAnyPermission(panduanPolicy.deletePermissions),
  validate({ params: panduanIdParamSchema }),
  controller.deletePanduan,
);
router.post(
  "/:id/restore",
  authenticate,
  requireAnyPermission(panduanPolicy.deletePermissions),
  validate({ params: panduanIdParamSchema }),
  controller.restorePanduan,
);

export const path = "/panduan";
export default router;
