import { Router } from "express";
import type { ErrorRequestHandler } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { HttpError } from "../../core/errors/http-error.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import {
  createArrayUpload,
  createSingleUpload,
  createUploadErrorHandler,
  IMAGE_EXTENSIONS,
  IMAGE_MIME_TYPES,
  IMAGE_UPLOAD_POLICY,
} from "../../core/storage/upload.middleware.js";
import { createUuidOnlyFilename } from "../../core/storage/upload-filename.js";
import { UploadController } from "./upload.controller.js";
import { deleteImageParamSchema } from "./upload.schema.js";

const controller = new UploadController();
const router = Router();

const richtextPolicy = {
  subdir: "richtext",
  allowedMimes: new Set(["image/jpeg", "image/png", "image/webp"]),
  allowedExtensions: new Set([".jpg", ".jpeg", ".png", ".webp"]),
  maxFileSizeBytes: 2 * 1024 * 1024,
  filenameFactory: createUuidOnlyFilename,
};

const richtextUploadErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof HttpError && err.code === "INVALID_FILE_SIGNATURE") {
    res.status(400).json({
      status: "error",
      code: "INVALID_FILE_SIGNATURE",
      message: "File signature tidak valid. File mungkin telah dimanipulasi.",
      errors: [],
    });
    return;
  }

  next(err);
};

router.post(
  "/image",
  authenticate,
  ...createSingleUpload("image", IMAGE_UPLOAD_POLICY),
  createUploadErrorHandler(5),
  controller.uploadImage,
);

router.post(
  "/images",
  authenticate,
  ...createArrayUpload("images", 10, {
    ...IMAGE_UPLOAD_POLICY,
    maxFiles: 10,
    allowedMimes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS,
  }),
  createUploadErrorHandler(5),
  controller.uploadMultipleImages,
);

router.delete(
  "/image/:filename",
  authenticate,
  validate({ params: deleteImageParamSchema }),
  controller.deleteImage,
);

router.post(
  "/richtext",
  authenticate,
  ...createSingleUpload("file", richtextPolicy),
  richtextUploadErrorHandler,
  createUploadErrorHandler(2),
  controller.uploadRichtextImage,
);

router.delete(
  "/richtext/:filename",
  authenticate,
  validate({ params: deleteImageParamSchema }),
  controller.deleteRichtextImage,
);

export const path = "/upload";
export default router;
