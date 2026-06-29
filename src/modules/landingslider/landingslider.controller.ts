import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { LandingSliderService } from "./landingslider.service.js";
import { listLandingSliderAdminQuerySchema } from "./landingslider.schema.js";
import type { CreateLandingSliderDto, UpdateLandingSliderDto } from "./dto/landingslider.dto.js";

const service = new LandingSliderService();

function getRequestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

export class LandingSliderController {
  listLandingSliderPublic = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await service.listLandingSliderPublic();
      sendSuccess(res, { message: "Berhasil mengambil slider", data });
    } catch (err) {
      next(err);
    }
  };

  listLandingSliderAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.listLandingSliderAdmin(listLandingSliderAdminQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil slider admin", data: result.rows, meta: result.meta });
    } catch (err) {
      next(err);
    }
  };

  getLandingSliderById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await service.getLandingSliderById(req.params.id);
      sendSuccess(res, { message: "Berhasil mengambil detail slider", data });
    } catch (err) {
      next(err);
    }
  };

  createLandingSlider = async (
    req: Request<Record<string, string>, unknown, CreateLandingSliderDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.createLandingSlider(req.body, req.processedImages ?? {}, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { statusCode: 201, message: "Berhasil membuat slider", data });
    } catch (err) {
      next(err);
    }
  };

  updateLandingSlider = async (
    req: Request<{ id: string }, unknown, UpdateLandingSliderDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.updateLandingSlider(req.params.id, req.body, req.processedImages ?? {}, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Berhasil mengupdate slider", data });
    } catch (err) {
      next(err);
    }
  };

  deleteLandingSlider = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.deleteLandingSlider(req.params.id, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Berhasil menghapus slider" });
    } catch (err) {
      next(err);
    }
  };

  restoreLandingSlider = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.restoreLandingSlider(req.params.id, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Berhasil memulihkan slider", data: result });
    } catch (err) {
      next(err);
    }
  };
}
