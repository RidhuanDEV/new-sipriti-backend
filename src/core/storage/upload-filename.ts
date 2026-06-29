import path from "node:path";
import { generateUuidV7 } from "../../utils/uuid.js";

export const MAX_STORED_BASENAME_LENGTH = 80;

export function sanitizeFilenamePart(value: string): string {
  const base = path.parse(value.normalize("NFKC").trim()).name;
  const safe = base
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_\-.]+|[_\-.]+$/g, "")
    .slice(0, MAX_STORED_BASENAME_LENGTH);

  return safe || "file";
}

export function sanitizeExtension(value: string): string {
  const extension = value.trim().toLowerCase();
  if (!extension) {
    return "";
  }

  const normalized = extension.startsWith(".") ? extension : `.${extension}`;
  if (!/^\.[a-z0-9]+$/.test(normalized)) {
    return "";
  }

  return normalized;
}

export function createUploadFilename(originalFilename: string): string {
  const extension = sanitizeExtension(path.extname(originalFilename));
  return `${generateUuidV7()}-${sanitizeFilenamePart(originalFilename)}${extension}`;
}

export function createUuidOnlyFilename(originalFilename: string): string {
  const extension = sanitizeExtension(path.extname(originalFilename));
  return `${generateUuidV7()}${extension}`;
}
