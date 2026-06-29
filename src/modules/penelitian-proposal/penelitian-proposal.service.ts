import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { PENELITIAN_PROPOSAL_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { sanitizeRichText } from "../../core/content/sanitize-html.js";
import { HttpError } from "../../core/errors/http-error.js";
import { assertProposalAccess } from "../proposal/policies/proposal.policy.js";
import { PenelitianProposal } from "./penelitian-proposal.model.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { PenelitianProposalBodySchema } from "./penelitian-proposal.schema.js";

export function validateKataKunci(raw: string[] | null | undefined): string[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw HttpError.badRequest("kata_kunci harus berupa array", [], "VALIDATION_ERROR");
  const trimmed = raw.map((item) => item.trim()).filter((item) => item.length > 0);
  const tooLong = trimmed.filter((item) => item.length > 50);
  if (tooLong.length > 0) {
    throw HttpError.badRequest(`Setiap kata kunci maksimal 50 karakter. Item melebihi batas: ${tooLong.join(", ")}`, [], "VALIDATION_ERROR");
  }
  const seen = new Set<string>();
  const deduped = trimmed.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (deduped.length > 5) throw HttpError.badRequest("kata_kunci maksimal 5 item", [], "KATA_KUNCI_LIMIT_EXCEEDED");
  return deduped;
}

export class PenelitianProposalService {
  async getPenelitianByProposalId(hakiProposalId: string, user: AuthenticatedUserContext): Promise<PenelitianProposal | null> {
    const proposal = await assertProposalAccess(hakiProposalId, user, {
      requiredPermissions: ["view_proposal", "manage_penelitian"],
      prodiPermissions: ["view_proposal"],
    });
    if (proposal.tipe_usulan !== "Penelitian") throw HttpError.badRequest("Proposal ini bukan tipe Penelitian", [], "VALIDATION_ERROR");
    return PenelitianProposal.findOne({ where: { haki_proposal_id: hakiProposalId } });
  }

  async upsertPenelitian(
    hakiProposalId: string,
    payload: PenelitianProposalBodySchema,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<PenelitianProposal> {
    const proposal = await assertProposalAccess(hakiProposalId, user, {
      requiredPermissions: ["manage_penelitian"],
      prodiPermissions: ["edit_usulan_by_prodi"],
    });
    if (proposal.tipe_usulan !== "Penelitian") throw HttpError.badRequest("Proposal ini bukan tipe Penelitian", [], "VALIDATION_ERROR");
    const sanitizedPayload = {
      ringkasan: sanitizeRichText(payload.ringkasan ?? null),
      kata_kunci: validateKataKunci(payload.kata_kunci).length > 0 ? validateKataKunci(payload.kata_kunci) : null,
      pendahuluan: sanitizeRichText(payload.pendahuluan ?? null),
      metode: sanitizeRichText(payload.metode ?? null),
      daftar_pustaka: sanitizeRichText(payload.daftar_pustaka ?? null),
    };
    let oldValue: object | null = null;
    const record = await sequelize.transaction(async (transaction) => {
      const existing = await PenelitianProposal.findOne({ where: { haki_proposal_id: hakiProposalId }, transaction });
      if (existing) {
        oldValue = {
          ringkasan: existing.ringkasan,
          kata_kunci: existing.kata_kunci,
          pendahuluan: existing.pendahuluan,
          metode: existing.metode,
          daftar_pustaka: existing.daftar_pustaka,
        };
        return existing.update(sanitizedPayload, { transaction });
      }
      return PenelitianProposal.create({ haki_proposal_id: hakiProposalId, ...sanitizedPayload }, { transaction });
    });
    auditService.persistNonBlocking({
      action: oldValue ? AuditAction.UPDATE : AuditAction.CREATE,
      module: PENELITIAN_PROPOSAL_MODULE,
      entityId: record.id,
      userId: user.id,
      before: oldValue,
      after: sanitizedPayload,
      requestId,
    });
    return record;
  }
}

export const penelitianProposalService = new PenelitianProposalService();
