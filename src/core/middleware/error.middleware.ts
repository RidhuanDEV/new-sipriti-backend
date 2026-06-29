import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../errors/http-error.js";
import { logger } from "../logger/logger.js";
import type { ApiFailure } from "../../types/api/common.js";

function sendError(
  res: Response,
  statusCode: number,
  message: string | string[],
  error: string,
): void {
  const body: ApiFailure = {
    success: false,
    message,
    error,
  };
  res.status(statusCode).json(body);
}

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId;

  if (err instanceof HttpError) {
    logger.warn({
      requestId,
      statusCode: err.statusCode,
      message: err.message,
      path: req.path,
      method: req.method,
    });

    sendError(res, err.statusCode, err.responseMessage, err.code);
    return;
  }

  if (err.name === "JsonWebTokenError") {
    sendError(
      res,
      401,
      "Token autentikasi tidak valid. Silakan login kembali.",
      "INVALID_TOKEN",
    );
    return;
  }

  if (err.name === "TokenExpiredError") {
    sendError(
      res,
      401,
      "Sesi Anda telah berakhir. Silakan login kembali.",
      "TOKEN_EXPIRED",
    );
    return;
  }

  logger.error({
    requestId,
    err,
    path: req.path,
    method: req.method,
  });

  sendError(
    res,
    500,
    "Terjadi kesalahan pada server. Silakan coba lagi.",
    "INTERNAL_ERROR",
  );
}
