import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { JADWAL_PROPOSAL_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { HttpError } from "../../core/errors/http-error.js";
import { assertProposalAccess } from "../proposal/policies/proposal.policy.js";
import { JadwalBulanan } from "./jadwal-bulanan.model.js";
import { JadwalProposal } from "./jadwal-proposal.model.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { JadwalItemSchema } from "./jadwal-proposal.schema.js";

function validateKegiatanItem(item: JadwalItemSchema, index: number): { nama_kegiatan: string; tahun: number; urutan: number; bulan_aktif: number[] } {
  const label = `Jadwal kegiatan ke-${index + 1}`;
  if (!item.nama_kegiatan || item.nama_kegiatan.trim() === "") {
    throw HttpError.badRequest(`${label}: nama_kegiatan tidak boleh kosong`, [], "VALIDATION_ERROR");
  }
  if (!Array.isArray(item.bulan_aktif) || item.bulan_aktif.length === 0) {
    throw HttpError.badRequest(`${label}: bulan_aktif wajib berisi minimal 1 bulan`, [], "VALIDATION_ERROR");
  }
  return {
    nama_kegiatan: item.nama_kegiatan.trim(),
    tahun: item.tahun,
    urutan: item.urutan,
    bulan_aktif: Array.from(new Set(item.bulan_aktif)),
  };
}

export class JadwalProposalService {
  async getJadwalByProposalId(hakiProposalId: string, user: AuthenticatedUserContext): Promise<JadwalProposal[]> {
    await assertProposalAccess(hakiProposalId, user, {
      requiredPermissions: ["view_proposal", "manage_penelitian", "view_proposal", "manage_pengabdian"],
      prodiPermissions: ["view_proposal"],
    });
    return JadwalProposal.findAll({
      where: { haki_proposal_id: hakiProposalId },
      include: [{ model: JadwalBulanan, as: "bulanAktif", attributes: ["id", "bulan"] }],
      order: [["tahun", "ASC"], ["urutan", "ASC"], [{ model: JadwalBulanan, as: "bulanAktif" }, "bulan", "ASC"]],
    });
  }

  async bulkUpsertJadwal(hakiProposalId: string, items: JadwalItemSchema[], user: AuthenticatedUserContext, requestId?: string): Promise<JadwalProposal[]> {
    const proposal = await assertProposalAccess(hakiProposalId, user, {
      requiredPermissions: ["manage_penelitian", "manage_pengabdian"],
      prodiPermissions: ["edit_usulan_by_prodi"],
    });
    const validatedItems = items.map((item, index) => validateKegiatanItem(item, index));
    const newHeaders = await sequelize.transaction(async (transaction) => {
      const oldHeaders = await JadwalProposal.findAll({
        where: { haki_proposal_id: hakiProposalId },
        include: [{ model: JadwalBulanan, as: "bulanAktif" }],
        transaction,
      });
      await JadwalProposal.destroy({ where: { haki_proposal_id: hakiProposalId }, transaction });
      const inserted: JadwalProposal[] = [];
      for (const item of validatedItems) {
        const header = await JadwalProposal.create(
          {
            haki_proposal_id: hakiProposalId,
            nama_kegiatan: item.nama_kegiatan,
            tahun: item.tahun,
            urutan: item.urutan,
          },
          { transaction },
        );
        await JadwalBulanan.bulkCreate(
          item.bulan_aktif.map((bulan) => ({ jadwal_id: header.id, bulan })),
          { transaction, ignoreDuplicates: true },
        );
        const withBulan = await JadwalProposal.findByPk(header.id, {
          include: [{ model: JadwalBulanan, as: "bulanAktif" }],
          transaction,
        });
        if (withBulan) inserted.push(withBulan);
      }
      auditService.persistNonBlocking({
        action: AuditAction.UPDATE,
        module: JADWAL_PROPOSAL_MODULE,
        entityId: hakiProposalId,
        userId: user.id,
        before: oldHeaders.map((row) => row.toJSON()),
        after: validatedItems,
        requestId,
      });
      return inserted;
    });
    return newHeaders;
  }
}

export const jadwalProposalService = new JadwalProposalService();
