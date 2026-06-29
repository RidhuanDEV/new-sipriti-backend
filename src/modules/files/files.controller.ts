import type { NextFunction, Request, Response } from "express";
import { filesService } from "./files.service.js";
import { fileDownloadQuerySchema } from "./files.schema.js";

function setSafeFileHeaders(
  res: Response,
  file: { filename: string; mimeType: string | null },
  disposition: "inline" | "attachment",
): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader(
    "Content-Disposition",
    filesService.getContentDisposition(file.filename, disposition),
  );

  if (file.mimeType) {
    res.setHeader("Content-Type", file.mimeType);
  }
}

export class FilesController {
  getFileById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = fileDownloadQuerySchema.parse(req.query);
      const file = await filesService.resolveFileById(req.params.id, req.user ?? null);
      setSafeFileHeaders(res, file, query.download ? "attachment" : "inline");
      res.sendFile(file.absolutePath);
    } catch (err) {
      next(err);
    }
  };

  getFileByPath = async (
    req: Request<{ subdir: string; filename: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = fileDownloadQuerySchema.parse(req.query);
      const file = await filesService.resolveFileByPath(
        req.params.subdir,
        req.params.filename,
        req.user ?? null,
      );
      setSafeFileHeaders(res, file, query.download ? "attachment" : "inline");
      res.sendFile(file.absolutePath);
    } catch (err) {
      next(err);
    }
  };
}
