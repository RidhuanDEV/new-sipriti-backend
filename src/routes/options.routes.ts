import { Router } from "express";
import { bidangFokusOptionsRouter } from "../modules/bidangfokus/bidangfokus.routes.js";
import { prodiOptionsRouter } from "../modules/prodi/prodi.routes.js";
import { skemaOptionsRouter } from "../modules/skema/skema.routes.js";

const router = Router();

router.use("/prodi", prodiOptionsRouter);
router.use("/skema", skemaOptionsRouter);
router.use("/bidang-fokus", bidangFokusOptionsRouter);

export default router;
