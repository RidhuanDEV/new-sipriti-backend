import { HttpError } from "../../core/errors/http-error.js";
import { fileExists } from "../../core/storage/file-system.js";
import { resolveUploadPath } from "../../core/storage/storage-paths.js";
import { filesService } from "../files/files.service.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { RichtextUploadResponseDto, UploadImageResponseDto } from "./dto/upload.dto.js";

export class UploadService {
  async uploadImage(
    file: Express.Multer.File | undefined,
    user: AuthenticatedUserContext,
  ): Promise<UploadImageResponseDto> {
    if (!file) throw HttpError.badRequest("Tidak ada file yang diupload", [], "NO_FILE");

    const metadata = await filesService.registerUploadedFile({
      file,
      subdir: "images",
      ownerUserId: user.id,
      entityType: "generic_image",
      visibility: "public",
      createdBy: user.id,
    });

    return {
      id: metadata?.id ?? null,
      filename: file.filename,
      url: filesService.toPublicUrl("images", file.filename),
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async uploadMultipleImages(
    files: ReadonlyArray<Express.Multer.File>,
    user: AuthenticatedUserContext,
  ): Promise<UploadImageResponseDto[]> {
    if (files.length === 0) {
      throw HttpError.badRequest("Tidak ada file yang diupload", [], "NO_FILE");
    }

    return Promise.all(files.map((file) => this.uploadImage(file, user)));
  }

  async deleteImage(filename: string, user: AuthenticatedUserContext): Promise<void> {
    const resolved = resolveUploadPath("images", filename);
    if (!(await fileExists(resolved.absolutePath))) {
      throw HttpError.notFound("File tidak ditemukan");
    }

    await filesService.markDeletedByPath("images", filename, user);
  }

  async registerRichtextImage(
    file: Express.Multer.File | undefined,
    user: AuthenticatedUserContext,
  ): Promise<RichtextUploadResponseDto> {
    if (!file) throw HttpError.badRequest("Tidak ada file yang diupload", [], "NO_FILE");

    const metadata = await filesService.registerUploadedFile({
      file,
      subdir: "richtext",
      ownerUserId: user.id,
      entityType: "richtext",
      visibility: "private",
      createdBy: user.id,
    });

    return {
      id: metadata?.id ?? null,
      url: `/api/files/path/richtext/${file.filename}`,
    };
  }

  async deleteRichtextImage(
    filename: string,
    user: AuthenticatedUserContext,
  ): Promise<boolean> {
    const resolved = resolveUploadPath("richtext", filename);
    if (!(await fileExists(resolved.absolutePath))) return false;

    await filesService.markDeletedByPath("richtext", filename, user);
    return true;
  }
}

export const uploadService = new UploadService();
