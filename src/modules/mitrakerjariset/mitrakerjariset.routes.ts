import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { MitraKerjaRisetController } from "./mitrakerjariset.controller.js";
import { mitraKerjaRisetPolicy } from "./policies/mitrakerjariset.policy.js";
import { createMitraKerjaRisetSchema, listMitraKerjaRisetQuerySchema, mitraKerjaRisetIdParamSchema, updateMitraKerjaRisetSchema } from "./mitrakerjariset.schema.js";

const controller = new MitraKerjaRisetController();
const router = Router();

router.get("/", validate({ query: listMitraKerjaRisetQuerySchema }), controller.listMitraKerjaRiset);
router.get("/all", controller.getAllMitraKerjaRiset);
router.get("/:id", validate({ params: mitraKerjaRisetIdParamSchema }), controller.getMitraKerjaRisetById);
router.post("/", authenticate, requirePermission(mitraKerjaRisetPolicy.managePermission), validate({ body: createMitraKerjaRisetSchema }), controller.createMitraKerjaRiset);
router.put("/:id", authenticate, requirePermission(mitraKerjaRisetPolicy.managePermission), validate({ params: mitraKerjaRisetIdParamSchema, body: updateMitraKerjaRisetSchema }), controller.updateMitraKerjaRiset);
router.delete("/:id", authenticate, requirePermission(mitraKerjaRisetPolicy.managePermission), validate({ params: mitraKerjaRisetIdParamSchema }), controller.deleteMitraKerjaRiset);

export const path = "/mitra-kerja-riset";
export default router;
