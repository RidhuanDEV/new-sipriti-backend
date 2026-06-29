import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { MitraKerjaRisetService } from "./mitrakerjariset.service.js";
import { listMitraKerjaRisetQuerySchema } from "./mitrakerjariset.schema.js";
import type { CreateMitraKerjaRisetDto, UpdateMitraKerjaRisetDto } from "./dto/mitrakerjariset.dto.js";

const service = new MitraKerjaRisetService();

function getRequestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

export class MitraKerjaRisetController {
  listMitraKerjaRiset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.listMitraKerjaRiset(listMitraKerjaRisetQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil daftar mitra kerja riset", data: result.rows, meta: result.meta });
    } catch (err) {
      next(err);
    }
  };

  getAllMitraKerjaRiset = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await service.getAllMitraKerjaRiset();
      sendSuccess(res, { message: "Berhasil mengambil semua mitra kerja riset", data });
    } catch (err) {
      next(err);
    }
  };

  getMitraKerjaRisetById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await service.getMitraKerjaRisetById(req.params.id);
      sendSuccess(res, { message: "Berhasil mengambil detail mitra kerja riset", data });
    } catch (err) {
      next(err);
    }
  };

  createMitraKerjaRiset = async (
    req: Request<Record<string, string>, unknown, CreateMitraKerjaRisetDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.createMitraKerjaRiset(req.body, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { statusCode: 201, message: "Mitra kerja riset berhasil dibuat", data });
    } catch (err) {
      next(err);
    }
  };

  updateMitraKerjaRiset = async (
    req: Request<{ id: string }, unknown, UpdateMitraKerjaRisetDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.updateMitraKerjaRiset(req.params.id, req.body, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Mitra kerja riset berhasil diperbarui", data });
    } catch (err) {
      next(err);
    }
  };

  deleteMitraKerjaRiset = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.deleteMitraKerjaRiset(req.params.id, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Mitra kerja riset berhasil dihapus", data: null });
    } catch (err) {
      next(err);
    }
  };
}
