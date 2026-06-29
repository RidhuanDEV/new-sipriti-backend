import type { Request, Response, NextFunction } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { SertifikatMutuService } from "./sertifikatmutu.service.js";
import { listSertifikatMutuQuerySchema } from "./sertifikatmutu.schema.js";
import type { CreateSertifikatMutuDto, UpdateSertifikatMutuDto } from "./dto/sertifikatmutu.dto.js";

const service = new SertifikatMutuService();
const requestId = (req: Request): string | undefined => {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
};

export class SertifikatMutuController {
  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.findAll(listSertifikatMutuQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil data sertifikat mutu", data: result.rows, meta: result.meta });
    } catch (err) {
      next(err);
    }
  };

  all = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Berhasil mengambil semua sertifikat mutu", data: await service.findAllUnpaginated() });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Berhasil mengambil sertifikat mutu", data: await service.findById(Number(req.params.id)) });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request<Record<string, string>, unknown, CreateSertifikatMutuDto>, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { statusCode: 201, message: "Sertifikat mutu berhasil dibuat", data: await service.create(req.body, requireAuthenticatedUser(req), requestId(req)) });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request<{ id: string }, unknown, UpdateSertifikatMutuDto>, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Sertifikat mutu berhasil diperbarui", data: await service.update(Number(req.params.id), req.body, requireAuthenticatedUser(req), requestId(req)) });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.delete(Number(req.params.id), requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Sertifikat mutu berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };
}
