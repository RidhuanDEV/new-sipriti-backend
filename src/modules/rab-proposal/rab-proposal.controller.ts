import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { rabProposalService } from "./rab-proposal.service.js";
import type { RabBodySchema, RabItemSchema } from "./rab-proposal.schema.js";

function getRequestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

function normalizeItems(body: RabBodySchema): RabItemSchema[] {
  return Array.isArray(body) ? body : body.items;
}

export class RabProposalController {
  getRab = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await rabProposalService.getRabByProposalId(req.params.id, requireAuthenticatedUser(req));
      sendSuccess(res, { message: "Berhasil mengambil data RAB", data });
    } catch (err) {
      next(err);
    }
  };

  upsertRab = async (
    req: Request<{ id: string }, unknown, RabBodySchema>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await rabProposalService.bulkUpsertRab(
        req.params.id,
        normalizeItems(req.body),
        requireAuthenticatedUser(req),
        getRequestId(req),
      );
      sendSuccess(res, { message: "Berhasil menyimpan data RAB", data });
    } catch (err) {
      next(err);
    }
  };
}
