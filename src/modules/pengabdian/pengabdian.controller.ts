import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { TIPE_USULAN_PENGABDIAN } from "../proposal/proposal.helpers.js";
import { proposalService } from "../proposal/proposal.service.js";
import {
  proposalByProdiQuerySchema,
  proposalListQuerySchema,
  proposalSearchBodySchema,
  publicLandingQuerySchema,
} from "../proposal/proposal.schema.js";
import type { CreateProposalBodyDto, UpdateProposalBodyDto } from "../proposal/dto/proposal.dto.js";

function getRequestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

export class PengabdianController {
  listUserPengabdianProposals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await proposalService.listUserWorkflowProposals(
        TIPE_USULAN_PENGABDIAN,
        requireAuthenticatedUser(req),
        proposalListQuerySchema.parse(req.query),
      );
      sendSuccess(res, { message: "Berhasil mengambil daftar usulan pengabdian", data });
    } catch (err) {
      next(err);
    }
  };

  createUsulanPengabdian = async (
    req: Request<Record<string, string>, unknown, CreateProposalBodyDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await proposalService.createWorkflowProposal(
        TIPE_USULAN_PENGABDIAN,
        req.body,
        requireAuthenticatedUser(req),
        { requestId: getRequestId(req) },
      );
      sendSuccess(res, { statusCode: 201, message: "Berhasil membuat usulan pengabdian", data: result });
    } catch (err) {
      next(err);
    }
  };

  updateUsulanPengabdian = async (
    req: Request<{ id: string }, unknown, UpdateProposalBodyDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await proposalService.updateWorkflowProposal(
        TIPE_USULAN_PENGABDIAN,
        req.params.id,
        req.body,
        requireAuthenticatedUser(req),
        { requestId: getRequestId(req) },
      );
      sendSuccess(res, { message: "Usulan pengabdian berhasil diupdate", data: result });
    } catch (err) {
      next(err);
    }
  };

  getDetailUsulanPengabdian = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await proposalService.getDetailWorkflowProposal(
        TIPE_USULAN_PENGABDIAN,
        req.params.id,
        requireAuthenticatedUser(req),
      );
      sendSuccess(res, { message: "Berhasil mengambil detail usulan pengabdian", data: result });
    } catch (err) {
      next(err);
    }
  };

  deleteUsulanPengabdian = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      await proposalService.deleteWorkflowProposal(
        TIPE_USULAN_PENGABDIAN,
        req.params.id,
        requireAuthenticatedUser(req),
        { requestId: getRequestId(req) },
      );
      sendSuccess(res, { message: "Usulan pengabdian berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  };

  searchUsulanPengabdian = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await proposalService.searchWorkflowProposals(
        TIPE_USULAN_PENGABDIAN,
        proposalSearchBodySchema.parse(req.body),
        requireAuthenticatedUser(req),
      );
      sendSuccess(res, { message: "Berhasil mencari usulan pengabdian", data: result });
    } catch (err) {
      next(err);
    }
  };

  getDropdownOptions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const options = await proposalService.getDropdownOptions();
      sendSuccess(res, { message: "Berhasil mengambil dropdown options", data: options });
    } catch (err) {
      next(err);
    }
  };

  submitUsulanPengabdian = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await proposalService.submitWorkflowProposal(
        TIPE_USULAN_PENGABDIAN,
        req.params.id,
        requireAuthenticatedUser(req),
        { requestId: getRequestId(req) },
      );
      sendSuccess(res, { message: "Usulan pengabdian berhasil disubmit", data: result });
    } catch (err) {
      next(err);
    }
  };

  listUsulanByProdi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await proposalService.listUsulanByProdi(
        TIPE_USULAN_PENGABDIAN,
        proposalByProdiQuerySchema.parse(req.query),
        requireAuthenticatedUser(req),
      );
      sendSuccess(res, { message: "Berhasil mengambil daftar usulan pengabdian berdasarkan prodi", data: result });
    } catch (err) {
      next(err);
    }
  };

  forwardUsulanPengabdian = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await proposalService.forwardWorkflowProposal(
        TIPE_USULAN_PENGABDIAN,
        req.params.id,
        requireAuthenticatedUser(req),
        { requestId: getRequestId(req) },
      );
      sendSuccess(res, { message: "Usulan pengabdian berhasil diajukan sebagai Hibah Internal", data: result });
    } catch (err) {
      next(err);
    }
  };

  listPublicPengabdian = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { data, meta } = await proposalService.listPublicWorkflow(TIPE_USULAN_PENGABDIAN, publicLandingQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil daftar pengabdian", data, meta });
    } catch (err) {
      next(err);
    }
  };
}
