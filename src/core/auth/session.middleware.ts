import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "./jwt.service.js";
import { HttpError } from "../errors/http-error.js";
import { cacheService } from "../cache/cache.service.js";
import { User } from "../../modules/user/user.model.js";
import { Role } from "../../modules/roles/role.model.js";
import { Permission } from "../../modules/permissions/permission.model.js";
import { Prodi } from "../../modules/prodi/prodi.model.js";
import { env } from "../../config/env.js";
import type {
  AuthenticatedRole,
  AuthenticatedUserContext,
} from "../../types/auth.js";

const AUTH_BEARER_PREFIX = "Bearer ";

function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  const parsed: Record<string, string> = {};

  for (const rawPart of cookieHeader.split(";")) {
    const part = rawPart.trim();
    if (!part) {
      continue;
    }

    const separatorIndex = part.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const name = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();

    if (!name) {
      continue;
    }

    try {
      parsed[name] = decodeURIComponent(value);
    } catch {
      parsed[name] = value;
    }
  }

  return parsed;
}

function getAuthorizationToken(req: Request): string | null {
  const cookieToken = req.cookies[env.AUTH_COOKIE_NAME];
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith(AUTH_BEARER_PREFIX)) {
    return authHeader.slice(AUTH_BEARER_PREFIX.length);
  }

  return null;
}

function uniqueRoles(roles: ReadonlyArray<AuthenticatedRole>): AuthenticatedRole[] {
  const seen = new Set<string>();
  const result: AuthenticatedRole[] = [];

  for (const role of roles) {
    if (seen.has(role.id)) {
      continue;
    }

    seen.add(role.id);
    result.push(role);
  }

  return result;
}

function resolvePermissions(roles: ReadonlyArray<Role>): string[] {
  const permissions = new Set<string>();

  for (const role of roles) {
    for (const permission of role.permissions ?? []) {
      permissions.add(permission.name);
    }
  }

  return Array.from(permissions);
}

function buildUserContext(user: User): AuthenticatedUserContext {
  const eagerRoles = user.roles ?? [];
  const legacyRole = user.role;
  const allRoles = uniqueRoles([
    ...(legacyRole ? [{ id: legacyRole.id, name: legacyRole.name }] : []),
    ...eagerRoles.map((role) => ({ id: role.id, name: role.name })),
  ]);

  return {
    id: user.id,
    name: user.name ?? user.email ?? "",
    username: user.username ?? user.email ?? "",
    email: user.email,
    nidn: user.nidn ?? null,
    roleId: user.roleId,
    roles: allRoles,
    permissions: resolvePermissions([
      ...(legacyRole ? [legacyRole] : []),
      ...eagerRoles,
    ]),
    prodi: user.prodiRelation
      ? {
          id: user.prodiRelation.id,
          kodeProdi: user.prodiRelation.kodeProdi,
          namaProdi: user.prodiRelation.namaProdi,
        }
      : null,
  };
}

async function loadAuthenticatedUserContext(
  userId: string,
): Promise<AuthenticatedUserContext | null> {
  const cacheKey = `auth-context:${userId}`;
  const cached = await cacheService.get<AuthenticatedUserContext>(cacheKey);
  if (cached) {
    return cached;
  }

  const user = await User.findByPk(userId, {
    include: [
      {
        model: Role,
        as: "role",
        include: [
          {
            model: Permission,
            as: "permissions",
            attributes: ["id", "name"],
            through: { attributes: [] },
          },
        ],
      },
      {
        model: Role,
        as: "roles",
        include: [
          {
            model: Permission,
            as: "permissions",
            attributes: ["id", "name"],
            through: { attributes: [] },
          },
        ],
        through: { attributes: [] },
      },
      {
        model: Prodi,
        as: "prodiRelation",
        attributes: ["id", "kodeProdi", "namaProdi"],
        required: false,
      },
    ],
  });

  if (!user || user.deletedAt !== null) {
    return null;
  }

  const context = buildUserContext(user);
  await cacheService.set(cacheKey, context, 60);
  return context;
}

export function cookieParserMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  req.cookies = parseCookieHeader(req.headers.cookie);
  next();
}

export async function attachOptionalSession(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = getAuthorizationToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyToken(token);
    const context = await loadAuthenticatedUserContext(payload.id);
    if (context) {
      req.user = context;
    }
    next();
  } catch {
    next();
  }
}

export async function requireSession(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = getAuthorizationToken(req);
  if (!token) {
    next(HttpError.unauthorized("Harap login terlebih dahulu", "UNAUTHORIZED"));
    return;
  }

  try {
    const payload = verifyToken(token);
    const context = await loadAuthenticatedUserContext(payload.id);
    if (!context) {
      next(HttpError.unauthorized("User tidak ditemukan", "UNAUTHORIZED"));
      return;
    }

    req.user = context;
    next();
  } catch {
    next(
      HttpError.unauthorized(
        "Token tidak valid atau expired",
        "INVALID_TOKEN",
      ),
    );
  }
}
