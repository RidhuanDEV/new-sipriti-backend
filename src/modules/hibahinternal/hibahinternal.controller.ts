import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { HibahInternalService } from "./hibahinternal.service.js";
import { listHibahInternalQuerySchema } from "./hibahinternal.schema.js";
import type { CreateHibahInternalDto, UpdateHibahInternalDto } from "./dto/hibahinternal.dto.js";

const service = new HibahInternalService();

function getRequestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

export class HibahInternalController {
  listHibahInternal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.listHibahInternal(listHibahInternalQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil daftar hibah internal", data: result.rows, meta: result.meta });
    } catch (err) {
      next(err);
    }
  };

  getHibahInternalById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await service.getHibahInternalById(req.params.id);
      sendSuccess(res, { message: "Berhasil mengambil detail hibah internal", data });
    } catch (err) {
      next(err);
    }
  };

  createHibahInternal = async (
    req: Request<Record<string, string>, unknown, CreateHibahInternalDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.createHibahInternal(req.body, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { statusCode: 201, message: "Hibah internal berhasil dibuat", data });
    } catch (err) {
      next(err);
    }
  };

  updateHibahInternal = async (
    req: Request<{ id: string }, unknown, UpdateHibahInternalDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.updateHibahInternal(req.params.id, req.body, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Hibah internal berhasil diupdate", data });
    } catch (err) {
      next(err);
    }
  };

  deleteHibahInternal = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.deleteHibahInternal(req.params.id, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Hibah internal berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };

  restoreHibahInternal = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await service.restoreHibahInternal(req.params.id, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Hibah internal berhasil dipulihkan", data });
    } catch (err) {
      next(err);
    }
  };
}
