import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { SearchAnggotaController } from "./search-anggota.controller.js";
import { searchAnggotaQuerySchema } from "./search-anggota.schema.js";

const controller = new SearchAnggotaController();
const router = Router();

router.get("/search-anggota", authenticate, validate({ query: searchAnggotaQuerySchema }), controller.searchAnggota);

export const path = "/usulan";
export default router;
