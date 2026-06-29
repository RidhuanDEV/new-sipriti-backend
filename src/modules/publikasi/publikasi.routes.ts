import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { PublikasiController } from "./publikasi.controller.js";
import { publikasiPolicy } from "./policies/publikasi.policy.js";
import { listPublikasiQuerySchema, upsertPublikasiSchema } from "./publikasi.schema.js";

const controller = new PublikasiController();
const router = Router();

router.get("/", validate({ query: listPublikasiQuerySchema }), controller.listPublikasi);
router.post("/upsert", authenticate, requirePermission(publikasiPolicy.editPermission), validate({ body: upsertPublikasiSchema }), controller.upsertPublikasi);

export const path = "/publikasi";
export default router;
