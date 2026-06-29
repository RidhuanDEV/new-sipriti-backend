import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { CapaianController } from "./capaian.controller.js";
import { capaianPolicy } from "./policies/capaian.policy.js";
import { batchUpsertDeskripsiSchema, capaianRangeQuerySchema, sectionKeyParamSchema, upsertDeskripsiSchema } from "./capaian.schema.js";

const controller = new CapaianController();
const router = Router();

router.get("/publikasi-pivot", validate({ query: capaianRangeQuerySchema }), controller.getPublikasiPivot);
router.get("/stats", controller.getCapaianStats);
router.get("/stats/dana-hibah", controller.getTotalDanaHibah);
router.get("/stats/mitra-riset", controller.getTotalMitraRiset);
router.get("/stats/hki", controller.getTotalHki);
router.get("/stats/publikasi", validate({ query: capaianRangeQuerySchema }), controller.getTotalPublikasi);
router.get("/static-content", controller.getStaticContent);
router.get("/deskripsi", authenticate, requirePermission(capaianPolicy.viewPermission), controller.getAllDeskripsi);
router.get("/deskripsi/:sectionKey", authenticate, requirePermission(capaianPolicy.viewPermission), validate({ params: sectionKeyParamSchema }), controller.getDeskripsiBySection);
router.put("/deskripsi/:sectionKey", authenticate, requirePermission(capaianPolicy.editPermission), validate({ params: sectionKeyParamSchema, body: upsertDeskripsiSchema }), controller.upsertDeskripsi);
router.put("/deskripsi", authenticate, requirePermission(capaianPolicy.editPermission), validate({ body: batchUpsertDeskripsiSchema }), controller.batchUpsertDeskripsi);

export const path = "/capaian";
export default router;
