import type { Response } from "express";
import type { PaginationMeta } from "../types/index.js";
import type { ApiSuccess } from "../types/api/common.js";

interface SuccessOptions<TData = unknown, TMeta = PaginationMeta> {
  data?: TData | null;
  meta?: TMeta;
  message?: string;
  statusCode?: number;
}

export function sendSuccess<TData = unknown, TMeta = PaginationMeta>(
  res: Response,
  options: SuccessOptions<TData, TMeta> = {},
): void {
  const {
    data,
    meta,
    message = "Berhasil",
    statusCode = 200,
  } = options;
  const body: ApiSuccess<TData | null, TMeta> = {
    success: true,
    message,
  };

  if (data !== undefined) {
    body.data = data;
  }

  if (meta !== undefined) {
    body.meta = meta;
  }

  res.status(statusCode).json(body);
}

export function sendCreated(
  res: Response,
  data: unknown,
  message = "Berhasil dibuat",
): void {
  sendSuccess(res, { data, message, statusCode: 201 });
}

export function sendNoContent(res: Response): void {
  res.status(204).end();
}
