import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { dashboardPaginationQuerySchema } from "./dashboard.schema.js";
import { dashboardService } from "./dashboard.service.js";

export class DashboardController {
  getUserLatestStatuses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = requireAuthenticatedUser(req);
      const result = await dashboardService.getUserLatestStatuses(
        user.id,
        user.nidn,
        dashboardPaginationQuerySchema.parse(req.query),
      );
      sendSuccess(res, { message: "Berhasil mengambil status usulan", data: result.data, meta: result.meta });
    } catch (err) {
      next(err);
    }
  };

  getUserProposalCounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = requireAuthenticatedUser(req);
      const data = await dashboardService.getUserProposalCounts(user.id, user.nidn);
      sendSuccess(res, { message: "Berhasil mengambil jumlah proposal", data });
    } catch (err) {
      next(err);
    }
  };
}
