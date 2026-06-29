import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission, requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { createContentUploadPolicy, createSingleUpload, createUploadErrorHandler } from "../../core/storage/upload.middleware.js";
import { CarouselController } from "./carousel.controller.js";
import { carouselPolicy } from "./policies/carousel.policy.js";
import { carouselIdParamSchema, createCarouselSchema, listCarouselAdminQuerySchema, listCarouselQuerySchema, updateCarouselSchema } from "./carousel.schema.js";

const controller = new CarouselController();
const router = Router();
const carouselUpload = createSingleUpload("image", createContentUploadPolicy("images"));

router.get("/admin", authenticate, requireAnyPermission([carouselPolicy.viewPermission, carouselPolicy.managePermission]), validate({ query: listCarouselAdminQuerySchema }), controller.listCarouselAdmin);
router.get("/", validate({ query: listCarouselQuerySchema }), controller.listCarousel);
router.get("/:id", validate({ params: carouselIdParamSchema }), controller.getCarouselById);
router.post("/", authenticate, requireAnyPermission([carouselPolicy.createPermission, carouselPolicy.managePermission]), ...carouselUpload, createUploadErrorHandler(5), validate({ body: createCarouselSchema }), controller.createCarousel);
router.put("/:id", authenticate, requireAnyPermission([carouselPolicy.editPermission, carouselPolicy.managePermission]), validate({ params: carouselIdParamSchema }), ...carouselUpload, createUploadErrorHandler(5), validate({ body: updateCarouselSchema }), controller.updateCarousel);
router.delete("/:id", authenticate, requireAnyPermission([carouselPolicy.deletePermission, carouselPolicy.managePermission]), validate({ params: carouselIdParamSchema }), controller.deleteCarousel);
router.post("/:id/restore", authenticate, requireAnyPermission([carouselPolicy.deletePermission, carouselPolicy.managePermission]), validate({ params: carouselIdParamSchema }), controller.restoreCarousel);

export const path = "/carousel";
export default router;
