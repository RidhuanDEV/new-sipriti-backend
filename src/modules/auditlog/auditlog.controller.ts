import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { auditLogIdParamSchema, auditLogQuerySchema } from "./auditlog.schema.js";
import { auditlogService } from "./auditlog.service.js";

export class AuditlogController {
  getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { logs, pagination } = await auditlogService.getAuditLogs(
        requireAuthenticatedUser(req),
        auditLogQuerySchema.parse(req.query),
      );
      sendSuccess(res, { message: "Berhasil mendapatkan audit logs", data: logs, meta: pagination });
    } catch (err) {
      next(err);
    }
  };

  getAuditLogById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = auditLogIdParamSchema.parse(req.params);
      const data = await auditlogService.getAuditLogById(params.id, requireAuthenticatedUser(req));
      sendSuccess(res, { message: "Berhasil mendapatkan audit log", data });
    } catch (err) {
      next(err);
    }
  };
}
