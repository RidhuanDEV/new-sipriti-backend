import { HKI } from "../hki/hki.model.js";
import { Output } from "../output/output.model.js";
import { Prodi } from "../prodi/prodi.model.js";
import { MemberProposal } from "../proposal/member-proposal.model.js";
import { HakiProposal, type ProposalStatus, type ProposalTipeUsulan } from "../proposal/proposal.model.js";
import { Skema } from "../skema/skema.model.js";
import { User } from "../user/user.model.js";
import type { AdminDashboardQuery } from "./admin-dashboard.schema.js";

interface DashboardStats {
  proposal: {
    total: number;
    draft: number;
    pending: number;
    approved: number;
    declined: number;
    penelitian: number;
    pengabdian: number;
  };
  hki: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  users: { total: number };
  prodi: { total: number };
}

interface StatusStats {
  draft: number;
  pending: number;
  approved: number;
  declined: number;
  total: number;
}

interface SkemaStatsRow extends StatusStats {
  id: string;
  nama_skema: string;
  tipe: string;
}

interface ProdiStatsRow {
  id: string;
  kode_prodi: string;
  nama_prodi: string;
  jenjang: string;
  pending: number;
  approved: number;
  declined: number;
  total: number;
}

interface RecentActivity {
  id: string;
  type: "proposal" | "hki";
  title: string;
  by: string | null;
  subtype: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

function proposalMatchesTahun(proposal: HakiProposal, tahun: string | undefined): boolean {
  return !tahun || proposal.tahun_pelaksanaan === tahun;
}

function proposalMatchesTipe(proposal: HakiProposal, tipe: string | undefined): boolean {
  return !tipe || proposal.tipe_usulan === tipe;
}

function blankStatusStats(): StatusStats {
  return { draft: 0, pending: 0, approved: 0, declined: 0, total: 0 };
}

function addStatus(stats: StatusStats, status: ProposalStatus): void {
  if (status === "Draft") stats.draft += 1;
  if (status === "Pending") stats.pending += 1;
  if (status === "Approved") stats.approved += 1;
  if (status === "Declined") stats.declined += 1;
  stats.total += 1;
}

function outputText(outputs: Output[] | undefined): string | null {
  if (!outputs || outputs.length === 0) return null;
  return outputs.map((output) => output.namaOutput).join(", ");
}

function prodiStatKey(proposal: HakiProposal): string | null {
  return proposal.prodi_pengusul || proposal.prodiPengusulRelasi?.kodeProdi || proposal.prodiPengusulRelasi?.namaProdi || null;
}

export class AdminDashboardService {
  async getDashboardStats(query: AdminDashboardQuery): Promise<DashboardStats> {
    const proposalWhere = query.tahun ? { tahun_pelaksanaan: query.tahun } : {};
    const [
      totalProposals,
      draftProposals,
      pendingProposals,
      approvedProposals,
      declinedProposals,
      penelitianCount,
      pengabdianCount,
      totalHKI,
      pendingHKI,
      approvedHKI,
      rejectedHKI,
      totalUsers,
      totalProdi,
    ] = await Promise.all([
      HakiProposal.count({ where: proposalWhere }),
      HakiProposal.count({ where: { ...proposalWhere, status_usulan: "Draft" } }),
      HakiProposal.count({ where: { ...proposalWhere, status_usulan: "Pending" } }),
      HakiProposal.count({ where: { ...proposalWhere, status_usulan: "Approved" } }),
      HakiProposal.count({ where: { ...proposalWhere, status_usulan: "Declined" } }),
      HakiProposal.count({ where: { ...proposalWhere, tipe_usulan: "Penelitian" } }),
      HakiProposal.count({ where: { ...proposalWhere, tipe_usulan: "Pengabdian" } }),
      HKI.count(),
      HKI.count({ where: { status: "Pending" } }),
      HKI.count({ where: { status: "Approved" } }),
      HKI.count({ where: { status: "Rejected" } }),
      User.count(),
      Prodi.count(),
    ]);

    return {
      proposal: {
        total: totalProposals,
        draft: draftProposals,
        pending: pendingProposals,
        approved: approvedProposals,
        declined: declinedProposals,
        penelitian: penelitianCount,
        pengabdian: pengabdianCount,
      },
      hki: { total: totalHKI, pending: pendingHKI, approved: approvedHKI, rejected: rejectedHKI },
      users: { total: totalUsers },
      prodi: { total: totalProdi },
    };
  }

