export interface RbacPermissionDto {
  id: string;
  name: string;
  description: string | null;
  module: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RbacRoleDto {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions?: RbacPermissionDto[];
}

export interface RbacUserDto {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  roleNames: string[];
  roles: RbacRoleDto[];
}

export interface RbacPaginationDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
