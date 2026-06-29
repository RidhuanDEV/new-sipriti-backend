import type { Request, Response, NextFunction } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { TahunAkademikService } from "./tahunakademik.service.js";
import { listTahunAkademikQuerySchema } from "./tahunakademik.schema.js";
import type { CreateTahunAkademikDto, UpdateTahunAkademikDto } from "./dto/tahunakademik.dto.js";

const service = new TahunAkademikService();
const requestId = (req: Request): string | undefined => {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
};

export class TahunAkademikController {
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.findAll(listTahunAkademikQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil daftar tahun akademik", data: result.rows, meta: result.meta });
    } catch (err) {
      next(err);
    }
  };

  all = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Berhasil mengambil semua tahun akademik", data: await service.findAllUnpaginated() });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Berhasil mengambil detail tahun akademik", data: await service.findById(req.params.id) });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request<Record<string, string>, unknown, CreateTahunAkademikDto>, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { statusCode: 201, message: "Tahun akademik berhasil dibuat", data: await service.create(req.body, requireAuthenticatedUser(req), requestId(req)) });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request<{ id: string }, unknown, UpdateTahunAkademikDto>, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Tahun akademik berhasil diperbarui", data: await service.update(req.params.id, req.body, requireAuthenticatedUser(req), requestId(req)) });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.delete(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Tahun akademik berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };
}
