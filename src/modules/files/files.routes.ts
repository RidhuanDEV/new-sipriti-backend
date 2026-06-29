import { Router } from "express";
import { validate } from "../../core/middleware/validate.middleware.js";
import { FilesController } from "./files.controller.js";
import { fileIdParamSchema, filePathParamSchema } from "./files.schema.js";

const controller = new FilesController();
const router = Router();

router.get("/path/:subdir/:filename", validate({ params: filePathParamSchema }), controller.getFileByPath);
router.get("/:id", validate({ params: fileIdParamSchema }), controller.getFileById);

export const path = "/files";
export default router;
