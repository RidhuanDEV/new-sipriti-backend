import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { pengabdianProposalService } from "./pengabdian-proposal.service.js";
import type { PengabdianProposalBodySchema } from "./pengabdian-proposal.schema.js";

function getRequestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

export class PengabdianProposalController {
  getPengabdian = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const substansi = await pengabdianProposalService.getPengabdianByProposalId(req.params.id, requireAuthenticatedUser(req));
      sendSuccess(res, { message: "Berhasil mengambil substansi pengabdian.", data: substansi });
    } catch (err) {
      next(err);
    }
  };

  upsertPengabdian = async (
    req: Request<{ id: string }, unknown, PengabdianProposalBodySchema>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const record = await pengabdianProposalService.upsertPengabdian(
        req.params.id,
        req.body,
        requireAuthenticatedUser(req),
        getRequestId(req),
      );
      sendSuccess(res, { message: "Substansi pengabdian berhasil disimpan.", data: record });
    } catch (err) {
      next(err);
    }
  };
}
