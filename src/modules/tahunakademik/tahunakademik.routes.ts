import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { tahunAkademikPolicy } from "./policies/tahunakademik.policy.js";
import { TahunAkademikController } from "./tahunakademik.controller.js";
import { createTahunAkademikSchema, listTahunAkademikQuerySchema, tahunAkademikIdParamSchema, updateTahunAkademikSchema } from "./tahunakademik.schema.js";

const controller = new TahunAkademikController();
const router = Router();

router.get("/", validate({ query: listTahunAkademikQuerySchema }), controller.list);
router.get("/all", controller.all);
router.get("/:id", validate({ params: tahunAkademikIdParamSchema }), controller.getById);
router.post("/", authenticate, requirePermission(tahunAkademikPolicy.createPermission), validate({ body: createTahunAkademikSchema }), controller.create);
router.put("/:id", authenticate, requirePermission(tahunAkademikPolicy.editPermission), validate({ params: tahunAkademikIdParamSchema, body: updateTahunAkademikSchema }), controller.update);
router.delete("/:id", authenticate, requirePermission(tahunAkademikPolicy.deletePermission), validate({ params: tahunAkademikIdParamSchema }), controller.delete);

export const path = "/tahun-akademik";
export default router;
