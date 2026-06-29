import { HKI } from "../hki/hki.model.js";
import { Output } from "../output/output.model.js";
import { MemberProposal } from "../proposal/member-proposal.model.js";
import { HakiProposal } from "../proposal/proposal.model.js";
import { User } from "../user/user.model.js";
import type { DashboardPaginationQuery } from "./dashboard.schema.js";

interface LatestStatusRow {
  proposal_id: string;
  judul: string;
  nama_ketua: string | null;
  peran: string | null;
  status_usulan: string;
  tipe_usulan: string;
  tipe_pendanaan?: string | null;
  current_stage?: string | null;
  output_penelitian?: string | null;
  updatedAt: Date;
}

interface DashboardPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UserProposalCounts {
  proposal_dalam_proses: number;
  proposal_dalam_progress: number;
  proposal_telah_selesai: number;
  penelitian: number;
  pengabdian: number;
  kekayaan_intelektual: number;
}

function outputText(outputs: Output[] | undefined): string | null {
  if (!outputs || outputs.length === 0) return null;
  return outputs.map((output) => output.namaOutput).join(", ");
}

function sortByUpdatedAtDesc(rows: LatestStatusRow[]): LatestStatusRow[] {
  return rows.sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());
}

function dedupeRows(rows: LatestStatusRow[]): LatestStatusRow[] {
  const unique = new Map<string, LatestStatusRow>();
  for (const row of rows) {
    const key = `${row.tipe_usulan}:${row.proposal_id}`;
    if (!unique.has(key)) unique.set(key, row);
  }
  return Array.from(unique.values());
}

export class DashboardService {
  async getUserLatestStatuses(
    userId: string,
    userNidn: string | null,
    query: DashboardPaginationQuery,
  ): Promise<{ data: LatestStatusRow[]; meta: DashboardPaginationMeta }> {
    const membershipsPromise = userNidn
      ? MemberProposal.findAll({
          where: { no_identitas: userNidn },
          include: [
            {
              model: HakiProposal,
              as: "proposal",
              attributes: ["id", "judul", "status_usulan", "tipe_usulan", "tipe_pendanaan", "current_stage", "updatedAt"],
              include: [
                { model: User, as: "ketua", attributes: ["name"], required: false },
                { model: Output, as: "outputs", attributes: ["namaOutput"], through: { attributes: [] } },
              ],
            },
          ],
          order: [[{ model: HakiProposal, as: "proposal" }, "updatedAt", "DESC"]],
        })
      : Promise.resolve([]);

    const [memberships, hkiRecords] = await Promise.all([
      membershipsPromise,
      HKI.findAll({
        where: { user_id: userId },
        attributes: ["id", "judul", "pemegang_hak", "status", "updatedAt"],
        order: [["updatedAt", "DESC"]],
      }),
    ]);

    const proposalMap = new Map<string, LatestStatusRow>();
    for (const membership of memberships) {
      const proposal = membership.proposal;
      if (!proposal || proposal.status_usulan === "Declined") continue;
      const item: LatestStatusRow = {
        proposal_id: proposal.id,
        judul: proposal.judul,
        nama_ketua: proposal.ketua?.name ?? null,
        peran: membership.peran,
        status_usulan: proposal.status_usulan,
        tipe_usulan: proposal.tipe_usulan,
        tipe_pendanaan: proposal.tipe_pendanaan,
        current_stage: proposal.current_stage,
        output_penelitian: outputText(proposal.outputs),
        updatedAt: proposal.updatedAt,
      };
      if (!proposalMap.has(item.proposal_id)) proposalMap.set(item.proposal_id, item);
    }

    const hkiData: LatestStatusRow[] = hkiRecords
      .filter((hki) => hki.status !== "Rejected")
      .map((hki) => ({
        proposal_id: hki.id,
        judul: hki.judul,
        nama_ketua: hki.pemegang_hak,
        peran: "Pengusul",
        status_usulan: hki.status,
        tipe_usulan: "HKI",
        updatedAt: hki.updatedAt,
      }));

    const allData = dedupeRows(sortByUpdatedAtDesc([...proposalMap.values(), ...hkiData]));
    const offset = (query.page - 1) * query.limit;
    const total = allData.length;
    return {
      data: allData.slice(offset, offset + query.limit),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getUserProposalCounts(userId: string, userNidn: string | null): Promise<UserProposalCounts> {
    const membershipsPromise = userNidn
      ? MemberProposal.findAll({
          where: { no_identitas: userNidn },
          include: [{ model: HakiProposal, as: "proposal" }],
        })
      : Promise.resolve([]);
    const [memberships, hkiRecords] = await Promise.all([
      membershipsPromise,
      HKI.findAll({ where: { user_id: userId } }),
    ]);

    const proposalById = new Map<string, HakiProposal>();
    for (const membership of memberships) {
      if (membership.proposal && !proposalById.has(membership.proposal.id)) {
        proposalById.set(membership.proposal.id, membership.proposal);
      }
    }
    const proposals = Array.from(proposalById.values());
    return {
      proposal_dalam_proses: proposals.filter((proposal) => proposal.status_usulan === "Draft").length,
      proposal_dalam_progress:
        proposals.filter((proposal) => proposal.status_usulan === "Pending").length +
        hkiRecords.filter((hki) => hki.status === "Pending").length,
      proposal_telah_selesai:
        proposals.filter((proposal) => proposal.status_usulan === "Approved").length +
        hkiRecords.filter((hki) => hki.status === "Approved").length,
      penelitian: proposals.filter((proposal) => proposal.tipe_usulan === "Penelitian").length,
      pengabdian: proposals.filter((proposal) => proposal.tipe_usulan === "Pengabdian").length,
      kekayaan_intelektual: hkiRecords.length,
    };
  }
}

export const dashboardService = new DashboardService();
