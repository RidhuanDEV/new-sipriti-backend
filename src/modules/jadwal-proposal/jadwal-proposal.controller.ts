import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { jadwalProposalService } from "./jadwal-proposal.service.js";
import type { JadwalBodySchema, JadwalItemSchema } from "./jadwal-proposal.schema.js";

function getRequestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

function normalizeItems(body: JadwalBodySchema): JadwalItemSchema[] {
  return Array.isArray(body) ? body : body.items;
}

export class JadwalProposalController {
  getJadwal = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await jadwalProposalService.getJadwalByProposalId(req.params.id, requireAuthenticatedUser(req));
      sendSuccess(res, { message: "Berhasil mengambil jadwal proposal.", data: items });
    } catch (err) {
      next(err);
    }
  };

  bulkUpsertJadwal = async (
    req: Request<{ id: string }, unknown, JadwalBodySchema>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const records = await jadwalProposalService.bulkUpsertJadwal(
        req.params.id,
        normalizeItems(req.body),
        requireAuthenticatedUser(req),
        getRequestId(req),
      );
      sendSuccess(res, { message: "Jadwal proposal berhasil disimpan.", data: records });
    } catch (err) {
      next(err);
    }
  };
}
