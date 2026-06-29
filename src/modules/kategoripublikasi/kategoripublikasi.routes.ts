import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { KategoriPublikasiController } from "./kategoripublikasi.controller.js";
import { kategoriPublikasiPolicy } from "./policies/kategoripublikasi.policy.js";
import { createKategoriPublikasiSchema, kategoriPublikasiIdParamSchema, listKategoriPublikasiQuerySchema, updateKategoriPublikasiSchema } from "./kategoripublikasi.schema.js";

const controller = new KategoriPublikasiController();
const router = Router();

router.get("/", validate({ query: listKategoriPublikasiQuerySchema }), controller.listKategoriPublikasi);
router.get("/:id", validate({ params: kategoriPublikasiIdParamSchema }), controller.getKategoriPublikasiById);
router.post("/", authenticate, requirePermission(kategoriPublikasiPolicy.managePermission), validate({ body: createKategoriPublikasiSchema }), controller.createKategoriPublikasi);
router.put("/:id", authenticate, requirePermission(kategoriPublikasiPolicy.managePermission), validate({ params: kategoriPublikasiIdParamSchema, body: updateKategoriPublikasiSchema }), controller.updateKategoriPublikasi);
router.delete("/:id", authenticate, requirePermission(kategoriPublikasiPolicy.managePermission), validate({ params: kategoriPublikasiIdParamSchema }), controller.deleteKategoriPublikasi);

export const path = "/kategori-publikasi";
export default router;
