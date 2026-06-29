import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { JwtUserPayload } from "../../types/index.js";

export function signToken(payload: JwtUserPayload): string {
  const expiresInSeconds = env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60;

  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresInSeconds });
}

export function verifyToken(token: string): JwtUserPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  
  if (
    decoded &&
    typeof decoded === "object" &&
    "id" in decoded &&
    typeof decoded.id === "string"
  ) {
    const email = "email" in decoded && typeof decoded.email === "string"
      ? decoded.email
      : undefined;
    const roleId = "roleId" in decoded && typeof decoded.roleId === "string"
      ? decoded.roleId
      : undefined;

    return {
      id: decoded.id,
      ...(email === undefined ? {} : { email }),
      ...(roleId === undefined ? {} : { roleId }),
    };
  }
  
  throw new Error("Invalid token payload structure");
}
