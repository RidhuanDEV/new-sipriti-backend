import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission, requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { SkemaController } from "./skema.controller.js";
import { skemaPolicy } from "./policies/skema.policy.js";
import { createSkemaSchema, listSkemaQuerySchema, skemaIdParamSchema, skemaOptionsQuerySchema, updateSkemaSchema } from "./skema.schema.js";

const controller = new SkemaController();

export const adminSkemaRouter = Router();
adminSkemaRouter.get("/", authenticate, requireAnyPermission(skemaPolicy.viewPermissions), validate({ query: listSkemaQuerySchema }), controller.getAll);
adminSkemaRouter.get("/:id", authenticate, requireAnyPermission(skemaPolicy.viewPermissions), validate({ params: skemaIdParamSchema }), controller.getById);
adminSkemaRouter.post("/", authenticate, requirePermission(skemaPolicy.createPermission), validate({ body: createSkemaSchema }), controller.create);
adminSkemaRouter.put("/:id", authenticate, requirePermission(skemaPolicy.editPermission), validate({ params: skemaIdParamSchema, body: updateSkemaSchema }), controller.update);
adminSkemaRouter.delete("/:id", authenticate, requirePermission(skemaPolicy.deletePermission), validate({ params: skemaIdParamSchema }), controller.delete);
adminSkemaRouter.post("/:id/restore", authenticate, requirePermission(skemaPolicy.deletePermission), validate({ params: skemaIdParamSchema }), controller.restore);

export const skemaOptionsRouter = Router();
skemaOptionsRouter.get("/options", validate({ query: skemaOptionsQuerySchema }), controller.options);
