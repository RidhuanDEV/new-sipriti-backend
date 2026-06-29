import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { hkiService } from "./hki.service.js";
import {
  approveHkiSchema,
  createHkiSchema,
  hkiDetailQuerySchema,
  hkiIdParamSchema,
  hkiReviewQuerySchema,
  rejectHkiSchema,
  updateHkiSchema,
} from "./hki.schema.js";

function requestId(req: Request): string | undefined {
  return hkiService.requestIdFromHeaders(req.headers);
}

export class HkiController {
  listUserHKI = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await hkiService.listUserHKI(requireAuthenticatedUser(req).id);
      sendSuccess(res, { message: "Berhasil mengambil daftar HKI", data });
    } catch (err) {
      next(err);
    }
  };

  getHKIDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = hkiDetailQuerySchema.parse(req.query);
      const data = await hkiService.getHKIDetail(id, requireAuthenticatedUser(req).id);
      sendSuccess(res, { message: "Berhasil mengambil detail HKI", data });
    } catch (err) {
      next(err);
    }
  };

  createHKI = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await hkiService.createHKI({
        user: requireAuthenticatedUser(req),
        body: createHkiSchema.parse(req.body),
        files: req.files,
        requestId: requestId(req),
      });
      sendSuccess(res, { statusCode: 201, message: "Berhasil membuat data HKI", data });
    } catch (err) {
      next(err);
    }
  };

  updateHKI = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = hkiIdParamSchema.parse(req.params);
      const data = await hkiService.updateHKI({
        id: params.id,
        user: requireAuthenticatedUser(req),
        body: updateHkiSchema.parse(req.body),
        files: req.files,
        requestId: requestId(req),
      });
      sendSuccess(res, { message: "Berhasil memperbarui data HKI", data });
    } catch (err) {
      next(err);
    }
  };

  deleteHKI = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = hkiIdParamSchema.parse(req.params);
      await hkiService.deleteHKI(params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Berhasil menghapus data HKI" });
    } catch (err) {
      next(err);
    }
  };

  submitHKI = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = hkiIdParamSchema.parse(req.params);
      const data = await hkiService.submitHKI(params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Berhasil mengajukan HKI", data });
    } catch (err) {
      next(err);
    }
  };

  getHKIForReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await hkiService.getHKIForReview(hkiReviewQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil daftar HKI untuk review", data });
    } catch (err) {
      next(err);
    }
  };

  getHKIDetailForReview = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = hkiIdParamSchema.parse(req.params);
      const data = await hkiService.getHKIDetailForReview(params.id);
      sendSuccess(res, { message: "Berhasil mengambil detail HKI", data });
    } catch (err) {
      next(err);
    }
  };

  approveHKI = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = hkiIdParamSchema.parse(req.params);
      const body = approveHkiSchema.parse(req.body);
      const data = await hkiService.approveHKI(params.id, requireAuthenticatedUser(req), body.catatan, requestId(req));
      sendSuccess(res, { message: "HKI berhasil disetujui", data });
    } catch (err) {
      next(err);
    }
  };

  rejectHKI = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = hkiIdParamSchema.parse(req.params);
      const body = rejectHkiSchema.parse(req.body);
      const data = await hkiService.rejectHKI(params.id, requireAuthenticatedUser(req), body.catatan, requestId(req));
      sendSuccess(res, { message: "HKI berhasil ditolak", data });
    } catch (err) {
      next(err);
    }
  };

  getHKIReviewStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await hkiService.getHKIReviewStats();
      sendSuccess(res, { message: "Berhasil mengambil statistik HKI", data });
    } catch (err) {
      next(err);
    }
  };

  getAllHKI = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await hkiService.getAllHKI(hkiReviewQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil semua data HKI", data });
    } catch (err) {
      next(err);
    }
  };

  restoreHKI = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = hkiIdParamSchema.parse(req.params);
      const data = await hkiService.restoreHKI(params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "HKI berhasil dipulihkan", data });
    } catch (err) {
      next(err);
    }
  };
}
