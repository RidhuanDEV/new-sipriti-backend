import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { proposalReviewService } from "./proposal-review.service.js";
import { approveProposalSchema, rejectProposalSchema, reviewListQuerySchema, reviewTypeSchema } from "./proposal-review.schema.js";

function requestId(req: Request): string | undefined {
  return proposalReviewService.getRequestId(req.headers);
}

export class ProposalReviewController {
  getProposalsForReview = async (req: Request<{ type: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const type = reviewTypeSchema.parse(req.params.type);
      const { proposals, meta } = await proposalReviewService.getProposalsForReview(type, reviewListQuerySchema.parse(req.query), requireAuthenticatedUser(req));
      sendSuccess(res, { message: `Daftar usulan ${type} berhasil diambil`, data: proposals, meta });
    } catch (err) {
      next(err);
    }
  };

  getProposalDetailForReview = async (req: Request<{ type: string; id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const type = reviewTypeSchema.parse(req.params.type);
      const detail = await proposalReviewService.getProposalDetailForReview(type, req.params.id, requireAuthenticatedUser(req));
      sendSuccess(res, { message: "Detail proposal berhasil diambil", data: detail });
    } catch (err) {
      next(err);
    }
  };

  approveProposal = async (req: Request<{ type: string; id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = approveProposalSchema.parse(req.body);
      const result = await proposalReviewService.approveProposal(req.params.id, body.catatan, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Proposal berhasil disetujui", data: result });
    } catch (err) {
      next(err);
    }
  };

  declineProposal = async (req: Request<{ type: string; id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = rejectProposalSchema.parse(req.body);
      const result = await proposalReviewService.declineProposal(req.params.id, body.catatan, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Proposal dikembalikan untuk revisi", data: result });
    } catch (err) {
      next(err);
    }
  };

  getUserRevisionProposals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { proposals, pagination } = await proposalReviewService.getUserRevisionProposals(requireAuthenticatedUser(req).nidn, reviewListQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Daftar perbaikan usulan berhasil diambil", data: proposals, meta: { pagination } });
    } catch (err) {
      next(err);
    }
  };

  resubmitProposal = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await proposalReviewService.resubmitProposal(req.params.id, requireAuthenticatedUser(req), requestId(req));
      sendSuccess(res, { message: "Status proposal berhasil diubah ke Draf. Silakan lakukan perbaikan dan kirim ulang.", data: result });
    } catch (err) {
      next(err);
    }
  };

  getReviewStats = async (req: Request<{ type: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const type = reviewTypeSchema.parse(req.params.type);
      const stats = await proposalReviewService.getReviewStats(type, reviewListQuerySchema.parse(req.query), requireAuthenticatedUser(req));
      sendSuccess(res, { message: "Statistik review berhasil diambil", data: stats });
    } catch (err) {
      next(err);
    }
  };

  getUserApprovedProposals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { proposals, pagination } = await proposalReviewService.getUserApprovedProposals(requireAuthenticatedUser(req).nidn, reviewListQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Daftar proposal yang disetujui berhasil diambil", data: proposals, meta: { pagination } });
    } catch (err) {
      next(err);
    }
  };
}
