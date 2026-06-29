import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { KategoriPublikasiService } from "./kategoripublikasi.service.js";
import { listKategoriPublikasiQuerySchema } from "./kategoripublikasi.schema.js";
import type { CreateKategoriPublikasiDto, UpdateKategoriPublikasiDto } from "./dto/kategoripublikasi.dto.js";

const service = new KategoriPublikasiService();

function getRequestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

export class KategoriPublikasiController {
  listKategoriPublikasi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.listKategoriPublikasi(listKategoriPublikasiQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil daftar kategori", data: result.rows, meta: result.meta });
    } catch (err) {
      next(err);
    }
  };

  getKategoriPublikasiById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await service.getKategoriPublikasiById(req.params.id);
      sendSuccess(res, { message: "Berhasil mengambil detail kategori", data });
    } catch (err) {
      next(err);
    }
  };

  createKategoriPublikasi = async (
    req: Request<Record<string, string>, unknown, CreateKategoriPublikasiDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.createKategoriPublikasi(req.body, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { statusCode: 201, message: "Kategori publikasi berhasil dibuat", data });
    } catch (err) {
      next(err);
    }
  };

  updateKategoriPublikasi = async (
    req: Request<{ id: string }, unknown, UpdateKategoriPublikasiDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.updateKategoriPublikasi(req.params.id, req.body, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Kategori publikasi berhasil diperbarui", data });
    } catch (err) {
      next(err);
    }
  };

  deleteKategoriPublikasi = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.deleteKategoriPublikasi(req.params.id, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Kategori publikasi berhasil dihapus", data: null });
    } catch (err) {
      next(err);
    }
  };
}
