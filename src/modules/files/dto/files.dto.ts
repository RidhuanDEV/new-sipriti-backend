import type { UploadedFile, UploadedFileVisibility } from "../uploaded-file.model.js";

export interface RegisterUploadedFileDto {
  file: Express.Multer.File;
  subdir: string;
  ownerUserId: string | null;
  entityType: string;
  entityId?: string | null;
  visibility: UploadedFileVisibility;
  createdBy: string | null;
}

export interface ResolvedFileDto {
  absolutePath: string;
  filename: string;
  mimeType: string | null;
}

export interface UploadedFileResponseDto {
  id: string;
  url: string;
  filename: string;
  original_filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  visibility: UploadedFileVisibility;
}

export type UploadedFileRecord = UploadedFile;
