import type { Request } from "express";
import { HttpError } from "../errors/http-error.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";

export function requireAuthenticatedUser(req: Request): AuthenticatedUserContext {
  const { user } = req;

  if (!user) {
    throw HttpError.unauthorized("Harap login terlebih dahulu");
  }

  return user;
}

export function requireRouteParam(req: Request, key: string): string {
  const value = req.params[key];

  if (typeof value !== "string" || value.length === 0) {
    throw HttpError.badRequest(`Missing or invalid route parameter: ${key}`);
  }

  return value;
}
