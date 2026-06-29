import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { BeritaService } from "./berita.service.js";
import { listBeritaQuerySchema } from "./berita.schema.js";
import type { CreateBeritaDto, UpdateBeritaDto } from "./dto/berita.dto.js";

interface BeritaUploadedFiles {
  photo?: Express.Multer.File[];
  file?: Express.Multer.File[];
}

const service = new BeritaService();

function requestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

function beritaFiles(req: Request): BeritaUploadedFiles {
  if (!req.files || Array.isArray(req.files)) return {};
  const files: BeritaUploadedFiles = {};
  if (req.files.photo) files.photo = req.files.photo;
  if (req.files.file) files.file = req.files.file;
  return files;
}

export class BeritaController {
  listBerita = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.listBerita(
        listBeritaQuerySchema.parse(req.query),
        req.user?.roles.some((role) => role.name.toLowerCase() === "admin") ?? false,
      );
      sendSuccess(res, {
        message: "Berhasil mengambil daftar berita",
        data: result.rows,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  };

  getBeritaById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      sendSuccess(res, {
        message: "Berhasil mengambil detail berita",
        data: await service.getBeritaById(req.params.id),
      });
    } catch (err) {
      next(err);
    }
  };

  createBerita = async (
    req: Request<Record<string, string>, unknown, CreateBeritaDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.createBerita(
        req.body,
        beritaFiles(req),
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, { statusCode: 201, message: "Berita berhasil dibuat", data });
    } catch (err) {
      next(err);
    }
  };

  updateBerita = async (
    req: Request<{ id: string }, unknown, UpdateBeritaDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.updateBerita(
        req.params.id,
        req.body,
        beritaFiles(req),
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, { message: "Berita berhasil diupdate", data });
    } catch (err) {
      next(err);
    }
  };

  deleteBerita = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await service.deleteBerita(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Berita berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };

  restoreBerita = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await service.restoreBerita(
        req.params.id,
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, {
        message: "Berita berhasil dipulihkan",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}
