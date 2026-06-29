export interface AdminUsulanListItemDto {
  id: string;
  no: number;
  ketua: string;
  ketua_id: string | null;
  ketua_email: string | null;
  judul: string;
  jenisUsulan: string;
  skema_id: string | null;
  tahunPelaksanaan: string;
  outputPenelitian: string | null;
  status: string;
  tipe_usulan: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminUsulanPaginationDto {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AdminUsulanMemberDto {
  id: string;
  noIdentitas: string | null;
  peran: string | null;
  status: string | null;
  role: string | null;
  nama: string | null;
  programStudi: string | null;
  programStudiKode: string | null;
  institusi: string | null;
  bidang_tugas: string | null;
  status_invite: string | null;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
    prodi: string | null;
    institusi: string | null;
  } | null;
}

export interface AdminUsulanDetailDto {
  id: string;
  judul: string;
  abstrak: null;
  kata_kunci: null;
  tipe_usulan: string;
  lama_kegiatan: string | null;
  status: string;
  skema: unknown;
  tahun_pelaksanaan: string | null;
  output_penelitian: string | null;
  ketua: AdminUsulanMemberDto["user"];
  anggota: AdminUsulanMemberDto[];
  rabs: unknown[];
  totalDana: number;
  dokumenPendukung: unknown[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminUsulanStatisticsDto {
  total: number;
  byStatus: Record<string, number>;
  byTipe: Record<string, number>;
}
