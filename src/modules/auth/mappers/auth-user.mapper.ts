import type { User } from "../../user/user.model.js";
import type { Role } from "../../roles/role.model.js";
import type {
  AuthAdminUserResponseDto,
  AuthProdiRelationDto,
  AuthUserResponseDto,
} from "../dto/auth-user-response.dto.js";

function mapRoleNames(user: User): string[] {
  if (user.roles && user.roles.length > 0) {
    return user.roles.map((role) => role.name);
  }

  return user.role ? [user.role.name] : [];
}

function mapRoleIds(user: User): string[] {
  if (user.roles && user.roles.length > 0) {
    return user.roles.map((role) => role.id);
  }

  return user.role ? [user.role.id] : [];
}

function mapProdiRelation(user: User): AuthProdiRelationDto | null {
  const prodi = user.prodiRelation;
  if (!prodi) {
    return null;
  }

  return {
    id: prodi.id,
    kode_prodi: prodi.kodeProdi,
    nama_prodi: prodi.namaProdi,
    jenjang: prodi.jenjang,
  };
}

export function toAuthUserResponse(user: User): AuthUserResponseDto {
  const prodiRelation = mapProdiRelation(user);
  const prodiKode = user.prodiKode ?? prodiRelation?.kode_prodi ?? null;
  const prodiNama = prodiRelation?.nama_prodi ?? null;

  return {
    id: user.id,
    name: user.name ?? null,
    username: user.username ?? null,
    nidn: user.nidn ?? null,
    email: user.email ?? null,
    institusi: user.institusi ?? null,
    prodi_kode: prodiKode,
    prodi_nama: prodiNama,
    prodi: prodiNama,
    role: mapRoleNames(user),
    role_id: mapRoleIds(user),
    prodiRelation,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    deletedAt: user.deletedAt ?? null,
    is_active: user.deletedAt === null,
  };
}

export function toAuthAdminUserResponse(user: User): AuthAdminUserResponseDto {
  const mappedUser = toAuthUserResponse(user);

  return {
    id: mappedUser.id,
    name: mappedUser.name,
    username: mappedUser.username,
    nidn: mappedUser.nidn || "-",
    email: mappedUser.email || "-",
    institusi: mappedUser.institusi || "-",
    prodi_kode: mappedUser.prodi_kode,
    prodi_nama: mappedUser.prodi_nama,
    prodi: mappedUser.prodi_nama || mappedUser.prodi || "-",
    role: mappedUser.role,
    role_id: mappedUser.role_id,
    prodiRelation: mappedUser.prodiRelation,
    createdAt: mappedUser.createdAt,
    deletedAt: mappedUser.deletedAt,
    is_active: mappedUser.is_active,
    prodi_jenjang: mappedUser.prodiRelation?.jenjang || "-",
  };
}

export function uniqueRoles(roles: ReadonlyArray<Role>): Role[] {
  const seenRoleIds = new Set<string>();
  const result: Role[] = [];

  for (const role of roles) {
    if (seenRoleIds.has(role.id)) {
      continue;
    }

    seenRoleIds.add(role.id);
    result.push(role);
  }

  return result;
}
