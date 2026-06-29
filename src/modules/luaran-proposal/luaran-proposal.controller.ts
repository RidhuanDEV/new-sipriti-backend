import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { luaranProposalService } from "./luaran-proposal.service.js";
import type { LuaranBodySchema, LuaranItemSchema } from "./luaran-proposal.schema.js";

function getRequestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

function normalizeItems(body: LuaranBodySchema): LuaranItemSchema[] {
  return Array.isArray(body) ? body : body.items;
}

export class LuaranProposalController {
  getLuaran = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await luaranProposalService.getLuaranByProposalId(req.params.id, requireAuthenticatedUser(req));
      sendSuccess(res, { message: "Berhasil mengambil luaran proposal.", data: items });
    } catch (err) {
      next(err);
    }
  };

  bulkUpsertLuaran = async (
    req: Request<{ id: string }, unknown, LuaranBodySchema>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const records = await luaranProposalService.bulkUpsertLuaran(
        req.params.id,
        normalizeItems(req.body),
        requireAuthenticatedUser(req),
        getRequestId(req),
      );
      sendSuccess(res, { message: "Luaran proposal berhasil disimpan.", data: records });
    } catch (err) {
      next(err);
    }
  };
}