  async getSkemaStats(query: AdminDashboardQuery): Promise<{ skemas: SkemaStatsRow[]; totals: StatusStats }> {
    const skemas = await Skema.findAll({
      where: { ...(query.tipe ? { tipe: query.tipe } : {}), isActive: true },
      attributes: ["id", "namaSkema", "tipe"],
      order: [
        ["tipe", "ASC"],
        ["namaSkema", "ASC"],
      ],
    });
    const proposals = await HakiProposal.findAll({
      attributes: ["skema_id", "status_usulan", "tahun_pelaksanaan"],
      where: query.tahun ? { tahun_pelaksanaan: query.tahun } : {},
    });
    const statsBySkema = new Map<string, StatusStats>();
    for (const proposal of proposals) {
      if (!proposal.skema_id) continue;
      const stats = statsBySkema.get(proposal.skema_id) ?? blankStatusStats();
      addStatus(stats, proposal.status_usulan);
      statsBySkema.set(proposal.skema_id, stats);
    }
    const skemaStats = skemas.map((skema) => {
      const stats = statsBySkema.get(skema.id) ?? blankStatusStats();
      return {
        id: skema.id,
        nama_skema: skema.namaSkema,
        tipe: skema.tipe,
        ...stats,
      };
    });
    const totals = skemaStats.reduce<StatusStats>(
      (acc, row) => ({
        draft: acc.draft + row.draft,
        pending: acc.pending + row.pending,
        approved: acc.approved + row.approved,
        declined: acc.declined + row.declined,
        total: acc.total + row.total,
      }),
      blankStatusStats(),
    );
    return { skemas: skemaStats, totals };
  }

  async getProdiStats(query: AdminDashboardQuery): Promise<{ prodi: ProdiStatsRow[]; totalProdi: number; prodiWithProposals: number }> {
    const prodis = await Prodi.findAll({
      attributes: ["id", "kodeProdi", "namaProdi", "jenjang"],
      order: [
        ["jenjang", "ASC"],
        ["namaProdi", "ASC"],
      ],
    });
    const proposals = await HakiProposal.findAll({
      attributes: ["prodi_pengusul", "status_usulan", "tahun_pelaksanaan", "tipe_usulan"],
      include: [{ model: Prodi, as: "prodiPengusulRelasi", attributes: ["kodeProdi", "namaProdi"], required: false }],
    });

    const statsByProdi = new Map<string, Pick<ProdiStatsRow, "pending" | "approved" | "declined" | "total">>();
    for (const proposal of proposals) {
      if (!proposalMatchesTahun(proposal, query.tahun) || !proposalMatchesTipe(proposal, query.tipe)) continue;
      const key = prodiStatKey(proposal);
      if (!key) continue;
      const stats = statsByProdi.get(key) ?? { pending: 0, approved: 0, declined: 0, total: 0 };
      if (proposal.status_usulan === "Pending") stats.pending += 1;
      if (proposal.status_usulan === "Approved") stats.approved += 1;
      if (proposal.status_usulan === "Declined") stats.declined += 1;
      stats.total += 1;
      statsByProdi.set(key, stats);
      if (proposal.prodiPengusulRelasi?.namaProdi) statsByProdi.set(proposal.prodiPengusulRelasi.namaProdi, stats);
    }

    const prodiStats = prodis
      .map((prodi) => {
        const stats = statsByProdi.get(prodi.kodeProdi) ?? statsByProdi.get(prodi.namaProdi) ?? { pending: 0, approved: 0, declined: 0, total: 0 };
        return {
          id: prodi.id,
          kode_prodi: prodi.kodeProdi,
          nama_prodi: prodi.namaProdi,
          jenjang: prodi.jenjang,
          pending: stats.pending,
          approved: stats.approved,
          declined: stats.declined,
          total: stats.total,
        };
      })
      .filter((row) => row.total > 0);

    return { prodi: prodiStats, totalProdi: prodis.length, prodiWithProposals: prodiStats.length };
  }

  async getRecentActivity(query: AdminDashboardQuery): Promise<RecentActivity[]> {
    const [recentProposals, recentHKI] = await Promise.all([
      HakiProposal.findAll({
        attributes: ["id", "judul", "tipe_usulan", "status_usulan", "createdAt", "updatedAt"],
        include: [{ model: User, as: "ketua", attributes: ["name"], required: false }],
        order: [["updatedAt", "DESC"]],
        limit: query.limit,
      }),
      HKI.findAll({
        attributes: ["id", "judul", "pemegang_hak", "jenis_hki", "status", "createdAt", "updatedAt"],
        include: [{ model: User, as: "user", attributes: ["name"], required: false }],
        order: [["updatedAt", "DESC"]],
        limit: query.limit,
      }),
    ]);
    return [
      ...recentProposals.map((proposal) => ({
        id: proposal.id,
        type: "proposal" as const,
        title: proposal.judul,
        by: proposal.ketua?.name ?? null,
        subtype: proposal.tipe_usulan,
        status: proposal.status_usulan,
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt,
      })),
      ...recentHKI.map((hki) => ({
        id: hki.id,
        type: "hki" as const,
        title: hki.judul,
        by: hki.user?.name || hki.pemegang_hak,
        subtype: hki.jenis_hki,
        status: hki.status,
        createdAt: hki.createdAt,
        updatedAt: hki.updatedAt,
      })),
    ]
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
      .slice(0, query.limit);
  }

  async getTahunOptions(): Promise<string[]> {
    const proposals = await HakiProposal.findAll({
      attributes: ["tahun_pelaksanaan"],
      order: [["tahun_pelaksanaan", "DESC"]],
    });
    const tahunList = Array.from(
      new Set(proposals.map((proposal) => proposal.tahun_pelaksanaan).filter((tahun): tahun is string => Boolean(tahun))),
    );
    const currentYear = new Date().getFullYear().toString();
    if (!tahunList.includes(currentYear)) tahunList.unshift(currentYear);
    return tahunList;
  }
}

export const adminDashboardService = new AdminDashboardService();
