import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import {
  createMonevInternalSchema,
  monevInternalIdParamSchema,
  monevListQuerySchema,
  monevUsulanOptionsQuerySchema,
  updateMonevInternalSchema,
} from "./monev-internal.schema.js";
import { monevInternalService } from "./monev-internal.service.js";

function requestId(req: Request): string | undefined {
  return monevInternalService.requestIdFromHeaders(req.headers);
}

export class MonevInternalController {
  getAllMonev = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await monevInternalService.getAllMonev(monevListQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Data monev berhasil diambil", data: result.data, meta: result.meta });
    } catch (err) {
      next(err);
    }
  };

  getMonevById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = monevInternalIdParamSchema.parse(req.params);
      const data = await monevInternalService.getMonevById(params.id);
      sendSuccess(res, { message: "Detail monev berhasil diambil", data });
    } catch (err) {
      next(err);
    }
  };

  createMonev = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await monevInternalService.createMonev(
        createMonevInternalSchema.parse(req.body),
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, { statusCode: 201, message: "Jadwal monev berhasil dibuat", data });
    } catch (err) {
      next(err);
    }
  };

  updateMonev = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = monevInternalIdParamSchema.parse(req.params);
      const data = await monevInternalService.updateMonev(
        params.id,
        updateMonevInternalSchema.parse(req.body),
        requireAuthenticatedUser(req),
        requestId(req),
      );
      sendSuccess(res, { message: "Jadwal monev berhasil diperbarui", data });
    } catch (err) {
      next(err);
    }
  };

  deleteMonev = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = monevInternalIdParamSchema.parse(req.params);
      await monevInternalService.deleteMonev(params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Monev berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };

  uploadMonevDocuments = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = monevInternalIdParamSchema.parse(req.params);
      const data = await monevInternalService.uploadMonevDocuments(params.id, req.files, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Dokumen monev berhasil diupload", data });
    } catch (err) {
      next(err);
    }
  };

  getUsulanOptionsForMonev = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await monevInternalService.getUsulanOptionsForMonev(monevUsulanOptionsQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Data usulan berhasil diambil", data });
    } catch (err) {
      next(err);
    }
  };

  restoreMonev = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = monevInternalIdParamSchema.parse(req.params);
      const data = await monevInternalService.restoreMonev(params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Monev berhasil dipulihkan", data });
    } catch (err) {
      next(err);
    }
  };
}
