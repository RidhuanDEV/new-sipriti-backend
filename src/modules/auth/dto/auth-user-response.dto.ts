export interface AuthRoleRelationDto {
  id: string | null;
  name: string | null;
}

export interface AuthProdiRelationDto {
  id: string | null;
  kode_prodi: string | null;
  nama_prodi: string | null;
  jenjang: string | null;
}

export interface AuthUserResponseDto {
  id: string;
  name: string | null;
  username: string | null;
  nidn: string | null;
  email: string | null;
  institusi: string | null;
  prodi_kode: string | null;
  prodi_nama: string | null;
  prodi: string | null;
  role: string[];
  role_id: string[];
  prodiRelation: AuthProdiRelationDto | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  is_active: boolean;
}

export interface AuthCurrentUserResponseDto extends AuthUserResponseDto {
  permissions: string[];
}

export interface AuthSearchUserResponseDto {
  name: string | null;
  nidn: string | null;
  prodiKode: string;
  prodiNama: string;
  role: "dosen" | "mahasiswa";
}

export interface AuthListUsersPaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  filters?: {
    role: string;
    status: string;
  };
}

export interface AuthAdminUserResponseDto {
  id: string;
  name: string | null;
  username: string | null;
  nidn: string;
  email: string;
  institusi: string;
  prodi_kode: string | null;
  prodi_nama: string | null;
  prodi: string;
  role: string[];
  role_id: string[];
  prodiRelation: AuthProdiRelationDto | null;
  createdAt: Date;
  deletedAt: Date | null;
  is_active: boolean;
  prodi_jenjang: string;
}
