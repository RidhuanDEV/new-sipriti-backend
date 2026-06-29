import { logger } from "../core/logger/logger.js";
import { deleteFileSafe } from "../core/storage/file-system.js";
import { resolveUploadPath } from "../core/storage/storage-paths.js";
import { uploadService } from "../modules/upload/upload.service.js";
import type { AuthenticatedUserContext } from "../types/auth.js";

const RICHTEXT_UPLOAD_PATH = "/uploads/richtext/";
const SECURE_RICHTEXT_UPLOAD_PATH = "/api/files/path/richtext/";

export function getRichtextFilenameFromSource(src: string): string | null {
  if (
    !src ||
    (!src.includes(RICHTEXT_UPLOAD_PATH) &&
      !src.includes(SECURE_RICHTEXT_UPLOAD_PATH))
  ) {
    return null;
  }

  try {
    const pathname = src.startsWith("http")
      ? new URL(src).pathname
      : String(src).split("?")[0]!.split("#")[0]!;
    const filename = decodeURIComponent(pathname.split("/").pop() ?? "").trim();

    if (
      !filename ||
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return null;
    }

    return filename;
  } catch {
    return null;
  }
}

export function extractRichtextUploadFilenames(
  html: string | null | undefined,
): Set<string> {
  const results = new Set<string>();
  if (!html || typeof html !== "string") return results;

  const imageSrcRegex = /<img[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi;
  let match = imageSrcRegex.exec(html);
  while (match) {
    const filename = getRichtextFilenameFromSource(match[1] ?? "");
    if (filename) results.add(filename);
    match = imageSrcRegex.exec(html);
  }

  return results;
}

export function collectRemovedRichtextImageFilenames(
  previousHtmlValues: Array<string | null | undefined>,
  nextHtmlValues: Array<string | null | undefined>,
): string[] {
  const previous = new Set<string>();
  const next = new Set<string>();

  previousHtmlValues.forEach((value) => {
    extractRichtextUploadFilenames(value).forEach((f) => previous.add(f));
  });
  nextHtmlValues.forEach((value) => {
    extractRichtextUploadFilenames(value).forEach((f) => next.add(f));
  });

  return Array.from(previous).filter((f) => !next.has(f));
}

/**
 * Best-effort deletion of richtext image files.
 * When user is provided: delegates to uploadService (marks deleted + removes file).
 * When user is null: deletes the file directly without audit (matches legacy null-user behavior).
 */
export function deleteRichtextImagesBestEffort(
  filenames: string[],
  user: AuthenticatedUserContext | null = null,
): void {
  filenames.forEach((filename) => {
    if (user) {
      uploadService.deleteRichtextImage(filename, user).catch((err: unknown) => {
        logger.warn(
          { filename, err: err instanceof Error ? err.message : String(err) },
          "[richtext-image-lifecycle] Gagal menghapus image richtext (dengan audit)",
        );
      });
    } else {
      // No authenticated user context — delete file only, skip audit
      let absolutePath: string;
      try {
        absolutePath = resolveUploadPath("richtext", filename).absolutePath;
      } catch (err) {
        logger.warn(
          { filename, err: err instanceof Error ? err.message : String(err) },
          "[richtext-image-lifecycle] Path tidak valid, skip hapus",
        );
        return;
      }
      deleteFileSafe(absolutePath).catch((err: unknown) => {
        logger.warn(
          { filename, err: err instanceof Error ? err.message : String(err) },
          "[richtext-image-lifecycle] Gagal menghapus image richtext (tanpa audit)",
        );
      });
    }
  });
}
