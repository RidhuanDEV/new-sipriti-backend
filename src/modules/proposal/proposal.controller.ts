import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { proposalService } from "./proposal.service.js";
import type { AdminReviewSchema, InviteMemberSchema, RespondInviteSchema } from "./types-internal.js";

function getRequestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

function firstUploadedFile(req: Request): Express.Multer.File | undefined {
  if (req.file) return req.file;
  if (!req.files) return undefined;
  if (Array.isArray(req.files)) return req.files[0];
  return Object.values(req.files).flat()[0];
}

export class ProposalController {
  createProposal = async (
    req: Request<Record<string, string>, unknown, { judul: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const proposal = await proposalService.createBaseProposal(
        req.body.judul,
        firstUploadedFile(req),
        requireAuthenticatedUser(req),
        { requestId: getRequestId(req) },
      );
      sendSuccess(res, { statusCode: 201, message: "Proposal berhasil dibuat", data: proposal });
    } catch (err) {
      next(err);
    }
  };

  inviteMember = async (
    req: Request<{ proposalId: string }, unknown, InviteMemberSchema>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const invite = await proposalService.inviteMember(
        req.params.proposalId,
        req.body.no_identitas,
        req.body.peran,
        requireAuthenticatedUser(req),
        { requestId: getRequestId(req) },
      );
      sendSuccess(res, {
        statusCode: 201,
        message: "Anggota berhasil langsung bergabung ke proposal",
        data: invite,
      });
    } catch (err) {
      next(err);
    }
  };

  respondInvite = async (
    req: Request<{ proposalId: string }, unknown, RespondInviteSchema>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const invite = await proposalService.respondInvite(
        req.params.proposalId,
        req.body.status_invite,
        requireAuthenticatedUser(req),
        { requestId: getRequestId(req) },
      );
      sendSuccess(res, {
        message: "Keikutsertaan anggota berhasil dipastikan aktif",
        data: invite,
      });
    } catch (err) {
      next(err);
    }
  };

  getMyInvites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invites = await proposalService.getMyInvites(requireAuthenticatedUser(req));
      sendSuccess(res, { message: "Berhasil mengambil daftar anggota aktif", data: invites });
    } catch (err) {
      next(err);
    }
  };

  adminReviewProposal = async (
    req: Request<{ proposalId: string }, unknown, AdminReviewSchema>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const proposal = await proposalService.adminReviewProposal(
        req.params.proposalId,
        req.body.status_usulan,
        requireAuthenticatedUser(req),
        { requestId: getRequestId(req) },
      );
      sendSuccess(res, { message: "Review berhasil disimpan", data: proposal });
    } catch (err) {
      next(err);
    }
  };
}
