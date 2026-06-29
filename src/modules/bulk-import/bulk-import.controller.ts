import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../core/errors/http-error.js";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";
import { downloadTemplateBodySchema } from "./bulk-import.schema.js";
import { generateTemplateBuffer } from "./excel-template.service.js";
import { processImport } from "./excel-import.service.js";

function requestId(req: Request): string | undefined {
  const value = req.headers["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

function resolveAllowedTipeUsulanOptions(permissions: ReadonlyArray<string>): Array<"Penelitian" | "Pengabdian"> {
  const allowed: Array<"Penelitian" | "Pengabdian"> = [];
  if (permissions.includes("manage_penelitian")) allowed.push("Penelitian");
  if (permissions.includes("manage_pengabdian")) allowed.push("Pengabdian");
  return allowed;
}

function assertXlsxFile(file: Express.Multer.File | undefined): Express.Multer.File {
  if (!file) throw HttpError.badRequest("File Excel wajib diunggah");
  if (file.mimetype !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    throw HttpError.badRequest("Format file tidak didukung. Gunakan file .xlsx");
  }
  if (!file.originalname.toLowerCase().endsWith(".xlsx")) {
    throw HttpError.badRequest("Format file tidak didukung. Gunakan file .xlsx");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw HttpError.badRequest("Ukuran file melebihi batas maksimum 5MB");
  }
  if (
    !Buffer.isBuffer(file.buffer) ||
    file.buffer.length < 4 ||
    file.buffer[0] !== 0x50 ||
    file.buffer[1] !== 0x4b ||
    ![0x03, 0x05, 0x07].includes(file.buffer[2] ?? -1)
  ) {
    throw HttpError.badRequest("File Excel tidak valid atau rusak");
  }
  return file;
}

export class BulkImportController {
  downloadTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = requireAuthenticatedUser(req);
      const allowedTipeUsulanOptions = resolveAllowedTipeUsulanOptions(user.permissions);
      if (allowedTipeUsulanOptions.length === 0) {
        throw HttpError.forbidden("Anda tidak memiliki izin untuk mengunduh template import usulan.");
      }
      const body = downloadTemplateBodySchema.parse(req.body);
      const buffer = await generateTemplateBuffer({ allowedTipeUsulanOptions, selectedAnggota: body.anggota });
      const filename = `Template_Import_Usulan_${new Date().toISOString().slice(0, 10)}.xlsx`;
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);
      res.end(buffer);
    } catch (err) {
      next(err);
    }
  };

  importUsulan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = assertXlsxFile(req.file);
      const result = await processImport(file.buffer, requireAuthenticatedUser(req), requestId(req));
      const message =
        result.failedCount > 0
          ? `Import dibatalkan: ${result.failedCount} baris bermasalah dari total ${result.totalRows} baris. Tidak ada data yang tersimpan.`
          : `Import selesai: ${result.successCount} berhasil dari total ${result.totalRows} baris`;
      sendSuccess(res, { message, data: result });
    } catch (err) {
      next(err);
    }
  };
}

export { resolveAllowedTipeUsulanOptions };
