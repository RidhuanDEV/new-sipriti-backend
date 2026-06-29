import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { publicPageListQuerySchema } from "./publicpage.schema.js";
import { PublicpageService } from "./publicpage.service.js";

const service = new PublicpageService();

export class PublicpageController {
  listBerita = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.listBerita(publicPageListQuerySchema.parse(req.query));
      sendSuccess(res, {
        message: "Berhasil mengambil daftar berita publik",
        data: result.rows,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  };

  getBeritaBySlug = async (
    req: Request<{ slug: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      sendSuccess(res, {
        message: "Berhasil mengambil detail berita publik",
        data: await service.getBeritaBySlug(req.params.slug),
      });
    } catch (err) {
      next(err);
    }
  };

  listPengumuman = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.listPengumuman(publicPageListQuerySchema.parse(req.query));
      sendSuccess(res, {
        message: "Berhasil mengambil daftar pengumuman publik",
        data: result.rows,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  };

  getPengumumanBySlug = async (
    req: Request<{ slug: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      sendSuccess(res, {
        message: "Berhasil mengambil detail pengumuman publik",
        data: await service.getPengumumanBySlug(req.params.slug),
      });
    } catch (err) {
      next(err);
    }
  };

  listPanduan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.listPanduan(publicPageListQuerySchema.parse(req.query));
      sendSuccess(res, {
        message: "Berhasil mengambil daftar panduan publik",
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
        message: "Berhasil mengambil detail panduan publik",
        data: await service.getPanduanById(req.params.id),
      });
    } catch (err) {
      next(err);
    }
  };
}
