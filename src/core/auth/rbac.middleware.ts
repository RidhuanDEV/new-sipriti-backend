import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../errors/http-error.js";
import type { PermissionName } from "../../constants/permissions.constants.js";

export function requirePermission(permissionName: PermissionName) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void => {
    const user = req.user;

    if (!user) {
      next(HttpError.unauthorized("Harap login terlebih dahulu"));
      return;
    }

    if (!user.permissions.includes(permissionName)) {
      next(HttpError.forbidden(`Akses ditolak: ${permissionName}`));
      return;
    }

    next();
  };
}

export function requireAnyPermission(permissionNames: ReadonlyArray<PermissionName>) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void => {
    const user = req.user;

    if (!user) {
      next(HttpError.unauthorized("Harap login terlebih dahulu"));
      return;
    }

    const hasPermission = permissionNames.some((permissionName) =>
      user.permissions.includes(permissionName),
    );

    if (!hasPermission) {
      next(HttpError.forbidden("Akses ditolak"));
      return;
    }

    next();
  };
}
