import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendNoContent, sendSuccess } from "../../utils/response.js";
import { officialSignaturesService } from "./official-signatures.service.js";
import {
  createOfficialSignatureSchema,
  listOfficialSignatureQuerySchema,
  updateOfficialSignatureSchema,
} from "./official-signatures.schema.js";

function requestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

export class OfficialSignaturesController {
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await officialSignaturesService.list(listOfficialSignatureQuerySchema.parse(req.query), requireAuthenticatedUser(req));
      sendSuccess(res, { message: "Berhasil mengambil daftar signature", data });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await officialSignaturesService.create(createOfficialSignatureSchema.parse(req.body), req.file, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { statusCode: 201, message: "Signature berhasil dibuat", data });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await officialSignaturesService.update(req.params.id, updateOfficialSignatureSchema.parse(req.body), req.file, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Signature berhasil diperbarui", data });
    } catch (err) {
      next(err);
    }
  };

  activate = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await officialSignaturesService.activate(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Signature berhasil diaktifkan", data });
    } catch (err) {
      next(err);
    }
  };

  deactivate = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await officialSignaturesService.deactivate(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Signature berhasil dinonaktifkan", data });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      await officialSignaturesService.delete(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  };

  file = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = await officialSignaturesService.resolveFile(req.params.id, requireAuthenticatedUser(req));
      res.setHeader("Content-Type", file.mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${file.filename.replace(/["\r\n]/g, "_")}"`);
      res.setHeader("Cache-Control", "no-store");
      res.sendFile(file.absolutePath);
    } catch (err) {
      next(err);
    }
  };

  restore = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await officialSignaturesService.restore(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, {
        message: "Signature berhasil dipulihkan",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}
