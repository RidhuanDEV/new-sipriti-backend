import type { Request, Response, NextFunction } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { SkemaService } from "./skema.service.js";
import { listSkemaQuerySchema, skemaOptionsQuerySchema } from "./skema.schema.js";
import type { CreateSkemaDto, UpdateSkemaDto } from "./dto/skema.dto.js";

const service = new SkemaService();
const requestId = (req: Request): string | undefined => {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
};

export class SkemaController {
  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.findAll(listSkemaQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Data skema berhasil diambil", data: result.rows, meta: result.meta });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Detail skema berhasil diambil", data: await service.findById(req.params.id) });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request<Record<string, string>, unknown, CreateSkemaDto>, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { statusCode: 201, message: "Skema berhasil ditambahkan", data: await service.create(req.body, requireAuthenticatedUser(req), requestId(req)) });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request<{ id: string }, unknown, UpdateSkemaDto>, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Skema berhasil diperbarui", data: await service.update(req.params.id, req.body, requireAuthenticatedUser(req), requestId(req)) });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.delete(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Skema berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };

  options = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Data skema berhasil diambil", data: await service.findOptions(skemaOptionsQuerySchema.parse(req.query)) });
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
        message: "Skema berhasil dipulihkan",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}
