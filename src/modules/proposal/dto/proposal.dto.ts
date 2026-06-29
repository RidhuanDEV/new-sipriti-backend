import type { ProposalStatus, ProposalTipe, ProposalTipeUsulan } from "../proposal.model.js";

export interface ProposalMetaInput {
  judul?: string | undefined;
  bidang_fokus?: string | undefined;
  bidang?: string | null | undefined;
  prodi_pengusul?: string | undefined;
  skema?: string | undefined;
  sumber_dana?: string | undefined;
  jumlah_dana?: string | number | undefined;
  tahun_pelaksanaan?: string | null | undefined;
  tahun_akademik_id?: string | null | undefined;
  jenis_usulan?: string | null | undefined;
  keterlibatan_lain?: string | null | undefined;
  output_penelitian?: string | null | undefined;
  output_ids?: string[] | null | undefined;
  tipe_usulan?: ProposalTipeUsulan | undefined;
}

export interface ProposalMemberInput {
  nama?: string | null;
  peran?: "Ketua" | "Anggota";
  role?: "Dosen" | "Mahasiswa";
  programStudi?: string | null;
  programStudiKode?: string | null;
  bidang_tugas?: string | null;
  noIdentitas?: string | null;
  institusi?: string | null;
}

export interface CreateProposalBodyDto {
  meta: ProposalMetaInput | string;
  anggota: ProposalMemberInput[] | string;
  importOptions?: {
    allowCreatorOutsideTeam?: boolean;
  };
}

export interface UpdateProposalBodyDto {
  meta?: Partial<ProposalMetaInput> | string;
  anggota?: ProposalMemberInput[] | string;
}

export interface ProposalSearchBodyDto {
  search?: string | undefined;
  status?: ProposalStatus | undefined;
  page: number;
  limit: number;
}

export interface ProposalByProdiQueryDto {
  page: number;
  limit: number;
  search?: string | undefined;
  status?: ProposalStatus | undefined;
  tipe?: ProposalTipeUsulan | undefined;
}

export interface ProposalListQueryDto {
  tahun_akademik_id?: string | undefined;
  tipe?: ProposalTipe | "All" | undefined;
}

export interface TahunAkademikResponseDto {
  id: string;
  tahun: string;
  semester: string;
  label: string;
}

export interface ProposalRowDto {
  no: number;
  id: string;
  ketua: string;
  prodi?: string;
  judul: string;
  bidangFokus: string;
  tipeUsulan: string;
  sumberDana?: string;
  jumlahDana: number;
  tahunPelaksanaan?: string;
  outputPenelitian: string | null;
  peran: string;
  canEdit: boolean;
  canForward: boolean;
  status: string;
  status_usulan?: string;
  created_at?: Date | null;
  statusColor: string;
  tipe: string;
  isFinalReportValidated?: boolean;
  tahunAkademik?: TahunAkademikResponseDto | null;
}

export interface ProposalDetailMemberDto {
  id: string;
  nama: string;
  peran: string;
  bidang_tugas: string;
  role: string;
  programStudi: string;
  programStudiKode: string;
  noIdentitas: string;
  institusi: string;
  status: string;
  status_invite: string;
}

export interface ProposalRabDto {
  tahun_ke: string;
  kelompok: string;
  komponen: string;
  item: string;
  satuan: string;
  biaya_satuan: number;
  volume: number;
  total_biaya: number;
}

export interface ProposalDetailDto {
  id: string;
  status_usulan: string;
  tipe_usulan: string;
  createdAt: Date;
  updatedAt: Date;
  can_edit: boolean;
  catatan_revisi: string | null;
  status_revisi: string;
  meta: {
    judul: string;
    bidang_fokus: string;
    skema: string;
    sumber_dana: string;
    jumlah_dana: string | number;
    keterlibatan_lain: string;
    output_penelitian: string | null;
    output_ids: string[];
    tipe_usulan: string;
    tahun_pelaksanaan: string;
    prodi_pengusul: string;
    prodi_pengusul_nama: string;
    tipe: string;
    tahun_akademik_id: string | null;
    tahun_akademik: TahunAkademikResponseDto | null;
  };
  substansi_penelitian: object | null;
  substansi_pengabdian: object | null;
  jadwal: object[];
  luaran: object[];
  anggota: ProposalDetailMemberDto[];
  rab: ProposalRabDto[];
  total_biaya: number;
}

export interface DropdownOptionsDto {
  tipe_usulan: string[];
  jenis_usulan: string[];
  sumber_dana: string[];
  tahunAkademik: TahunAkademikResponseDto[];
}

export interface SubmitProposalResponseDto {
  id: string;
  status: string;
}

export interface ForwardProposalResponseDto {
  id: string;
  tipe: "hibah_internal";
  status: string;
}
