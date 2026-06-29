import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission, requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { BidangFokusController } from "./bidangfokus.controller.js";
import { bidangFokusPolicy } from "./policies/bidangfokus.policy.js";
import { bidangFokusIdParamSchema, createBidangFokusSchema, listBidangFokusQuerySchema, updateBidangFokusSchema } from "./bidangfokus.schema.js";

const controller = new BidangFokusController();

export const adminBidangFokusRouter = Router();
adminBidangFokusRouter.get("/", authenticate, requireAnyPermission(bidangFokusPolicy.viewPermissions), validate({ query: listBidangFokusQuerySchema }), controller.getAll);
adminBidangFokusRouter.get("/:id", authenticate, requireAnyPermission(bidangFokusPolicy.viewPermissions), validate({ params: bidangFokusIdParamSchema }), controller.getById);
adminBidangFokusRouter.post("/", authenticate, requirePermission(bidangFokusPolicy.createPermission), validate({ body: createBidangFokusSchema }), controller.create);
adminBidangFokusRouter.put("/:id", authenticate, requirePermission(bidangFokusPolicy.editPermission), validate({ params: bidangFokusIdParamSchema, body: updateBidangFokusSchema }), controller.update);
adminBidangFokusRouter.delete("/:id", authenticate, requirePermission(bidangFokusPolicy.deletePermission), validate({ params: bidangFokusIdParamSchema }), controller.delete);
adminBidangFokusRouter.post("/:id/restore", authenticate, requirePermission(bidangFokusPolicy.deletePermission), validate({ params: bidangFokusIdParamSchema }), controller.restore);

export const bidangFokusOptionsRouter = Router();
bidangFokusOptionsRouter.get("/options", controller.options);
