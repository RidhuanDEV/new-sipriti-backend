import type { Request, Response, NextFunction } from "express";
import { requireSession } from "./session.middleware.js";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  await requireSession(req, res, next);
}
