import type { HakiProposal } from "../../proposal/proposal.model.js";
import type { MemberProposal } from "../../proposal/member-proposal.model.js";
import type { RABProposal } from "../../rab-proposal/rab-proposal.model.js";
import type {
  AdminUsulanDetailDto,
  AdminUsulanListItemDto,
  AdminUsulanMemberDto,
} from "../dto/usulan.dto.js";

function outputNames(proposal: HakiProposal): string | null {
  if (!proposal.outputs || proposal.outputs.length === 0) {
    return null;
  }

  return proposal.outputs.map((output) => output.namaOutput).join(", ");
}

function mapMember(member: MemberProposal): AdminUsulanMemberDto {
  return {
    id: member.id,
    noIdentitas: member.no_identitas ?? null,
    peran: member.peran ?? null,
    status: member.status ?? null,
    role: member.status ?? null,
    nama: member.nama_anggota ?? member.user?.name ?? null,
    programStudi: member.prodi_anggota ?? member.user?.prodiRelation?.namaProdi ?? null,
    programStudiKode: member.prodi_kode_anggota ?? member.user?.prodiRelation?.kodeProdi ?? null,
    institusi: member.institusi_anggota ?? member.user?.institusi ?? null,
    bidang_tugas: member.bidang_tugas ?? null,
    status_invite: member.status_invite ?? null,
    user: member.user
      ? {
          id: member.user.id,
          name: member.user.name ?? null,
          username: member.user.username ?? null,
          email: member.user.email ?? null,
          prodi: member.user.prodiRelation?.namaProdi ?? null,
          institusi: member.user.institusi ?? null,
        }
      : null,
  };
}

function rabTotal(rab: RABProposal): number {
  const value = rab.total_biaya;
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value) || 0;
}

export function toAdminUsulanListItem(
  proposal: HakiProposal,
  index: number,
  offset: number,
): AdminUsulanListItemDto {
  const ketuaMember = proposal.members?.[0];
  const ketua = ketuaMember?.user;

  return {
    id: proposal.id,
    no: offset + index + 1,
    ketua: ketua?.name || "N/A",
    ketua_id: ketua?.id ?? null,
    ketua_email: ketua?.email ?? null,
    judul: proposal.judul || "Belum ada judul",
    jenisUsulan: proposal.skema?.namaSkema || proposal.tipe_usulan || "N/A",
    skema_id: proposal.skema_id ?? null,
    tahunPelaksanaan: proposal.tahun_pelaksanaan || new Date().getFullYear().toString(),
    outputPenelitian: outputNames(proposal),
    status: proposal.status_usulan || "Draft",
    tipe_usulan: proposal.tipe_usulan,
    createdAt: proposal.createdAt,
    updatedAt: proposal.updatedAt,
  };
}

export function toAdminUsulanDetail(proposal: HakiProposal): AdminUsulanDetailDto {
  const members = proposal.members?.map((member) => mapMember(member)) ?? [];
  const ketua = members.find((member) => member.peran === "Ketua");
  const rabs = proposal.rabs ?? [];

  return {
    id: proposal.id,
    judul: proposal.judul,
    abstrak: null,
    kata_kunci: null,
    tipe_usulan: proposal.tipe_usulan,
    lama_kegiatan: proposal.tahun_pelaksanaan ?? null,
    status: proposal.status_usulan,
    skema: proposal.skema
      ? {
          id: proposal.skema.id,
          nama_skema: proposal.skema.namaSkema,
          tipe: proposal.skema.tipe,
        }
      : null,
    tahun_pelaksanaan: proposal.tahun_pelaksanaan ?? null,
    output_penelitian: outputNames(proposal),
    ketua: ketua?.user ?? null,
    anggota: members,
    rabs: rabs.map((rab) => rab.toJSON()),
    totalDana: rabs.reduce((sum, rab) => sum + rabTotal(rab), 0),
    dokumenPendukung: [],
    createdAt: proposal.createdAt,
    updatedAt: proposal.updatedAt,
  };
}
