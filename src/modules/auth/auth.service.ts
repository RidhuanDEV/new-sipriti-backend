import bcrypt from "bcrypt";
import { AuthRepository } from "./auth.repository.js";
import { signToken } from "../../core/auth/jwt.service.js";
import { HttpError } from "../../core/errors/http-error.js";
import { auditService } from "../../core/audit/audit.service.js";
import { cacheService } from "../../core/cache/cache.service.js";
import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { AUTH_MODULE, USER_MODULE } from "../../constants/modules.constants.js";
import {
  toAuthAdminUserResponse,
  toAuthUserResponse,
} from "./mappers/auth-user.mapper.js";
import type {
  AdminUpdateUserDto,
  ChangePasswordDto,
  RegisterDto,
  LoginDto,
  ListUsersQueryDto,
  SearchUsersQueryDto,
  UpdateProfileDto,
} from "./auth.schema.js";
import type { User } from "../user/user.model.js";
import type { InferAttributes } from "sequelize";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type {
  AuthAdminUserResponseDto,
  AuthListUsersPaginationDto,
  AuthSearchUserResponseDto,
  AuthUserResponseDto,
} from "./dto/auth-user-response.dto.js";

const SALT_ROUNDS = 12;
const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 100,
  admin: 80,
  kaprodi: 60,
  koordinator: 55,
  koordinator_penelitian: 55,
  koordinator_pengabdian: 55,
  koordinator_hki: 55,
  koordinator_publikasi: 55,
  dosen: 40,
  mahasiswa: 20,
};

const repository = new AuthRepository();

interface LoginResult {
  token: string;
  user: AuthUserResponseDto;
}

interface ListUsersResult<TUser> {
  users: TUser[];
  pagination: AuthListUsersPaginationDto;
}

interface ToggleUserStatusResult {
  id: string;
  is_active: boolean;
}

function signAuthToken(user: User): string {
  return signToken({
    id: user.id,
    ...(user.email ? { email: user.email } : {}),
    ...(user.roleId ? { roleId: user.roleId } : {}),
  });
}

function normalizeIds(ids: ReadonlyArray<string>): string[] {
  const normalized = new Set<string>();
  for (const id of ids) {
    const trimmed = id.trim();
    if (trimmed.length > 0) {
      normalized.add(trimmed);
    }
  }
  return Array.from(normalized);
}

function blankToNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRoleName(roleName: string): string {
  return roleName.trim().toLowerCase();
}

function isAdminContext(user: AuthenticatedUserContext | undefined): boolean {
  return Boolean(user?.roles.some((role) => normalizeRoleName(role.name) === "admin"));
}

function roleNamesFromContext(user: AuthenticatedUserContext): string[] {
  return Array.from(new Set(user.roles.map((role) => normalizeRoleName(role.name))));
}

function roleNamesFromUser(user: User): string[] {
  const names = new Set<string>();

  if (user.role?.name) {
    names.add(normalizeRoleName(user.role.name));
  }

  for (const role of user.roles ?? []) {
    names.add(normalizeRoleName(role.name));
  }

  return Array.from(names);
}

function roleLevel(roleName: string): number {
  return ROLE_HIERARCHY[normalizeRoleName(roleName)] ?? 0;
}

function highestRoleLevel(roleNames: ReadonlyArray<string>): number {
  return roleNames.reduce((highest, roleName) => Math.max(highest, roleLevel(roleName)), 0);
}

function assertCanManageTargetUser(
  requesterRoleNames: ReadonlyArray<string>,
  targetRoleNames: ReadonlyArray<string>,
  actionLabel: string,
): void {
  const requesterIsSuperAdmin = requesterRoleNames.includes("super_admin");
  const targetIsAdminLevel = targetRoleNames.includes("admin") || targetRoleNames.includes("super_admin");

  if (targetIsAdminLevel && !requesterIsSuperAdmin) {
    throw HttpError.badRequest(`Hanya super_admin yang dapat ${actionLabel} akun admin/super_admin`);
  }

  const requesterHighestLevel = highestRoleLevel(requesterRoleNames);
  const targetHighestLevel = highestRoleLevel(targetRoleNames);

  if (requesterHighestLevel > 0 && targetHighestLevel > 0 && targetHighestLevel >= requesterHighestLevel) {
    throw HttpError.badRequest(`Anda hanya dapat ${actionLabel} akun dengan level role di bawah akun Anda`);
  }
}

function resolveUserStatusFilter(
  query: ListUsersQueryDto,
): "all" | "active" | "inactive" {
  if (query.status !== undefined) {
    return query.status;
  }

  if (query.is_active === undefined || query.is_active.trim() === "") {
    return "all";
  }

  return query.is_active === "true" ? "active" : "inactive";
}

