import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { laporanUsulanService } from "./laporan-usulan.service.js";
import {
  createLaporanBodySchema,
  laporanListQuerySchema,
  updateLaporanBodySchema,
  validateLaporanBodySchema,
} from "./laporan-usulan.schema.js";

function requestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

export class LaporanUsulanController {
  listLaporanUsulan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { data, pagination } = await laporanUsulanService.listLaporanUsulan({
        query: laporanListQuerySchema.parse(req.query),
        user: requireAuthenticatedUser(req),
      });
      sendSuccess(res, { message: "Berhasil mengambil daftar laporan", data, meta: { pagination } });
    } catch (err) {
      next(err);
    }
  };

  createLaporanUsulan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await laporanUsulanService.createLaporanUsulan({
        body: createLaporanBodySchema.parse(req.body),
        file: req.file,
        user: requireAuthenticatedUser(req),
        requestId: requestId(req),
      });
      sendSuccess(res, { statusCode: 201, message: "Laporan berhasil dibuat", data });
    } catch (err) {
      next(err);
    }
  };

  updateLaporanUsulan = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await laporanUsulanService.updateLaporanUsulan({
        id: req.params.id,
        body: updateLaporanBodySchema.parse(req.body),
        file: req.file,
        user: requireAuthenticatedUser(req),
        requestId: requestId(req),
      });
      sendSuccess(res, { message: "Laporan berhasil diperbarui", data });
    } catch (err) {
      next(err);
    }
  };

  validateLaporanUsulan = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await laporanUsulanService.validateLaporanUsulan({
        id: req.params.id,
        body: validateLaporanBodySchema.parse(req.body),
        user: requireAuthenticatedUser(req),
        requestId: requestId(req),
      });
      sendSuccess(res, { message: "Laporan berhasil divalidasi", data });
    } catch (err) {
      next(err);
    }
  };

  getLaporanDetail = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await laporanUsulanService.getLaporanDetail(req.params.id, requireAuthenticatedUser(req));
      sendSuccess(res, { message: "Berhasil mengambil detail laporan", data });
    } catch (err) {
      next(err);
    }
  };
}
