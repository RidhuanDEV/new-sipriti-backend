import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { listPengumumanQuerySchema } from "./pengumuman.schema.js";
import { PengumumanService } from "./pengumuman.service.js";
import type { CreatePengumumanDto, UpdatePengumumanDto } from "./dto/pengumuman.dto.js";

interface PengumumanUploadedFiles {
  gambar?: Express.Multer.File[];
  file_lampiran?: Express.Multer.File[];
}

const service = new PengumumanService();

function requestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

function pengumumanFiles(req: Request): PengumumanUploadedFiles {
  if (!req.files || Array.isArray(req.files)) return {};
  const files: PengumumanUploadedFiles = {};
  if (req.files.gambar) files.gambar = req.files.gambar;
  if (req.files.file_lampiran) files.file_lampiran = req.files.file_lampiran;
  return files;
}

export class PengumumanController {
  listPengumuman = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.listPengumuman(
        listPengumumanQuerySchema.parse(req.query),
        req.user?.roles.some((role) => role.name.toLowerCase() === "admin") ?? false,
      );
      sendSuccess(res, {
        message: "Berhasil mengambil daftar pengumuman",
        data: result.rows,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  };

  getPengumumanById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      sendSuccess(res, {
        message: "Berhasil mengambil detail pengumuman",
        data: await service.getPengumumanById(req.params.id),
      });
    } catch (err) {
      next(err);
    }
  };

  createPengumuman = async (
    req: Request<Record<string, string>, unknown, CreatePengumumanDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.createPengumuman(
        req.body,
        pengumumanFiles(req),
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, { statusCode: 201, message: "Pengumuman berhasil dibuat", data });
    } catch (err) {
      next(err);
    }
  };

  updatePengumuman = async (
    req: Request<{ id: string }, unknown, UpdatePengumumanDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.updatePengumuman(
        req.params.id,
        req.body,
        pengumumanFiles(req),
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, { message: "Pengumuman berhasil diupdate", data });
    } catch (err) {
      next(err);
    }
  };

  deletePengumuman = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await service.deletePengumuman(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Pengumuman berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };

  restorePengumuman = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await service.restorePengumuman(
        req.params.id,
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, {
        message: "Pengumuman berhasil dipulihkan",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}
