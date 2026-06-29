import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import {
  requireAnyPermission,
  requirePermission,
} from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { ProdiController } from "./prodi.controller.js";
import { prodiPolicy } from "./policies/prodi.policy.js";
import {
  createProdiSchema,
  listProdiQuerySchema,
  prodiIdParamSchema,
  updateProdiSchema,
} from "./prodi.schema.js";

const controller = new ProdiController();

export const adminProdiRouter = Router();
adminProdiRouter.get(
  "/",
  authenticate,
  requireAnyPermission(prodiPolicy.viewPermissions),
  validate({ query: listProdiQuerySchema }),
  controller.getAll,
);
adminProdiRouter.get(
  "/:id",
  authenticate,
  requireAnyPermission(prodiPolicy.viewPermissions),
  validate({ params: prodiIdParamSchema }),
  controller.getById,
);
adminProdiRouter.post(
  "/",
  authenticate,
  requirePermission(prodiPolicy.createPermission),
  validate({ body: createProdiSchema }),
  controller.create,
);
adminProdiRouter.put(
  "/:id",
  authenticate,
  requirePermission(prodiPolicy.editPermission),
  validate({ params: prodiIdParamSchema, body: updateProdiSchema }),
  controller.update,
);
adminProdiRouter.delete(
  "/:id",
  authenticate,
  requirePermission(prodiPolicy.deletePermission),
  validate({ params: prodiIdParamSchema }),
  controller.delete,
);
adminProdiRouter.post(
  "/:id/restore",
  authenticate,
  requirePermission(prodiPolicy.deletePermission),
  validate({ params: prodiIdParamSchema }),
  controller.restore,
);

export const prodiOptionsRouter = Router();
prodiOptionsRouter.get("/options", controller.options);
