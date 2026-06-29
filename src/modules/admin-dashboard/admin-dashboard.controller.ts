import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { adminDashboardQuerySchema } from "./admin-dashboard.schema.js";
import { adminDashboardService } from "./admin-dashboard.service.js";

export class AdminDashboardController {
  getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await adminDashboardService.getDashboardStats(adminDashboardQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil statistik dashboard", data });
    } catch (err) {
      next(err);
    }
  };

  getSkemaStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await adminDashboardService.getSkemaStats(adminDashboardQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil statistik skema", data });
    } catch (err) {
      next(err);
    }
  };

  getProdiStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await adminDashboardService.getProdiStats(adminDashboardQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil statistik per prodi", data });
    } catch (err) {
      next(err);
    }
  };

  getRecentActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await adminDashboardService.getRecentActivity(adminDashboardQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil aktivitas terbaru", data });
    } catch (err) {
      next(err);
    }
  };

  getTahunOptions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await adminDashboardService.getTahunOptions();
      sendSuccess(res, { message: "Berhasil mengambil opsi tahun", data });
    } catch (err) {
      next(err);
    }
  };
}
