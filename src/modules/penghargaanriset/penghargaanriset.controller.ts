import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { PenghargaanRisetService } from "./penghargaanriset.service.js";
import { listPenghargaanRisetQuerySchema } from "./penghargaanriset.schema.js";
import type { CreatePenghargaanRisetDto, UpdatePenghargaanRisetDto } from "./dto/penghargaanriset.dto.js";

const service = new PenghargaanRisetService();

function getRequestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

export class PenghargaanRisetController {
  getAllPenghargaanRiset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.getAllPenghargaanRiset(listPenghargaanRisetQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil data penghargaan riset", data: result.rows, meta: result.meta });
    } catch (err) {
      next(err);
    }
  };

  getAllPenghargaanRisetNoPagination = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await service.getAllPenghargaanRisetNoPagination();
      sendSuccess(res, { message: "Berhasil mengambil semua penghargaan riset", data });
    } catch (err) {
      next(err);
    }
  };

  getPenghargaanRiset = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await service.getPenghargaanRiset(Number(req.params.id));
      sendSuccess(res, { message: "Berhasil mengambil penghargaan riset", data });
    } catch (err) {
      next(err);
    }
  };

  createPenghargaanRiset = async (
    req: Request<Record<string, string>, unknown, CreatePenghargaanRisetDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.createPenghargaanRiset(req.body, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { statusCode: 201, message: "Penghargaan riset berhasil dibuat", data });
    } catch (err) {
      next(err);
    }
  };

  updatePenghargaanRiset = async (
    req: Request<{ id: string }, unknown, UpdatePenghargaanRisetDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.updatePenghargaanRiset(Number(req.params.id), req.body, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Penghargaan riset berhasil diperbarui", data });
    } catch (err) {
      next(err);
    }
  };

  deletePenghargaanRiset = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.deletePenghargaanRiset(Number(req.params.id), requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Penghargaan riset berhasil dihapus", data: null });
    } catch (err) {
      next(err);
    }
  };
}
