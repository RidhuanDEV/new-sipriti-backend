import path from "node:path";
import { env } from "../../config/env.js";
import { HttpError } from "../errors/http-error.js";

export const UPLOAD_PUBLIC_PREFIX = "/uploads/";
export const PUBLIC_STATIC_SUBDIRS = Object.freeze([
  "berita",
  "pengumuman",
  "panduan",
  "landing-slider",
  "images",
  "proposals",
  "laporan-kemajuan",
  "laporan-akhir",
  "proposal-final-pdf",
  "monev",
]);

export interface ResolvedUploadPath {
  absolutePath: string;
  subdir: string;
  filename: string;
}

export function getUploadRootDir(): string {
  return path.resolve(process.cwd(), env.UPLOAD_ROOT_DIR);
}

export function normalizeUploadSubdir(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, "");
}

export function assertSafeSubdir(value: string): string {
  const subdir = normalizeUploadSubdir(value);
  if (
    subdir.length === 0 ||
    subdir.includes("..") ||
    subdir.includes("\\") ||
    path.isAbsolute(subdir)
  ) {
    throw HttpError.badRequest("Direktori file tidak valid", [], "INVALID_SUBDIR");
  }

  return subdir;
}

export function assertSafeFilename(value: string): string {
  const filename = value.trim();
  if (
    filename.length === 0 ||
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    throw HttpError.badRequest("Nama file tidak valid", [], "INVALID_FILENAME");
  }

  return filename;
}

export function getUploadDir(subdir: string): string {
  return path.join(getUploadRootDir(), assertSafeSubdir(subdir));
}

export function resolveUploadPath(
  subdir: string,
  filename: string,
): ResolvedUploadPath {
  const safeSubdir = assertSafeSubdir(subdir);
  const safeFilename = assertSafeFilename(filename);
  const uploadRoot = getUploadRootDir();
  const absolutePath = path.resolve(uploadRoot, safeSubdir, safeFilename);
  const rootPrefix = `${path.resolve(uploadRoot)}${path.sep}`;

  if (!absolutePath.startsWith(rootPrefix)) {
    throw HttpError.badRequest("Path file tidak valid", [], "INVALID_FILE_PATH");
  }

  return {
    absolutePath,
    subdir: safeSubdir,
    filename: safeFilename,
  };
}

export function toPublicUploadUrl(subdir: string, filename: string): string {
  return `${UPLOAD_PUBLIC_PREFIX}${assertSafeSubdir(subdir)}/${assertSafeFilename(
    filename,
  )}`;
}

export function fromPublicUploadUrl(publicUrl: string): ResolvedUploadPath | null {
  if (!publicUrl.startsWith(UPLOAD_PUBLIC_PREFIX)) {
    return null;
  }

  const relativePath = publicUrl.slice(UPLOAD_PUBLIC_PREFIX.length);
  const separatorIndex = relativePath.indexOf("/");
  if (separatorIndex <= 0 || separatorIndex === relativePath.length - 1) {
    return null;
  }

  return resolveUploadPath(
    relativePath.slice(0, separatorIndex),
    relativePath.slice(separatorIndex + 1),
  );
}
