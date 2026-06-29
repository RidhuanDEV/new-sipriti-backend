import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { ProductController } from "./product.controller.js";
import { productPolicy } from "./policies/product.policy.js";
import {
  createProductSchema,
  listProductsQuerySchema,
  productIdParamSchema,
  updateProductSchema,
} from "./product.schema.js";

const router = Router();
const controller = new ProductController();

router.get("/", validate({ query: listProductsQuerySchema }), controller.listProducts);
router.get("/:id", validate({ params: productIdParamSchema }), controller.getProduct);
router.post(
  "/",
  authenticate,
  requireAnyPermission(productPolicy.managePermissions),
  validate({ body: createProductSchema }),
  controller.createProduct,
);
router.put(
  "/:id",
  authenticate,
  requireAnyPermission(productPolicy.managePermissions),
  validate({ params: productIdParamSchema, body: updateProductSchema }),
  controller.updateProduct,
);
router.delete(
  "/:id",
  authenticate,
  requireAnyPermission(productPolicy.managePermissions),
  validate({ params: productIdParamSchema }),
  controller.deleteProduct,
);

export const path = "/products";
export default router;
