import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { penelitianProposalService } from "./penelitian-proposal.service.js";
import type { PenelitianProposalBodySchema } from "./penelitian-proposal.schema.js";

function getRequestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

export class PenelitianProposalController {
  getPenelitian = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const substansi = await penelitianProposalService.getPenelitianByProposalId(req.params.id, requireAuthenticatedUser(req));
      sendSuccess(res, { message: "Berhasil mengambil substansi penelitian.", data: substansi });
    } catch (err) {
      next(err);
    }
  };

  upsertPenelitian = async (
    req: Request<{ id: string }, unknown, PenelitianProposalBodySchema>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const record = await penelitianProposalService.upsertPenelitian(
        req.params.id,
        req.body,
        requireAuthenticatedUser(req),
        getRequestId(req),
      );
      sendSuccess(res, { message: "Substansi penelitian berhasil disimpan.", data: record });
    } catch (err) {
      next(err);
    }
  };
}
