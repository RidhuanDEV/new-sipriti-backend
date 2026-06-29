import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { listPanduanQuerySchema } from "./panduan.schema.js";
import { PanduanService } from "./panduan.service.js";
import type { CreatePanduanDto, UpdatePanduanDto } from "./dto/panduan.dto.js";

interface PanduanUploadedFiles {
  thumbnail?: Express.Multer.File[];
  file?: Express.Multer.File[];
}

const service = new PanduanService();

function requestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

function panduanFiles(req: Request): PanduanUploadedFiles {
  if (!req.files || Array.isArray(req.files)) return {};
  const files: PanduanUploadedFiles = {};
  if (req.files.thumbnail) files.thumbnail = req.files.thumbnail;
  if (req.files.file) files.file = req.files.file;
  return files;
}

export class PanduanController {
  listPanduan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.listPanduan(
        listPanduanQuerySchema.parse(req.query),
        req.user?.roles.some((role) => role.name.toLowerCase() === "admin") ?? false,
      );
      sendSuccess(res, {
        message: "Berhasil mengambil daftar panduan",
        data: result.rows,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  };

  getPanduanById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      sendSuccess(res, {
        message: "Berhasil mengambil detail panduan",
        data: await service.getPanduanById(req.params.id),
      });
    } catch (err) {
      next(err);
    }
  };

  createPanduan = async (
    req: Request<Record<string, string>, unknown, CreatePanduanDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.createPanduan(
        req.body,
        panduanFiles(req),
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, { statusCode: 201, message: "Panduan berhasil dibuat", data });
    } catch (err) {
      next(err);
    }
  };

  updatePanduan = async (
    req: Request<{ id: string }, unknown, UpdatePanduanDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.updatePanduan(
        req.params.id,
        req.body,
        panduanFiles(req),
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, { message: "Panduan berhasil diupdate", data });
    } catch (err) {
      next(err);
    }
  };

  deletePanduan = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await service.deletePanduan(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Panduan berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };

  restorePanduan = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await service.restorePanduan(
        req.params.id,
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, {
        message: "Panduan berhasil dipulihkan",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}
