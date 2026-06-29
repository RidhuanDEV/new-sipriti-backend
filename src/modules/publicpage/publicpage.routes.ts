import { Router } from "express";
import { validate } from "../../core/middleware/validate.middleware.js";
import { PublicpageController } from "./publicpage.controller.js";
import {
  publicPageIdParamSchema,
  publicPageListQuerySchema,
  publicPageSlugParamSchema,
} from "./publicpage.schema.js";

const controller = new PublicpageController();
const router = Router();

router.get("/berita", validate({ query: publicPageListQuerySchema }), controller.listBerita);
router.get("/berita/:slug", validate({ params: publicPageSlugParamSchema }), controller.getBeritaBySlug);
router.get("/pengumuman", validate({ query: publicPageListQuerySchema }), controller.listPengumuman);
router.get("/pengumuman/:slug", validate({ params: publicPageSlugParamSchema }), controller.getPengumumanBySlug);
router.get("/panduan", validate({ query: publicPageListQuerySchema }), controller.listPanduan);
router.get("/panduan/:id", validate({ params: publicPageIdParamSchema }), controller.getPanduanById);

export const path = "/publicpage";
export default router;
