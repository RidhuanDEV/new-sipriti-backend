import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { SertifikatMutuController } from "./sertifikatmutu.controller.js";
import { sertifikatMutuPolicy } from "./policies/sertifikatmutu.policy.js";
import { createSertifikatMutuSchema, listSertifikatMutuQuerySchema, sertifikatMutuIdParamSchema, updateSertifikatMutuSchema } from "./sertifikatmutu.schema.js";

const controller = new SertifikatMutuController();
const router = Router();

router.get("/", validate({ query: listSertifikatMutuQuerySchema }), controller.getAll);
router.get("/all", controller.all);
router.get("/:id", validate({ params: sertifikatMutuIdParamSchema }), controller.getById);
router.post("/", authenticate, requirePermission(sertifikatMutuPolicy.managePermission), validate({ body: createSertifikatMutuSchema }), controller.create);
router.put("/:id", authenticate, requirePermission(sertifikatMutuPolicy.managePermission), validate({ params: sertifikatMutuIdParamSchema, body: updateSertifikatMutuSchema }), controller.update);
router.delete("/:id", authenticate, requirePermission(sertifikatMutuPolicy.managePermission), validate({ params: sertifikatMutuIdParamSchema }), controller.delete);

export const path = "/sertifikat-mutu";
export default router;
