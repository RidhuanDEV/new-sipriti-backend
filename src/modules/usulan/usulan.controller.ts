import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { UsulanService } from "./usulan.service.js";
import {
  listUsulanQuerySchema,
  usulanIdParamSchema,
  usulanStatisticsQuerySchema,
} from "./usulan.schema.js";

const service = new UsulanService();

export class UsulanController {
  getAllUsulan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.getAllUsulan(listUsulanQuerySchema.parse(req.query));
      sendSuccess(res, {
        message: "Data usulan berhasil diambil",
        data: result.data,
        meta: { pagination: result.pagination },
      });
    } catch (err) {
      next(err);
    }
  };

  getUsulanById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = usulanIdParamSchema.parse(req.params);
      const data = await service.getUsulanById(params.id);
      sendSuccess(res, {
        message: "Detail usulan berhasil diambil",
        data,
      });
    } catch (err) {
      next(err);
    }
  };

  getUsulanStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await service.getUsulanStatistics(usulanStatisticsQuerySchema.parse(req.query));
      sendSuccess(res, {
        message: "Statistik usulan berhasil diambil",
        data,
      });
    } catch (err) {
      next(err);
    }
  };
}
