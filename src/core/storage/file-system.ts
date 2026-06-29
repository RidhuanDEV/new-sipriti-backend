import crypto from "node:crypto";
import fs from "node:fs/promises";
import type { PathLike } from "node:fs";

export async function deleteFileSafe(filePath: string | null): Promise<void> {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (isNodeFileError(err) && err.code === "ENOENT") return;
    throw err;
  }
}

export async function fileExists(filePath: PathLike): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch (err) {
    if (isNodeFileError(err) && err.code === "ENOENT") return false;
    throw err;
  }
}

export async function calculateSha256IfExists(filePath: string): Promise<string | null> {
  try {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash("sha256").update(fileBuffer).digest("hex");
  } catch (err) {
    if (isNodeFileError(err) && err.code === "ENOENT") return null;
    throw err;
  }
}

export function isNodeFileError(err: unknown): err is NodeJS.ErrnoException {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof err.code === "string"
  );
}
