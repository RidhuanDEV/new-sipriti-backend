import type { NextFunction, Request, Response } from "express";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { CapaianService } from "./capaian.service.js";
import { capaianRangeQuerySchema } from "./capaian.schema.js";
import type { DeskripsiCapaianSectionKeyDto, UpsertDeskripsiDto } from "./dto/capaian.dto.js";

const service = new CapaianService();

function getRequestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

export class CapaianController {
  getPublikasiPivot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.getPublikasiPivot(capaianRangeQuerySchema.parse(req.query));
      res.status(200).json({
        success: true,
        header_tahun: result.headerTahun,
        data_tabel: result.dataTabel,
      });
    } catch (err) {
      next(err);
    }
  };

  getCapaianStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Berhasil mengambil statistik capaian", data: await service.getCapaianStats() });
    } catch (err) {
      next(err);
    }
  };

  getTotalDanaHibah = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Berhasil mengambil total dana hibah", data: await service.getTotalDanaHibah() });
    } catch (err) {
      next(err);
    }
  };

  getTotalMitraRiset = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Berhasil mengambil total mitra kerja riset", data: await service.getTotalMitraRiset() });
    } catch (err) {
      next(err);
    }
  };

  getTotalHki = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Berhasil mengambil total HKI", data: await service.getTotalHki() });
    } catch (err) {
      next(err);
    }
  };

  getTotalPublikasi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Berhasil mengambil total publikasi", data: await service.getTotalPublikasi(capaianRangeQuerySchema.parse(req.query)) });
    } catch (err) {
      next(err);
    }
  };

  getStaticContent = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Berhasil mengambil konten statis", data: await service.getStaticContent() });
    } catch (err) {
      next(err);
    }
  };

  getAllDeskripsi = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Berhasil mengambil deskripsi capaian", data: await service.getAllDeskripsi() });
    } catch (err) {
      next(err);
    }
  };

  getDeskripsiBySection = async (req: Request<{ sectionKey: DeskripsiCapaianSectionKeyDto }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { message: "Berhasil mengambil deskripsi", data: await service.getDeskripsiBySection(req.params.sectionKey) });
    } catch (err) {
      next(err);
    }
  };

  upsertDeskripsi = async (
    req: Request<{ sectionKey: DeskripsiCapaianSectionKeyDto }, unknown, UpsertDeskripsiDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await service.upsertDeskripsi(req.params.sectionKey, req.body, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, {
        statusCode: result.created ? 201 : 200,
        message: result.created ? "Deskripsi berhasil dibuat" : "Deskripsi berhasil diperbarui",
        data: result.row,
      });
    } catch (err) {
      next(err);
    }
  };

  batchUpsertDeskripsi = async (
    req: Request<Record<string, string>, unknown, { items?: Array<{ section_key: DeskripsiCapaianSectionKeyDto; content?: string | null; deskripsi?: string | null }>; sections?: Array<{ section_key: DeskripsiCapaianSectionKeyDto; content?: string | null; deskripsi?: string | null }> }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await service.batchUpsertDeskripsi(req.body, requireAuthenticatedUser(req), getRequestId(req));
      sendSuccess(res, { message: "Deskripsi berhasil diperbarui", data });
    } catch (err) {
      next(err);
    }
  };
}
