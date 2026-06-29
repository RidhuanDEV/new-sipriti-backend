import { Op } from "sequelize";
import { LaporanUsulan } from "../modules/proposal/laporan-usulan.model.js";

export const FINAL_REPORT_GATE = Object.freeze({
  JENIS_LAPORAN: "laporan_akhir" as const,
  SCOPE_TIPE: "hibah_internal" as const,
  STATUS_LAPORAN: "Sesuai" as const,
});

function normalizeProposalIds(proposalIds: string[]): string[] {
  return Array.from(
    new Set(
      (Array.isArray(proposalIds) ? proposalIds : []).filter(
        (id): id is string => typeof id === "string" && id.length > 0,
      ),
    ),
  );
}

/**
 * Batch-check which proposals have a validated final report (laporan_akhir + Sesuai).
 * Returns a Map<proposalId, hasValidFinalReport>.
 */
export async function buildFinalReportValidationMap(
  proposalIds: string[],
): Promise<Map<string, boolean>> {
  const normalizedIds = normalizeProposalIds(proposalIds);

  if (normalizedIds.length === 0) return new Map();

  const validatedRows = await LaporanUsulan.findAll({
    where: {
      haki_proposal_id: { [Op.in]: normalizedIds },
      jenis_laporan: FINAL_REPORT_GATE.JENIS_LAPORAN,
      scope_tipe: FINAL_REPORT_GATE.SCOPE_TIPE,
      status_laporan: FINAL_REPORT_GATE.STATUS_LAPORAN,
    },
    attributes: ["haki_proposal_id"],
    raw: true,
  });

  const validatedSet = new Set(
    (validatedRows as { haki_proposal_id: string }[])
      .map((row) => row.haki_proposal_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  );

  return new Map(
    normalizedIds.map((proposalId) => [proposalId, validatedSet.has(proposalId)]),
  );
}

/**
 * Single-proposal check: returns true if this proposal has a validated final report.
 */
export async function isFinalReportValidatedForProposal(
  proposalId: string,
): Promise<boolean> {
  if (!proposalId) return false;

  const validatedRow = await LaporanUsulan.findOne({
    where: {
      haki_proposal_id: proposalId,
      jenis_laporan: FINAL_REPORT_GATE.JENIS_LAPORAN,
      scope_tipe: FINAL_REPORT_GATE.SCOPE_TIPE,
      status_laporan: FINAL_REPORT_GATE.STATUS_LAPORAN,
    },
    attributes: ["id"],
    raw: true,
  });

  return Boolean(validatedRow);
}
