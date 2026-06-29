import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { OutputController } from "./output.controller.js";
import { outputPolicy } from "./policies/output.policy.js";
import { createOutputSchema, listOutputQuerySchema, outputIdParamSchema, updateOutputSchema } from "./output.schema.js";

const controller = new OutputController();
const router = Router();

router.get("/", authenticate, validate({ query: listOutputQuerySchema }), controller.getAll);
router.get("/options", authenticate, controller.options);
router.post("/", authenticate, requirePermission(outputPolicy.createPermission), validate({ body: createOutputSchema }), controller.create);
router.get("/:id", authenticate, validate({ params: outputIdParamSchema }), controller.getById);
router.put("/:id", authenticate, requirePermission(outputPolicy.editPermission), validate({ params: outputIdParamSchema, body: updateOutputSchema }), controller.update);
router.delete("/:id", authenticate, requirePermission(outputPolicy.deletePermission), validate({ params: outputIdParamSchema }), controller.delete);

export const path = "/outputs";
export default router;
