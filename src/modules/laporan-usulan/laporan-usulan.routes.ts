import fs from "node:fs/promises";
import multer from "multer";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { FileFilterCallback } from "multer";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requireAnyPermission } from "../../core/auth/rbac.middleware.js";
import { HttpError } from "../../core/errors/http-error.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import {
  DOCUMENT_EXTENSIONS,
  DOCUMENT_MIME_TYPES,
  createUploadErrorHandler,
  postUploadSecurityMiddleware,
} from "../../core/storage/upload.middleware.js";
import { validateUploadFileMetadata } from "../../core/storage/file-validation.js";
import { getUploadDir } from "../../core/storage/storage-paths.js";
import { createUploadFilename } from "../../core/storage/upload-filename.js";
import { LaporanUsulan } from "../proposal/laporan-usulan.model.js";
import { LaporanUsulanController } from "./laporan-usulan.controller.js";
import {
  createLaporanBodySchema,
  createLaporanQuerySchema,
  updateLaporanParamSchema,
  updateLaporanBodySchema,
  validateLaporanBodySchema,
} from "./laporan-usulan.schema.js";
import { getLaporanUploadSubdir } from "./laporan-usulan.service.js";
import { Router } from "express";

const router = Router();
const controller = new LaporanUsulanController();

function resolveJenisLaporan(req: Request): string | null {
  if (typeof req.body?.jenis_laporan === "string" && req.body.jenis_laporan.trim()) return req.body.jenis_laporan.trim();
  if (typeof req.query.jenis_laporan === "string" && req.query.jenis_laporan.trim()) return req.query.jenis_laporan.trim();
  return null;
}

function resolveParamId(req: Request): string | null {
  const value = req.params.id;
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    const [first] = value;
    return typeof first === "string" && first.trim() ? first : null;
  }
  return null;
}

const setLaporanUploadSubdir: RequestHandler = async (req, _res, next) => {
  try {
    let jenisLaporan = resolveJenisLaporan(req);
    const id = resolveParamId(req);
    if (!jenisLaporan && id) {
      const laporan = await LaporanUsulan.findByPk(id, { attributes: ["jenis_laporan"] });
      jenisLaporan = laporan?.jenis_laporan ?? null;
    }
    if (jenisLaporan !== "laporan_kemajuan" && jenisLaporan !== "laporan_akhir") {
      next(HttpError.badRequest("Jenis laporan tidak valid atau tidak ditemukan"));
      return;
    }
    req.uploadSubDir = getLaporanUploadSubdir(jenisLaporan);
    next();
  } catch (err) {
    next(err);
  }
};

const laporanUploadPolicy = {
  subdir: "laporan-kemajuan",
  allowedMimes: DOCUMENT_MIME_TYPES,
  allowedExtensions: DOCUMENT_EXTENSIONS,
  maxFileSizeBytes: 5 * 1024 * 1024,
};

const upload = multer({
  storage: multer.diskStorage({
    destination(req, _file, cb) {
      const subdir = req.uploadSubDir;
      if (!subdir) {
        cb(HttpError.badRequest("Direktori upload laporan tidak valid"), "");
        return;
      }
      fs.mkdir(getUploadDir(subdir), { recursive: true })
        .then(() => cb(null, getUploadDir(subdir)))
        .catch((err: unknown) => cb(err instanceof Error ? err : new Error("Upload directory error"), ""));
    },
    filename(_req, file, cb) {
      cb(null, createUploadFilename(file.originalname));
    },
  }),
  fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
    const result = validateUploadFileMetadata(
      { originalName: file.originalname, mimeType: file.mimetype, sizeBytes: 0 },
      { allowedMimes: DOCUMENT_MIME_TYPES, allowedExtensions: DOCUMENT_EXTENSIONS },
    );
    if (!result.valid) {
      cb(new Error(result.reason ?? "Upload file tidak valid"));
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: laporanUploadPolicy.maxFileSizeBytes, files: 1 },
});

const laporanUpload: RequestHandler[] = [
  setLaporanUploadSubdir,
  upload.single("file"),
  postUploadSecurityMiddleware(laporanUploadPolicy),
];

router.get("/", authenticate, requireAnyPermission(["view_proposal", "manage_penelitian", "manage_pengabdian", "edit_usulan_by_prodi"]), controller.listLaporanUsulan);
router.get("/:id", authenticate, requireAnyPermission(["view_proposal", "manage_penelitian", "manage_pengabdian", "edit_usulan_by_prodi"]), validate({ params: updateLaporanParamSchema }), controller.getLaporanDetail);
router.post(
  "/",
  authenticate,
  requireAnyPermission(["create_proposal", "edit_proposal"]),
  validate({ query: createLaporanQuerySchema }),
  ...laporanUpload,
  validate({ body: createLaporanBodySchema }),
  controller.createLaporanUsulan,
);
router.put(
  "/:id",
  authenticate,
  requireAnyPermission(["create_proposal", "edit_proposal"]),
  validate({ params: updateLaporanParamSchema }),
  ...laporanUpload,
  validate({ body: updateLaporanBodySchema }),
  controller.updateLaporanUsulan,
);
router.put(
  "/:id/validate",
  authenticate,
  requireAnyPermission(["manage_penelitian", "manage_pengabdian", "review_proposal"]),
  validate({ params: updateLaporanParamSchema, body: validateLaporanBodySchema }),
  controller.validateLaporanUsulan,
);

router.use(createUploadErrorHandler(5));

export const path = "/laporan-usulan";
export default router;
