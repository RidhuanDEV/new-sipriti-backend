import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { RAB_PROPOSAL_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { HttpError } from "../../core/errors/http-error.js";
import { assertProposalAccess } from "../proposal/policies/proposal.policy.js";
import { RABProposal } from "./rab-proposal.model.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { RabItemSchema } from "./rab-proposal.schema.js";

interface ValidatedRabItem {
  tahun_ke: string;
  kelompok: string | null;
  komponen: string | null;
  item: string;
  satuan: string | null;
  biaya_satuan: number;
  volume: number;
  total_biaya: number;
  pajak: number;
}

function parseNumeric(value: string | number | undefined, fallback = 0): number {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function validateRabItem(item: RabItemSchema, index: number): ValidatedRabItem {
  const label = `Item RAB ke-${index + 1}`;
  if (!item.item || String(item.item).trim() === "") {
    throw HttpError.badRequest(`${label}: Uraian belanja tidak boleh kosong`);
  }
  const biayaSatuan = parseNumeric(item.biaya_satuan);
  if (!Number.isFinite(biayaSatuan) || biayaSatuan < 0) {
    throw HttpError.badRequest(`${label}: Biaya satuan harus angka non-negatif`);
  }
  const volume = parseNumeric(item.volume);
  if (!Number.isFinite(volume) || volume <= 0) {
    throw HttpError.badRequest(`${label}: Volume harus angka positif`);
  }
  const pajak = parseNumeric(item.pajak, 0);
  if (pajak < 0) throw HttpError.badRequest(`${label}: Pajak tidak boleh negatif`);
  const totalBiaya = biayaSatuan * volume - pajak;
  if (totalBiaya < 0) throw HttpError.badRequest(`${label}: Jumlah dibayarkan tidak boleh negatif`);
  return {
    tahun_ke: String(item.tahun_ke ?? "1"),
    kelompok: item.kelompok ?? null,
    komponen: item.komponen ?? null,
    item: String(item.item).trim(),
    satuan: item.satuan ?? null,
    biaya_satuan: biayaSatuan,
    volume,
    total_biaya: totalBiaya,
    pajak,
  };
}

export class RabProposalService {
  async getRabByProposalId(hakiProposalId: string, user: AuthenticatedUserContext): Promise<RABProposal[]> {
    await assertProposalAccess(hakiProposalId, user, {
      requiredPermissions: ["view_proposal", "manage_penelitian", "view_proposal", "manage_pengabdian"],
      prodiPermissions: ["view_proposal"],
    });
    return RABProposal.findAll({ where: { haki_proposal_id: hakiProposalId }, order: [["tahun_ke", "ASC"], ["createdAt", "ASC"]] });
  }

  async bulkUpsertRab(hakiProposalId: string, items: RabItemSchema[], user: AuthenticatedUserContext, requestId?: string): Promise<RABProposal[]> {
    const proposal = await assertProposalAccess(hakiProposalId, user, {
      requiredPermissions: ["manage_penelitian", "manage_pengabdian"],
      prodiPermissions: ["edit_usulan_by_prodi"],
    });
    const validatedItems = items.map((item, index) => validateRabItem(item, index));
    const newItems = await sequelize.transaction(async (transaction) => {
      const oldItems = await RABProposal.findAll({ where: { haki_proposal_id: hakiProposalId }, transaction });
      await RABProposal.destroy({ where: { haki_proposal_id: hakiProposalId }, transaction });
      const rows = await RABProposal.bulkCreate(
        validatedItems.map((item) => ({
          haki_proposal_id: hakiProposalId,
          ...item,
          pajak: String(item.pajak),
        })),
        { transaction },
      );
      auditService.persistNonBlocking({
        action: AuditAction.UPDATE,
        module: RAB_PROPOSAL_MODULE,
        entityId: hakiProposalId,
        userId: user.id,
        before: oldItems.map((row) => row.toJSON()),
        after: { proposal_judul: proposal.judul, items: validatedItems },
        requestId,
      });
      return rows;
    });
    return newItems;
  }
}

export const rabProposalService = new RabProposalService();
