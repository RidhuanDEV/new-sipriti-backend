import type { Request, Response, NextFunction } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { OutputService } from "./output.service.js";
import { listOutputQuerySchema } from "./output.schema.js";
import type { CreateOutputDto, UpdateOutputDto } from "./dto/output.dto.js";

const service = new OutputService();
const requestId = (req: Request): string | undefined => {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
};

export class OutputController {
  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.findAll(listOutputQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Data output berhasil diambil", data: result.rows, meta: result.meta });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Detail output berhasil diambil", data: await service.findById(req.params.id) });
    } catch (err) {
      next(err);
    }
  };

  options = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Data output berhasil diambil", data: await service.findOptions() });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request<Record<string, string>, unknown, CreateOutputDto>, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { statusCode: 201, message: "Output berhasil ditambahkan", data: await service.create(req.body, requireAuthenticatedUser(req), requestId(req)) });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request<{ id: string }, unknown, UpdateOutputDto>, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Output berhasil diperbarui", data: await service.update(req.params.id, req.body, requireAuthenticatedUser(req), requestId(req)) });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.delete(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Output berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };
}
