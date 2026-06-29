import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { env } from "../../config/env.js";

export const CSRF_COOKIE_NAME = "XSRF-TOKEN";
export const CSRF_HEADER_NAME = "x-csrf-token";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

function isLogoutRoute(req: Request): boolean {
  return (
    req.method === "POST" &&
    (req.path === "/auth/logout" || req.path === "/users/logout")
  );
}

function csrfTokensMatch(cookieToken: string, headerToken: string): boolean {
  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);

  if (cookieBuffer.length !== headerBuffer.length) {
    return false;
  }

  return timingSafeEqual(cookieBuffer, headerBuffer);
}

function setCsrfCookie(res: Response, token: string): void {
  const secure = env.CSRF_SAMESITE === "none" || env.NODE_ENV === "production";
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure,
    sameSite: env.CSRF_SAMESITE,
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
}

function getHeaderToken(req: Request): string | null {
  const value = req.headers[CSRF_HEADER_NAME];
  return typeof value === "string" ? value : null;
}

export function refreshCSRFToken(res: Response): string {
  const token = generateCsrfToken();
  setCsrfCookie(res, token);
  return token;
}

export function clearCSRFToken(res: Response): void {
  const secure = env.CSRF_SAMESITE === "none" || env.NODE_ENV === "production";
  const clearOptions = {
    path: "/",
    secure,
    sameSite: env.CSRF_SAMESITE,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
  res.clearCookie(CSRF_COOKIE_NAME, clearOptions);
}

export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!env.CSRF_ENABLED) {
    next();
    return;
  }

  const existingToken = req.cookies[CSRF_COOKIE_NAME];
  const token = existingToken || generateCsrfToken();
  req.csrfToken = token;

  if (!existingToken) {
    setCsrfCookie(res, token);
  }

  if (SAFE_METHODS.has(req.method) || isLogoutRoute(req)) {
    next();
    return;
  }

  const headerToken = getHeaderToken(req);
  if (!headerToken || !csrfTokensMatch(token, headerToken)) {
    res.status(403).json({
      success: false,
      message: "Token CSRF tidak valid atau tidak ditemukan",
      error: "FORBIDDEN",
    });
    return;
  }

  next();
}
