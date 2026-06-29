import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { PENGABDIAN_PROPOSAL_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { sanitizeRichText } from "../../core/content/sanitize-html.js";
import { HttpError } from "../../core/errors/http-error.js";
import { assertProposalAccess } from "../proposal/policies/proposal.policy.js";
import { validateKataKunci } from "../penelitian-proposal/penelitian-proposal.service.js";
import { PengabdianProposal } from "./pengabdian-proposal.model.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { PengabdianProposalBodySchema } from "./pengabdian-proposal.schema.js";

export class PengabdianProposalService {
  async getPengabdianByProposalId(hakiProposalId: string, user: AuthenticatedUserContext): Promise<PengabdianProposal | null> {
    const proposal = await assertProposalAccess(hakiProposalId, user, {
      requiredPermissions: ["view_proposal", "manage_pengabdian"],
      prodiPermissions: ["view_proposal"],
    });
    if (proposal.tipe_usulan !== "Pengabdian") throw HttpError.badRequest("Proposal ini bukan tipe Pengabdian", [], "VALIDATION_ERROR");
    return PengabdianProposal.findOne({ where: { haki_proposal_id: hakiProposalId } });
  }

  async upsertPengabdian(
    hakiProposalId: string,
    payload: PengabdianProposalBodySchema,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<PengabdianProposal> {
    const proposal = await assertProposalAccess(hakiProposalId, user, {
      requiredPermissions: ["manage_pengabdian"],
      prodiPermissions: ["edit_usulan_by_prodi"],
    });
    if (proposal.tipe_usulan !== "Pengabdian") throw HttpError.badRequest("Proposal ini bukan tipe Pengabdian", [], "VALIDATION_ERROR");
    const kataKunci = validateKataKunci(payload.kata_kunci);
    const sanitizedPayload = {
      tingkat: payload.tingkat ?? null,
      ringkasan: sanitizeRichText(payload.ringkasan ?? null),
      kata_kunci: kataKunci.length > 0 ? kataKunci : null,
      pendahuluan: sanitizeRichText(payload.pendahuluan ?? null),
      permasalahan_dan_solusi: sanitizeRichText(payload.permasalahan_dan_solusi ?? null),
      metode: sanitizeRichText(payload.metode ?? null),
      gambaran_ipteks: sanitizeRichText(payload.gambaran_ipteks ?? null),
      peta_lokasi_mitra_url: payload.peta_lokasi_mitra_url ?? null,
      daftar_pustaka: sanitizeRichText(payload.daftar_pustaka ?? null),
    };
    let oldValue: object | null = null;
    const record = await sequelize.transaction(async (transaction) => {
      const existing = await PengabdianProposal.findOne({ where: { haki_proposal_id: hakiProposalId }, transaction });
      if (existing) {
        oldValue = existing.toJSON();
        return existing.update(sanitizedPayload, { transaction });
      }
      return PengabdianProposal.create({ haki_proposal_id: hakiProposalId, ...sanitizedPayload }, { transaction });
    });
    auditService.persistNonBlocking({
      action: oldValue ? AuditAction.UPDATE : AuditAction.CREATE,
      module: PENGABDIAN_PROPOSAL_MODULE,
      entityId: record.id,
      userId: user.id,
      before: oldValue,
      after: sanitizedPayload,
      requestId,
    });
    return record;
  }
}

export const pengabdianProposalService = new PengabdianProposalService();
