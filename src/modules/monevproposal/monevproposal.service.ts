import { sequelize } from "../../config/database.js";
import { HttpError } from "../../core/errors/http-error.js";
import { JadwalBulanan } from "../jadwal-proposal/jadwal-bulanan.model.js";
import { JadwalProposal } from "../jadwal-proposal/jadwal-proposal.model.js";
import { LuaranProposal } from "../luaran-proposal/luaran-proposal.model.js";
import { PengabdianProposal } from "../pengabdian-proposal/pengabdian-proposal.model.js";
import { PenelitianProposal } from "../penelitian-proposal/penelitian-proposal.model.js";
import { MemberProposal } from "../proposal/member-proposal.model.js";
import { HakiProposal } from "../proposal/proposal.model.js";
import { RABProposal } from "../rab-proposal/rab-proposal.model.js";
import { Role } from "../roles/role.model.js";
import { User } from "../user/user.model.js";
import type { AddMemberBody, AddRABBody } from "./monevproposal.schema.js";

function normalizePeran(peran: string | null | undefined): "Ketua" | "Anggota" {
  return peran === "Ketua" ? "Ketua" : "Anggota";
}

function resolveBiayaSatuan(body: AddRABBody): number {
  return body.harga_satuan ?? body.biaya_satuan ?? 0;
}

function resolveTotalBiaya(body: AddRABBody): number {
  return body.total ?? body.total_biaya ?? 0;
}

export class MonevProposalService {
  async getMonevProposal(proposalId: string): Promise<HakiProposal> {
    const proposal = await HakiProposal.findByPk(proposalId, {
      include: [
        {
          model: MemberProposal,
          as: "members",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "username"],
              include: [{ model: Role, as: "role", attributes: ["name"], required: false }],
              required: false,
            },
          ],
        },
        { model: RABProposal, as: "rab" },
        { model: PenelitianProposal, as: "substansiPenelitian" },
        { model: PengabdianProposal, as: "substansiPengabdian" },
        { model: JadwalProposal, as: "jadwalKegiatan", include: [{ model: JadwalBulanan, as: "bulanAktif", attributes: ["id", "bulan"] }] },
        { model: LuaranProposal, as: "luaran" },
      ],
    });
    if (!proposal) throw HttpError.notFound("Proposal tidak ditemukan");
    return proposal;
  }

  async listMonevProposals(): Promise<HakiProposal[]> {
    return HakiProposal.findAll({
      include: [
        { model: MemberProposal, as: "members" },
        { model: PenelitianProposal, as: "substansiPenelitian" },
        { model: PengabdianProposal, as: "substansiPengabdian" },
        { model: JadwalProposal, as: "jadwalKegiatan" },
        { model: LuaranProposal, as: "luaran" },
      ],
    });
  }

  async addMember(proposalId: string, body: AddMemberBody, currentUserId: string): Promise<MemberProposal> {
    const proposal = await HakiProposal.findByPk(proposalId, { attributes: ["id"] });
    if (!proposal) throw HttpError.notFound("Proposal tidak ditemukan");
    if (body.userId === currentUserId) throw HttpError.badRequest("Tidak dapat menambahkan diri sendiri");

    const user = await User.findByPk(body.userId);
    if (!user) throw HttpError.notFound("User tidak ditemukan");
    if (!user.nidn) throw HttpError.badRequest("User belum memiliki NIDN");

    const existing = await MemberProposal.findOne({
      where: { haki_proposal_id: proposalId, no_identitas: user.nidn },
    });
    if (existing) throw HttpError.conflict("Anggota sudah diundang sebelumnya");

    return MemberProposal.create({
      haki_proposal_id: proposalId,
      no_identitas: user.nidn,
      peran: normalizePeran(body.peran),
      status_invite: "pending",
      invited_by_user_id: currentUserId,
      nama_anggota: user.name,
      status: "Dosen",
      prodi_kode_anggota: user.prodiKode,
    });
  }

  async addRAB(proposalId: string, body: AddRABBody): Promise<RABProposal> {
    const proposal = await HakiProposal.findByPk(proposalId, { attributes: ["id"] });
    if (!proposal) throw HttpError.notFound("Proposal tidak ditemukan");

    return sequelize.transaction((transaction) =>
      RABProposal.create(
        {
          haki_proposal_id: proposalId,
          tahun_ke: String(body.tahun_ke),
          kelompok: body.kelompok,
          komponen: body.komponen,
          item: body.item,
          satuan: body.satuan,
          biaya_satuan: resolveBiayaSatuan(body),
          volume: body.volume,
          total_biaya: resolveTotalBiaya(body),
        },
        { transaction },
      ),
    );
  }
}

export const monevProposalService = new MonevProposalService();
