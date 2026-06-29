import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { LUARAN_PROPOSAL_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { HttpError } from "../../core/errors/http-error.js";
import { assertProposalAccess } from "../proposal/policies/proposal.policy.js";
import { LuaranProposal } from "./luaran-proposal.model.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { LuaranItemSchema } from "./luaran-proposal.schema.js";

function validateLuaranItem(item: LuaranItemSchema, index: number): { luaran: string; target_capaian: string | null; iku_terkait: string | null; target_iku: string | null } {
  if (!item.luaran || item.luaran.trim() === "") {
    throw HttpError.badRequest(`Item luaran ke-${index + 1}: luaran tidak boleh kosong`, [], "VALIDATION_ERROR");
  }
  return {
    luaran: item.luaran.trim(),
    target_capaian: item.target_capaian ? item.target_capaian.trim() : null,
    iku_terkait: item.iku_terkait ? item.iku_terkait.trim() : null,
    target_iku: item.target_iku ? item.target_iku.trim() : null,
  };
}

export class LuaranProposalService {
  async getLuaranByProposalId(hakiProposalId: string, user: AuthenticatedUserContext): Promise<LuaranProposal[]> {
    await assertProposalAccess(hakiProposalId, user, {
      requiredPermissions: ["view_proposal", "manage_penelitian", "view_proposal", "manage_pengabdian"],
      prodiPermissions: ["view_proposal"],
    });
    return LuaranProposal.findAll({ where: { haki_proposal_id: hakiProposalId }, order: [["createdAt", "ASC"]] });
  }

  async bulkUpsertLuaran(hakiProposalId: string, items: LuaranItemSchema[], user: AuthenticatedUserContext, requestId?: string): Promise<LuaranProposal[]> {
    const proposal = await assertProposalAccess(hakiProposalId, user, {
      requiredPermissions: ["manage_penelitian", "manage_pengabdian"],
      prodiPermissions: ["edit_usulan_by_prodi"],
    });
    const validatedItems = items.map((item, index) => validateLuaranItem(item, index));
    const newRecords = await sequelize.transaction(async (transaction) => {
      const oldRecords = await LuaranProposal.findAll({ where: { haki_proposal_id: hakiProposalId }, transaction });
      await LuaranProposal.destroy({ where: { haki_proposal_id: hakiProposalId }, transaction });
      const records =
        validatedItems.length > 0
          ? await LuaranProposal.bulkCreate(
              validatedItems.map((item) => ({ haki_proposal_id: hakiProposalId, ...item })),
              { transaction },
            )
          : [];
      auditService.persistNonBlocking({
        action: AuditAction.UPDATE,
        module: LUARAN_PROPOSAL_MODULE,
        entityId: hakiProposalId,
        userId: user.id,
        before: oldRecords.map((row) => row.toJSON()),
        after: { proposal_judul: proposal.judul, items: validatedItems },
        requestId,
      });
      return records;
    });
    return newRecords;
  }
}

export const luaranProposalService = new LuaranProposalService();
