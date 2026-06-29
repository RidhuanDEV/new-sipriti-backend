import fs from "node:fs/promises";
import multer from "multer";
import type { ErrorRequestHandler, Request, RequestHandler } from "express";
import type { FileFilterCallback } from "multer";
import { HttpError } from "../errors/http-error.js";
import {
  validateMagicBytes,
  validateUploadFileMetadata,
} from "./file-validation.js";
import { deleteFileSafe, isNodeFileError } from "./file-system.js";
import { createUploadFilename } from "./upload-filename.js";
import { getUploadDir } from "./storage-paths.js";

export interface UploadPolicy {
  subdir: string;
  allowedMimes: ReadonlySet<string>;
  allowedExtensions: ReadonlySet<string>;
  maxFileSizeBytes: number;
  maxFiles?: number;
  filenameFactory?: (originalFilename: string) => string;
}

export interface UploadField {
  name: string;
  maxCount: number;
}

export const IMAGE_MIME_TYPES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/x-heic",
  "image/x-heif",
]);

export const DOCUMENT_MIME_TYPES: ReadonlySet<string> = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const IMAGE_EXTENSIONS: ReadonlySet<string> = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
  ".heic",
  ".heif",
]);

export const DOCUMENT_EXTENSIONS: ReadonlySet<string> = new Set([
  ".pdf",
  ".doc",
  ".docx",
]);

export const IMAGE_UPLOAD_POLICY: UploadPolicy = {
  subdir: "images",
  allowedMimes: IMAGE_MIME_TYPES,
  allowedExtensions: IMAGE_EXTENSIONS,
  maxFileSizeBytes: 5 * 1024 * 1024,
};

export function createContentUploadPolicy(subdir: string): UploadPolicy {
  return {
    subdir,
    allowedMimes: new Set([...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES]),
    allowedExtensions: new Set([...IMAGE_EXTENSIONS, ...DOCUMENT_EXTENSIONS]),
    maxFileSizeBytes: 5 * 1024 * 1024,
    maxFiles: 3,
  };
}

function createUpload(policy: UploadPolicy): multer.Multer {
  const storage = multer.diskStorage({
    destination(_req, _file, cb) {
      fs.mkdir(getUploadDir(policy.subdir), { recursive: true })
        .then(() => cb(null, getUploadDir(policy.subdir)))
        .catch((err: unknown) => cb(err instanceof Error ? err : new Error("Upload directory error"), ""));
    },
    filename(_req, file, cb) {
      cb(null, (policy.filenameFactory ?? createUploadFilename)(file.originalname));
    },
  });

  return multer({
    storage,
    fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
      const result = validateUploadFileMetadata(
        {
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: 0,
        },
        {
          allowedMimes: policy.allowedMimes,
          allowedExtensions: policy.allowedExtensions,
        },
      );

      if (!result.valid) {
        cb(new Error(result.reason ?? "Upload file tidak valid"));
        return;
      }

      cb(null, true);
    },
    limits: {
      fileSize: policy.maxFileSizeBytes,
      files: policy.maxFiles,
    },
  });
}

function collectUploadedFiles(req: Request): Express.Multer.File[] {
  if (req.file) return [req.file];
  if (!req.files) return [];
  if (Array.isArray(req.files)) return req.files;

  return Object.values(req.files).flat();
}

export function postUploadSecurityMiddleware(policy: UploadPolicy): RequestHandler {
  return async (req, _res, next) => {
    const files = collectUploadedFiles(req);

    try {
      for (const file of files) {
        const metadataResult = validateUploadFileMetadata(
          {
            originalName: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
          },
          {
            allowedMimes: policy.allowedMimes,
            allowedExtensions: policy.allowedExtensions,
            maxSizeBytes: policy.maxFileSizeBytes,
          },
        );
        if (!metadataResult.valid) {
          throw HttpError.badRequest(
            metadataResult.reason ?? "Upload file tidak valid",
            [],
            "UPLOAD_ERROR",
          );
        }

        const buffer = await readHeaderBytes(file.path);
        const magicResult = validateMagicBytes(buffer, file.mimetype);
        if (!magicResult.valid) {
          throw HttpError.badRequest(
            "File signature tidak valid. File mungkin telah dimanipulasi.",
            [],
            "INVALID_FILE_SIGNATURE",
          );
        }
      }

      next();
    } catch (err) {
      await Promise.all(files.map((file) => deleteFileSafe(file.path)));
      next(err);
    }
  };
}

async function readHeaderBytes(filePath: string): Promise<Uint8Array> {
  const handle = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(32);
    const result = await handle.read(buffer, 0, buffer.length, 0);
    return buffer.subarray(0, result.bytesRead);
  } finally {
    await handle.close();
  }
}

export function createSingleUpload(
  fieldName: string,
  policy: UploadPolicy,
): RequestHandler[] {
  const upload = createUpload(policy);
  return [upload.single(fieldName), postUploadSecurityMiddleware(policy)];
}

export function createArrayUpload(
  fieldName: string,
  maxCount: number,
  policy: UploadPolicy,
): RequestHandler[] {
  const upload = createUpload({ ...policy, maxFiles: maxCount });
  return [upload.array(fieldName, maxCount), postUploadSecurityMiddleware(policy)];
}

export function createFieldsUpload(
  fields: ReadonlyArray<UploadField>,
  policy: UploadPolicy,
): RequestHandler[] {
  const upload = createUpload(policy);
  return [upload.fields([...fields]), postUploadSecurityMiddleware(policy)];
}

export function createUploadErrorHandler(maxFileSizeMb: number): ErrorRequestHandler {
  return (err, _req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({
          success: false,
          message: `Ukuran file terlalu besar. Maksimal ${maxFileSizeMb}MB per file`,
          error: "UPLOAD_ERROR",
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: err.message,
        error: "UPLOAD_ERROR",
      });
      return;
    }

    if (err instanceof Error && isUploadErrorMessage(err.message)) {
      res.status(400).json({
        success: false,
        message: err.message,
        error: "UPLOAD_ERROR",
      });
      return;
    }

    next(err);
  };
}

export function createLandingSliderUploadErrorHandler(): ErrorRequestHandler {
  return (err, _req, res, next) => {
    if (err instanceof multer.MulterError) {
      res.status(400).json({
        success: false,
        message:
          err.code === "LIMIT_FILE_SIZE"
            ? "Ukuran file terlalu besar. Maksimal 10MB per file"
            : err.message,
        error: err.code === "LIMIT_FILE_SIZE" ? "FILE_TOO_LARGE" : "UPLOAD_ERROR",
      });
      return;
    }

    if (err instanceof Error && err.message.includes("Format tidak didukung")) {
      res.status(400).json({
        success: false,
        message: err.message,
        error: "INVALID_FILE_FORMAT",
      });
      return;
    }

    next(err);
  };
}

export async function ignoreMissingFileDeletion(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (isNodeFileError(err) && err.code === "ENOENT") return;
    throw err;
  }
}

function isUploadErrorMessage(message: string): boolean {
  return /diperbolehkan|tidak didukung|ukuran file terlalu besar|format tidak didukung|ekstensi/i.test(
    message,
  );
}
