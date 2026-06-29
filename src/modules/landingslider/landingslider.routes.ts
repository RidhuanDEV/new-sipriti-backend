import { Router } from "express";
import type { Request, RequestHandler } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { deleteFileSafe } from "../../core/storage/file-system.js";
import { processLandingSliderImage } from "../../core/storage/image-processing.js";
import { fromPublicUploadUrl } from "../../core/storage/storage-paths.js";
import { createFieldsUpload, createLandingSliderUploadErrorHandler, IMAGE_EXTENSIONS, IMAGE_MIME_TYPES } from "../../core/storage/upload.middleware.js";
import { LandingSliderController } from "./landingslider.controller.js";
import { landingSliderPolicy } from "./policies/landingslider.policy.js";
import { createLandingSliderSchema, landingSliderIdParamSchema, listLandingSliderAdminQuerySchema, updateLandingSliderSchema } from "./landingslider.schema.js";

const controller = new LandingSliderController();
const router = Router();
const landingSliderUpload = createFieldsUpload(
  [
    { name: "img_desktop", maxCount: 1 },
    { name: "img_mobile", maxCount: 1 },
  ],
  {
    subdir: "temp",
    allowedMimes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS,
    maxFileSizeBytes: 10 * 1024 * 1024,
    maxFiles: 2,
  },
);

type MulterFilesMap = Record<string, Express.Multer.File[]>;

function isMulterFilesMap(files: Request["files"]): files is MulterFilesMap {
  return typeof files === "object" && files !== null && !Array.isArray(files);
}

function getUploadedFile(req: Request, fieldName: "img_desktop" | "img_mobile"): Express.Multer.File | undefined {
  if (!isMulterFilesMap(req.files)) return undefined;
  return req.files[fieldName]?.[0];
}

const validateAndProcessLandingSliderImages: RequestHandler = async (req, res, next) => {
  const desktopFile = getUploadedFile(req, "img_desktop");
  const mobileFile = getUploadedFile(req, "img_mobile");
  const processedImages: Express.Request["processedImages"] = {};
  const errors: string[] = [];

  try {
    if (desktopFile) {
      try {
        processedImages.img_desktop = await processLandingSliderImage(desktopFile, "desktop");
      } catch (err) {
        errors.push(`img_desktop: ${err instanceof Error ? err.message : "Validasi gambar desktop gagal"}`);
      }
    }

    if (mobileFile) {
      try {
        processedImages.img_mobile = await processLandingSliderImage(mobileFile, "mobile");
      } catch (err) {
        errors.push(`img_mobile: ${err instanceof Error ? err.message : "Validasi gambar mobile gagal"}`);
      }
    }

    if (errors.length > 0) {
      await cleanupLandingSliderFiles({ req, processedImages });
      res.status(400).json({
        success: false,
        message: errors.join("; ") || "Validasi gambar gagal",
        error: "IMAGE_VALIDATION_ERROR",
      });
      return;
    }

    req.processedImages = processedImages;
    next();
  } catch (err) {
    await cleanupLandingSliderFiles({ req, processedImages });
    next(err);
  }
};

async function cleanupLandingSliderFiles(params: {
  req: Request;
  processedImages: Express.Request["processedImages"];
}): Promise<void> {
  const desktopFile = getUploadedFile(params.req, "img_desktop");
  const mobileFile = getUploadedFile(params.req, "img_mobile");
  await Promise.all([
    desktopFile ? deleteFileSafe(desktopFile.path) : Promise.resolve(),
    mobileFile ? deleteFileSafe(mobileFile.path) : Promise.resolve(),
    params.processedImages?.img_desktop
      ? deleteFileSafe(fromPublicUploadUrl(params.processedImages.img_desktop.url)?.absolutePath ?? null)
      : Promise.resolve(),
    params.processedImages?.img_mobile
      ? deleteFileSafe(fromPublicUploadUrl(params.processedImages.img_mobile.url)?.absolutePath ?? null)
      : Promise.resolve(),
  ]);
}

router.get("/admin", authenticate, requirePermission(landingSliderPolicy.viewPermission), validate({ query: listLandingSliderAdminQuerySchema }), controller.listLandingSliderAdmin);
router.post("/", authenticate, requirePermission(landingSliderPolicy.createPermission), ...landingSliderUpload, createLandingSliderUploadErrorHandler(), validateAndProcessLandingSliderImages, validate({ body: createLandingSliderSchema }), controller.createLandingSlider);
router.put("/:id", authenticate, requirePermission(landingSliderPolicy.editPermission), ...landingSliderUpload, createLandingSliderUploadErrorHandler(), validateAndProcessLandingSliderImages, validate({ params: landingSliderIdParamSchema, body: updateLandingSliderSchema }), controller.updateLandingSlider);
router.delete("/:id", authenticate, requirePermission(landingSliderPolicy.deletePermission), validate({ params: landingSliderIdParamSchema }), controller.deleteLandingSlider);
router.post("/:id/restore", authenticate, requirePermission(landingSliderPolicy.deletePermission), validate({ params: landingSliderIdParamSchema }), controller.restoreLandingSlider);
router.get("/", controller.listLandingSliderPublic);
router.get("/:id", validate({ params: landingSliderIdParamSchema }), controller.getLandingSliderById);

export const path = "/landing-slider";
export default router;
