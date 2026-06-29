import type { Request, Response, NextFunction } from "express";
import { ProdiService } from "./prodi.service.js";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { listProdiQuerySchema } from "./prodi.schema.js";
import type {
  CreateProdiDto,
  UpdateProdiDto,
} from "./dto/prodi.dto.js";

const service = new ProdiService();

function requestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

export class ProdiController {
  getAll = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await service.findAll(listProdiQuerySchema.parse(req.query));
      sendSuccess(res, {
        message: "Data prodi berhasil diambil",
        data: result.rows,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  };

  getById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await service.findById(req.params.id);
      sendSuccess(res, {
        message: "Detail prodi berhasil diambil",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  create = async (
    req: Request<Record<string, string>, unknown, CreateProdiDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await service.create(
        req.body,
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, {
        statusCode: 201,
        message: "Prodi berhasil ditambahkan",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  update = async (
    req: Request<{ id: string }, unknown, UpdateProdiDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await service.update(
        req.params.id,
        req.body,
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, {
        message: "Prodi berhasil diperbarui",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  delete = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await service.delete(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Prodi berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };

  options = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      sendSuccess(res, {
        message: "Data prodi berhasil diambil",
        data: await service.findOptions(),
      });
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
        message: "Prodi berhasil dipulihkan",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}
