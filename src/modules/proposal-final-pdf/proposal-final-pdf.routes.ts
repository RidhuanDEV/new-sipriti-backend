import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { HttpError } from "../../core/errors/http-error.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { ProposalFinalPdfController } from "./proposal-final-pdf.controller.js";
import { finalProposalPdfParamSchema } from "./proposal-final-pdf.schema.js";

const router = Router();
const controller = new ProposalFinalPdfController();

function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  const user = requireAuthenticatedUser(req);
  if (!user.roles.some((role) => role.name.toLowerCase() === "admin")) {
    next(HttpError.forbidden("Akses admin diperlukan"));
    return;
  }
  next();
}

router.get("/user/:id", authenticate, validate({ params: finalProposalPdfParamSchema }), controller.generateUserFinalProposalPdf);
router.get("/admin/:id", authenticate, requireAdmin, validate({ params: finalProposalPdfParamSchema }), controller.generateAdminFinalProposalPdf);

export const path = "/proposal-final-pdf";
export default router;
