import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import { env } from "../../config/env.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { USER_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import {
  clearCSRFToken,
  refreshCSRFToken,
} from "../../core/csrf/csrf.middleware.js";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import {
  adminUpdateUserSchema,
  changePasswordSchema,
  listUsersQuerySchema,
  searchUsersQuerySchema,
  updateProfileSchema,
  userIdParamSchema,
} from "./auth.schema.js";

const service = new AuthService();

interface AuthAuditUser {
  id: string;
  name: string | null;
  email: string | null;
}

function setAuthCookie(res: Response, token: string): void {
  const secure = env.NODE_ENV === "production";
  res.cookie(env.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
}

function clearAuthCookie(res: Response): void {
  const secure = env.NODE_ENV === "production";
  res.clearCookie(env.AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
}

function getHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value ?? null;
}

function persistAuthAudit(
  action: typeof AuditAction.LOGIN | typeof AuditAction.LOGOUT,
  user: AuthAuditUser | undefined,
  req: Request,
): void {
  if (!user) {
    return;
  }

  const displayName = user.name ?? user.email ?? "User";
  const activity = action === AuditAction.LOGIN ? "melakukan login" : "melakukan logout";

  auditService.persistNonBlocking({
    action,
    module: USER_MODULE,
    entityType: "User",
    entityId: user.id,
    userId: user.id,
    userName: user.name,
    description: `${displayName} ${activity}`,
    ipAddress: req.ip ?? null,
    userAgent: getHeaderValue(req.headers["user-agent"]),
    httpMethod: req.method,
    endpoint: req.originalUrl || req.path,
    requestId: req.requestId,
  });
}

export class AuthController {
  register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await service.register(req.body, req.user, req.requestId);
      setAuthCookie(res, result.token);
      refreshCSRFToken(res);
      sendSuccess(res, {
        statusCode: 201,
        message: "Registrasi berhasil",
        data: { user: result.user },
      });
    } catch (err) {
      next(err);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await service.login(req.body);
      setAuthCookie(res, result.token);
      refreshCSRFToken(res);
      persistAuthAudit(AuditAction.LOGIN, result.user, req);
      sendSuccess(res, {
        message: "Login berhasil",
        data: { user: result.user },
      });
    } catch (err) {
      next(err);
    }
  };

  me = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authUser = requireAuthenticatedUser(req);
      const user = await service.me(authUser.id);
      sendSuccess(res, {
        message: "Data user berhasil diambil",
        data: { ...user, permissions: authUser.permissions },
      });
    } catch (err) {
      next(err);
    }
  };

  searchUsers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authUser = requireAuthenticatedUser(req);
      const query = searchUsersQuerySchema.parse(req.query);
      const users = await service.searchUsers(query, authUser.id);
      sendSuccess(res, {
        message: "Pencarian pengguna berhasil",
        data: users,
      });
    } catch (err) {
      next(err);
    }
  };

  listUsers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = listUsersQuerySchema.parse(req.query);
      const result = await service.listUsers(query);
      sendSuccess(res, {
        message: "Daftar pengguna berhasil diambil",
        data: result.users,
        meta: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  };

  listUsersAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = listUsersQuerySchema.parse(req.query);
      const result = await service.listUsersAdmin(query);
      sendSuccess(res, {
        message: "Berhasil mendapatkan daftar users",
        data: result.users,
        meta: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authUser = requireAuthenticatedUser(req);
      const body = changePasswordSchema.parse(req.body);
      await service.changePassword(authUser.id, body);
      sendSuccess(res, { message: "Password berhasil diubah" });
    } catch (err) {
      next(err);
    }
  };

  updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authUser = requireAuthenticatedUser(req);
      const body = updateProfileSchema.parse(req.body);
      const user = await service.updateProfile(authUser, body);
      sendSuccess(res, {
        message: "Profil berhasil diperbarui",
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  };

  getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const params = userIdParamSchema.parse(req.params);
      const user = await service.getUserById(params.id);
      sendSuccess(res, {
        message: "Data pengguna berhasil diambil",
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  };

  adminUpdateUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authUser = requireAuthenticatedUser(req);
      const params = userIdParamSchema.parse(req.params);
      const body = adminUpdateUserSchema.parse(req.body);
      const user = await service.adminUpdateUser(params.id, body, authUser, req.requestId);
      sendSuccess(res, {
        message: "User berhasil diperbarui",
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  };

  deactivateUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authUser = requireAuthenticatedUser(req);
      const params = userIdParamSchema.parse(req.params);
      const result = await service.deactivateUserById(params.id, authUser, req.requestId);
      sendSuccess(res, {
        message: "Akun pengguna berhasil dinonaktifkan",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  restoreUserById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authUser = requireAuthenticatedUser(req);
      const params = userIdParamSchema.parse(req.params);
      const result = await service.restoreUserById(params.id, authUser, req.requestId);
      sendSuccess(res, {
        message: "Akun pengguna berhasil dipulihkan",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  logout = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    try {
      const authUser = req.user;
      clearAuthCookie(res);
      clearCSRFToken(res);
      persistAuthAudit(AuditAction.LOGOUT, authUser, req);
      sendSuccess(res, { message: "Logout berhasil" });
    } catch (err) {
      next(err);
    }
  };
}
