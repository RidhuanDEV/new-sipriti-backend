import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { addMemberSchema, addRABSchema, proposalIdParamSchema } from "./monevproposal.schema.js";
import { monevProposalService } from "./monevproposal.service.js";

export class MonevProposalController {
  getMonevProposal = async (req: Request<{ proposalId: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = proposalIdParamSchema.parse(req.params);
      const data = await monevProposalService.getMonevProposal(params.proposalId);
      sendSuccess(res, { message: "Berhasil mengambil detail proposal", data });
    } catch (err) {
      next(err);
    }
  };

  listMonevProposals = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await monevProposalService.listMonevProposals();
      sendSuccess(res, { message: "Berhasil mengambil daftar proposal", data });
    } catch (err) {
      next(err);
    }
  };

  addMember = async (req: Request<{ proposalId: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = proposalIdParamSchema.parse(req.params);
      const body = addMemberSchema.parse(req.body);
      const data = await monevProposalService.addMember(params.proposalId, body, requireAuthenticatedUser(req).id);
      sendSuccess(res, { statusCode: 201, message: "Anggota berhasil ditambahkan", data });
    } catch (err) {
      next(err);
    }
  };

  addRAB = async (req: Request<{ proposalId: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = proposalIdParamSchema.parse(req.params);
      const body = addRABSchema.parse(req.body);
      const data = await monevProposalService.addRAB(params.proposalId, body);
      sendSuccess(res, { statusCode: 201, message: "RAB berhasil ditambahkan", data });
    } catch (err) {
      next(err);
    }
  };

  decommissioned = (message: string) => (_req: Request, res: Response): void => {
    res.status(410).json({
      status: "error",
      code: "ENDPOINT_DECOMMISSIONED",
      message,
      errors: [],
    });
  };
}