export class AuthService {
  async register(
    dto: RegisterDto,
    actor?: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<LoginResult> {
    if (await repository.usernameExists(dto.username)) {
      throw HttpError.badRequest("Username sudah digunakan");
    }

    const email = blankToNull(dto.email);
    const nidn = blankToNull(dto.nidn);
    const institusi = blankToNull(dto.institusi);
    const prodiKode = await this.resolveProdiKode(blankToNull(dto.prodi_kode));

    if (nidn && (await repository.nidnExists(nidn))) {
      throw HttpError.badRequest("NIDN sudah terdaftar");
    }

    if (email && (await repository.emailExists(email))) {
      throw HttpError.badRequest("Email sudah digunakan");
    }

    const roleIds = normalizeIds(dto.role_id);
    const primaryRoleId = roleIds[0];
    if (!primaryRoleId) {
      throw HttpError.badRequest("Role wajib dipilih");
    }

    const roles = await repository.findRolesByIds(roleIds);
    if (roles.length !== roleIds.length) {
      throw HttpError.badRequest("Satu atau lebih ID role tidak valid");
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const created = await sequelize.transaction(async (trx) => {
      const user = await repository.createUser(
        {
          name: dto.name,
          username: dto.username,
          email,
          password: hashedPassword,
          roleId: primaryRoleId,
          nidn,
          institusi,
          prodiKode,
        },
        trx,
      );

      await repository.syncUserRoles(user.id, roleIds, actor?.id ?? user.id, trx);

      await auditService.persist({
        action: AuditAction.REGISTER,
        module: USER_MODULE,
        entityType: "User",
        entityId: user.id,
        userId: actor?.id ?? user.id,
        userName: actor?.name ?? dto.name,
        description: `User "${dto.name}" mendaftar`,
        after: { name: dto.name, username: dto.username, email, nidn, roleIds },
        requestId,
        trx,
      });

      return user;
    });

    const loaded = await repository.findById(created.id);
    if (!loaded) {
      throw HttpError.internal("User gagal dimuat setelah registrasi");
    }

    return { token: signAuthToken(loaded), user: toAuthUserResponse(loaded) };
  }

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = dto.username
      ? await repository.findByUsername(dto.username)
      : await repository.findByEmail(dto.email ?? "");

    if (!user) {
      throw HttpError.badRequest("Email atau password salah", [], "BAD_REQUEST");
    }

    if (user.deletedAt !== null) {
      throw HttpError.badRequest(
        "Akun Anda telah dinonaktifkan. Hubungi admin untuk mengaktifkan kembali.",
        [],
        "BAD_REQUEST",
      );
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw HttpError.badRequest("Email atau password salah", [], "BAD_REQUEST");
    }

    auditService.log(AuditAction.LOGIN, AUTH_MODULE, user.id, {
      email: user.email,
    });

    return { token: signAuthToken(user), user: toAuthUserResponse(user) };
  }

  async me(userId: string): Promise<AuthUserResponseDto> {
    const user = await repository.findById(userId);
    if (!user) throw HttpError.notFound("User not found");
    return toAuthUserResponse(user);
  }

  async searchUsers(
    query: SearchUsersQueryDto,
    excludeUserId: string,
  ): Promise<AuthSearchUserResponseDto[]> {
    const searchValue = (query.query ?? query.q ?? "").trim();
    const [lecturers, students] = await Promise.all([
      repository.searchLecturers(searchValue, excludeUserId),
      repository.searchStudents(searchValue),
    ]);

    const lecturerRows: AuthSearchUserResponseDto[] = lecturers.map((user) => ({
      name: user.name,
      nidn: user.nidn,
      prodiKode: user.prodiRelation?.kodeProdi ?? "",
      prodiNama: user.prodiRelation?.namaProdi ?? "",
      role: "dosen",
    }));

    const studentRows: AuthSearchUserResponseDto[] = students.map((student) => ({
      name: student.nama,
      nidn: student.nrp,
      prodiKode: student.prodiRelasi?.kodeProdi ?? "",
      prodiNama: student.prodiRelasi?.namaProdi ?? "",
      role: "mahasiswa",
    }));

    return [...lecturerRows, ...studentRows].sort((left, right) =>
      (left.name ?? "").localeCompare(right.name ?? ""),
    );
  }

  async listUsers(
    query: ListUsersQueryDto,
  ): Promise<ListUsersResult<AuthUserResponseDto>> {
    const status = resolveUserStatusFilter(query);
    const { count, rows } = await repository.findAndCountUsers({
      page: query.page,
      limit: query.limit,
      search: query.search,
      role: query.role,
      status,
      includeStatusFilters: false,
    });

    return {
      users: rows.map((user) => toAuthUserResponse(user)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count,
        totalPages: Math.ceil(count / query.limit),
      },
    };
  }

  async listUsersAdmin(
    query: ListUsersQueryDto,
  ): Promise<ListUsersResult<AuthAdminUserResponseDto>> {
    const status = resolveUserStatusFilter(query);
    const { count, rows } = await repository.findAndCountUsers({
      page: query.page,
      limit: query.limit,
      search: query.search,
      role: query.role,
      status,
      includeStatusFilters: true,
    });

    return {
      users: rows.map((user) => toAuthAdminUserResponse(user)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count,
        totalPages: Math.ceil(count / query.limit),
        filters: {
          role: query.role || "all",
          status,
        },
      },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await repository.findById(userId);
    if (!user) {
      throw HttpError.notFound("User tidak ditemukan");
    }

    const currentPasswordValue = dto.currentPassword ?? dto.oldPassword ?? dto.old_password;
    if (!currentPasswordValue) {
      throw HttpError.badRequest("Password lama harus diisi");
    }

    const isMatch = await bcrypt.compare(currentPasswordValue, user.password);
    if (!isMatch) {
      throw HttpError.badRequest("Password lama tidak sesuai");
    }

    const isSame = await bcrypt.compare(dto.newPassword, user.password);
    if (isSame) {
      throw HttpError.badRequest("Password baru tidak boleh sama dengan password lama");
    }

    await repository.updateUser(user, {
      password: await bcrypt.hash(dto.newPassword, SALT_ROUNDS),
    });
  }

  async updateProfile(
    user: AuthenticatedUserContext,
    dto: UpdateProfileDto,
  ): Promise<AuthUserResponseDto> {
    const record = await repository.findById(user.id);
    if (!record) {
      throw HttpError.notFound("User tidak ditemukan");
    }

    const isAdmin = isAdminContext(user);
    if ((dto.nidn !== undefined || dto.prodi_kode !== undefined) && !isAdmin) {
      throw HttpError.badRequest("Hanya admin yang dapat mengubah NIDN dan Prodi");
    }

    const fields: Partial<InferAttributes<User>> = {};
    if (dto.name !== undefined) fields.name = dto.name;
    if (dto.institusi !== undefined) fields.institusi = blankToNull(dto.institusi);

    const email = blankToNull(dto.email);
    if (email) {
      if (email !== record.email && (await repository.emailExists(email, record.id))) {
        throw HttpError.badRequest("Email sudah digunakan oleh user lain");
      }
      fields.email = email;
    }

    if (isAdmin && dto.nidn !== undefined) {
      const nidn = blankToNull(dto.nidn);
      if (nidn && nidn !== record.nidn && (await repository.nidnExists(nidn, record.id))) {
        throw HttpError.badRequest("NIDN sudah terdaftar");
      }
      fields.nidn = nidn;
    }

    if (isAdmin && dto.prodi_kode !== undefined) {
      fields.prodiKode = await this.resolveProdiKode(blankToNull(dto.prodi_kode));
    }

    await repository.updateUser(record, fields);

    const updated = await repository.findById(record.id);
    if (!updated) {
      throw HttpError.internal("User gagal dimuat setelah update");
    }

    return toAuthUserResponse(updated);
  }

  async getUserById(id: string): Promise<AuthUserResponseDto> {
    const user = await repository.findById(id);
    if (!user) {
      throw HttpError.notFound("User tidak ditemukan");
    }

    return toAuthUserResponse(user);
  }

  async adminUpdateUser(
    id: string,
    dto: AdminUpdateUserDto,
    actor: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<AuthUserResponseDto> {
    const user = await repository.findById(id);
    if (!user) {
      throw HttpError.notFound("User tidak ditemukan");
    }

    const before = toAuthUserResponse(user);
    const fields: Partial<InferAttributes<User>> = {};

    if (dto.username !== undefined && dto.username !== user.username) {
      if (await repository.usernameExists(dto.username, id)) {
        throw HttpError.badRequest("Username sudah digunakan");
      }
      fields.username = dto.username;
    }

    if (dto.name !== undefined) fields.name = dto.name;
    if (dto.institusi !== undefined) fields.institusi = blankToNull(dto.institusi);

    const email = blankToNull(dto.email);
    if (email) {
      if (email !== user.email && (await repository.emailExists(email, id))) {
        throw HttpError.badRequest("Email sudah digunakan");
      }
      fields.email = email;
    }

    if (dto.password && dto.password.trim().length > 0) {
      fields.password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    if (dto.prodi_kode !== undefined) {
      fields.prodiKode = await this.resolveProdiKode(blankToNull(dto.prodi_kode));
    }

    const nextNidn = blankToNull(dto.nidn);
    const hasNidnChange = dto.nidn !== undefined && nextNidn !== user.nidn;
    if (dto.nidn !== undefined) {
      if (nextNidn && nextNidn !== user.nidn && (await repository.nidnExists(nextNidn, id))) {
        throw HttpError.badRequest("NIDN sudah terdaftar");
      }
      fields.nidn = nextNidn;
    }

    const nextRoleIds = dto.role_id ? normalizeIds(dto.role_id) : null;
    if (nextRoleIds) {
      const roles = await repository.findRolesByIds(nextRoleIds);
      if (roles.length !== nextRoleIds.length) {
        throw HttpError.badRequest("Satu atau lebih ID role tidak valid");
      }
      if (nextRoleIds[0]) {
        fields.roleId = nextRoleIds[0];
      }
    }

    const updated = await sequelize.transaction(async (trx) => {
      await repository.updateUser(user, fields, trx);

      if (nextRoleIds) {
        await repository.syncUserRoles(id, nextRoleIds, actor.id, trx);
      }

      if (hasNidnChange && before.nidn && nextNidn) {
        await repository.cascadeIdentity(before.nidn, nextNidn, trx);
      }

      const reloaded = await repository.findById(id, true, trx);
      if (!reloaded) {
        throw HttpError.internal("User gagal dimuat setelah update");
      }

      await auditService.persist({
        action: AuditAction.UPDATE,
        module: USER_MODULE,
        entityType: "User",
        entityId: id,
        userId: actor.id,
        userName: actor.name,
        description: `Admin ${actor.name} memperbarui data user "${reloaded.name ?? reloaded.username ?? id}"`,
        before,
        after: toAuthUserResponse(reloaded),
        requestId,
        trx,
      });

      return reloaded;
    });

    return toAuthUserResponse(updated);
  }

  async deactivateUserById(
    targetUserId: string,
    actor: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<ToggleUserStatusResult> {
    const user = await repository.findById(targetUserId, false);
    if (!user) {
      throw HttpError.notFound("Pengguna tidak ditemukan");
    }

    if (user.deletedAt) {
      throw HttpError.badRequest("Akun ini sudah dinonaktifkan");
    }

    if (user.id === actor.id) {
      throw HttpError.badRequest("Anda tidak dapat menonaktifkan akun Anda sendiri");
    }

    assertCanManageTargetUser(roleNamesFromContext(actor), roleNamesFromUser(user), "menonaktifkan");

    await sequelize.transaction(async (trx) => {
      await repository.softDeleteUser(user, trx);
      await auditService.persist({
        action: AuditAction.DELETE,
        module: USER_MODULE,
        entityType: "User",
        entityId: user.id,
        userId: actor.id,
        userName: actor.name,
        description: `Akun pengguna ${user.name} (${user.username}) dinonaktifkan`,
        before: { name: user.name, nidn: user.nidn, is_active: true },
        after: { name: user.name, nidn: user.nidn, is_active: false },
        requestId,
        trx,
      });
    });

    await cacheService.del(`auth-context:${user.id}`);

    return { id: user.id, is_active: false };
  }

  async restoreUserById(
    targetUserId: string,
    actor: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<ToggleUserStatusResult> {
    const user = await repository.findById(targetUserId, false);
    if (!user) {
      throw HttpError.notFound("Pengguna tidak ditemukan");
    }

    if (!user.deletedAt) {
      throw HttpError.badRequest("Akun ini masih aktif, tidak perlu dipulihkan");
    }

    assertCanManageTargetUser(roleNamesFromContext(actor), roleNamesFromUser(user), "mengaktifkan kembali");

    await sequelize.transaction(async (trx) => {
      await repository.restoreUser(user, trx);
      await auditService.persist({
        action: AuditAction.RESTORE,
        module: USER_MODULE,
        entityType: "User",
        entityId: user.id,
        userId: actor.id,
        userName: actor.name,
        description: `Akun pengguna ${user.name} (${user.username}) dipulihkan`,
        before: { name: user.name, nidn: user.nidn, is_active: false },
        after: { name: user.name, nidn: user.nidn, is_active: true },
        requestId,
        trx,
      });
    });

    await cacheService.del(`auth-context:${user.id}`);

    return { id: user.id, is_active: true };
  }

  private async resolveProdiKode(prodiKode: string | null | undefined): Promise<string | null> {
    if (prodiKode === undefined || prodiKode === null || prodiKode.trim().length === 0) {
      return null;
    }

    const prodi = await repository.findProdiByKode(prodiKode.trim());
    if (!prodi) {
      throw HttpError.badRequest("Prodi tidak ditemukan");
    }

    return prodi.kodeProdi;
  }
}
