import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { proposalFinalPdfService } from "./proposal-final-pdf.service.js";

function requestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

function sendPdf(res: Response, fileName: string, buffer: Buffer): void {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName.replace(/["\r\n]/g, "_")}"`);
  res.setHeader("Content-Length", String(buffer.length));
  res.end(buffer);
}

export class ProposalFinalPdfController {
  generateUserFinalProposalPdf = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await proposalFinalPdfService.generateUserPdf(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendPdf(res, result.fileName, result.buffer);
    } catch (err) {
      next(err);
    }
  };

  generateAdminFinalProposalPdf = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await proposalFinalPdfService.generateAdminPdf(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendPdf(res, result.fileName, result.buffer);
    } catch (err) {
      next(err);
    }
  };
}
