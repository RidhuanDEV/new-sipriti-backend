import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { PublikasiService } from "./publikasi.service.js";
import { listPublikasiQuerySchema } from "./publikasi.schema.js";
import type { UpsertPublikasiDto } from "./dto/publikasi.dto.js";

const service = new PublikasiService();

function getRequestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

export class PublikasiController {
  listPublikasi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.listPublikasi(listPublikasiQuerySchema.parse(req.query));
      sendSuccess(res, { message: "Berhasil mengambil data publikasi", data: result.data, meta: result.meta });
    } catch (err) {
      next(err);
    }
  };

  upsertPublikasi = async (
    req: Request<Record<string, string>, unknown, UpsertPublikasiDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.upsertPublikasi(req.body, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Data berhasil diperbarui", data });
    } catch (err) {
      next(err);
    }
  };
}
