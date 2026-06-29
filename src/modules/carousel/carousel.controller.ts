import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { CarouselService } from "./carousel.service.js";
import { listCarouselAdminQuerySchema, listCarouselQuerySchema } from "./carousel.schema.js";
import type { CreateCarouselDto, UpdateCarouselDto } from "./dto/carousel.dto.js";

const service = new CarouselService();

function getRequestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

export class CarouselController {
  listCarousel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await service.listCarousel(listCarouselQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil daftar carousel", data });
    } catch (err) {
      next(err);
    }
  };

  listCarouselAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.listCarouselAdmin(listCarouselAdminQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil daftar carousel", data: result.rows, meta: result.meta });
    } catch (err) {
      next(err);
    }
  };

  getCarouselById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await service.getCarouselById(req.params.id);
      sendSuccess(res, { message: "Berhasil mengambil detail carousel", data });
    } catch (err) {
      next(err);
    }
  };

  createCarousel = async (
    req: Request<Record<string, string>, unknown, CreateCarouselDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.createCarousel(req.body, req.file, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { statusCode: 201, message: "Berhasil membuat carousel baru", data });
    } catch (err) {
      next(err);
    }
  };

  updateCarousel = async (
    req: Request<{ id: string }, unknown, UpdateCarouselDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.updateCarousel(req.params.id, req.body, req.file, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Berhasil mengupdate carousel", data });
    } catch (err) {
      next(err);
    }
  };

  deleteCarousel = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.deleteCarousel(req.params.id, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Berhasil menghapus carousel" });
    } catch (err) {
      next(err);
    }
  };

  restoreCarousel = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await service.restoreCarousel(req.params.id, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Carousel berhasil dipulihkan", data });
    } catch (err) {
      next(err);
    }
  };
}
