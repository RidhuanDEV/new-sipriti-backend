import type { Request, Response, NextFunction } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { BidangFokusService } from "./bidangfokus.service.js";
import { listBidangFokusQuerySchema } from "./bidangfokus.schema.js";
import type { CreateBidangFokusDto, UpdateBidangFokusDto } from "./dto/bidangfokus.dto.js";

const service = new BidangFokusService();
const requestId = (req: Request): string | undefined => {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
};

export class BidangFokusController {
  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.findAll(listBidangFokusQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Data bidang fokus berhasil diambil", data: result.rows, meta: result.meta });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Detail bidang fokus berhasil diambil", data: await service.findById(req.params.id) });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request<Record<string, string>, unknown, CreateBidangFokusDto>, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { statusCode: 201, message: "Bidang fokus berhasil ditambahkan", data: await service.create(req.body, requireAuthenticatedUser(req), requestId(req)) });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request<{ id: string }, unknown, UpdateBidangFokusDto>, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Bidang fokus berhasil diperbarui", data: await service.update(req.params.id, req.body, requireAuthenticatedUser(req), requestId(req)) });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.delete(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Bidang fokus berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };

  options = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Data bidang fokus berhasil diambil", data: await service.findOptions() });
    } catch (err) {
      next(err);
    }
  };

  restore = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await service.restore(
        req.params.id,
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, {
        message: "Bidang fokus berhasil dipulihkan",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}
