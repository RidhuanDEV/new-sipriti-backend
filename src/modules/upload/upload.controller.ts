import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { uploadService } from "./upload.service.js";

export class UploadController {
  uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await uploadService.uploadImage(req.file, requireAuthenticatedUser(req));
      sendSuccess(res, { message: "Gambar berhasil diunggah", data: result });
    } catch (err) {
      next(err);
    }
  };

  uploadMultipleImages = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const files = Array.isArray(req.files) ? req.files : [];
      const result = await uploadService.uploadMultipleImages(
        files,
        requireAuthenticatedUser(req),
      );
      sendSuccess(res, {
        message: `${result.length} gambar berhasil diunggah`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  uploadRichtextImage = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          status: "error",
          code: "VALIDATION_ERROR",
          message: "File tidak ditemukan dalam request.",
          errors: [],
        });
        return;
      }

      const result = await uploadService.registerRichtextImage(
        req.file,
        requireAuthenticatedUser(req),
      );
      res.json({
        status: "success",
        data: result,
        message: "Image berhasil diunggah.",
      });
    } catch (err) {
      next(err);
    }
  };

  deleteImage = async (
    req: Request<{ filename: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await uploadService.deleteImage(req.params.filename, requireAuthenticatedUser(req));
      sendSuccess(res, { message: "Gambar berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };

  deleteRichtextImage = async (
    req: Request<{ filename: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const deleted = await uploadService.deleteRichtextImage(
        req.params.filename,
        requireAuthenticatedUser(req),
      );
      sendSuccess(res, {
        message: deleted
          ? "Image richtext berhasil dihapus"
          : "Image richtext sudah tidak ditemukan",
        data: { deleted },
      });
    } catch (err) {
      next(err);
    }
  };
}
