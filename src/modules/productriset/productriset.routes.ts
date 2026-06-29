import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { ProductRisetController } from "./productriset.controller.js";
import { productRisetPolicy } from "./policies/productriset.policy.js";
import { createProductRisetSchema, listProductRisetQuerySchema, productRisetIdParamSchema, updateProductRisetSchema } from "./productriset.schema.js";

const controller = new ProductRisetController();
const router = Router();

router.get("/", validate({ query: listProductRisetQuerySchema }), controller.listProductRiset);
router.get("/all", controller.getAllProductRiset);
router.get("/:id", validate({ params: productRisetIdParamSchema }), controller.getProductRisetById);
router.post("/", authenticate, requirePermission(productRisetPolicy.managePermission), validate({ body: createProductRisetSchema }), controller.createProductRiset);
router.put("/:id", authenticate, requirePermission(productRisetPolicy.managePermission), validate({ params: productRisetIdParamSchema, body: updateProductRisetSchema }), controller.updateProductRiset);
router.delete("/:id", authenticate, requirePermission(productRisetPolicy.managePermission), validate({ params: productRisetIdParamSchema }), controller.deleteProductRiset);

export const path = "/product-riset";
export default router;
