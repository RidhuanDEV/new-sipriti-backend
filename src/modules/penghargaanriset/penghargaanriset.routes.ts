import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { PenghargaanRisetController } from "./penghargaanriset.controller.js";
import { penghargaanRisetPolicy } from "./policies/penghargaanriset.policy.js";
import { createPenghargaanRisetSchema, listPenghargaanRisetQuerySchema, penghargaanRisetIdParamSchema, updatePenghargaanRisetSchema } from "./penghargaanriset.schema.js";

const controller = new PenghargaanRisetController();
const router = Router();

router.get("/", validate({ query: listPenghargaanRisetQuerySchema }), controller.getAllPenghargaanRiset);
router.get("/all", controller.getAllPenghargaanRisetNoPagination);
router.get("/:id", validate({ params: penghargaanRisetIdParamSchema }), controller.getPenghargaanRiset);
router.post("/", authenticate, requirePermission(penghargaanRisetPolicy.managePermission), validate({ body: createPenghargaanRisetSchema }), controller.createPenghargaanRiset);
router.put("/:id", authenticate, requirePermission(penghargaanRisetPolicy.managePermission), validate({ params: penghargaanRisetIdParamSchema, body: updatePenghargaanRisetSchema }), controller.updatePenghargaanRiset);
router.delete("/:id", authenticate, requirePermission(penghargaanRisetPolicy.managePermission), validate({ params: penghargaanRisetIdParamSchema }), controller.deletePenghargaanRiset);

export const path = "/penghargaan-riset";
export default router;
