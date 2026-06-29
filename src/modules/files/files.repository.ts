import { UploadedFile } from "./uploaded-file.model.js";
import type { Transaction } from "sequelize";

export class FilesRepository {
  findById(id: string): Promise<UploadedFile | null> {
    return UploadedFile.findByPk(id);
  }

  findByStoragePath(subdir: string, filename: string): Promise<UploadedFile | null> {
    return UploadedFile.findOne({
      where: {
        subdir,
        storedFilename: filename,
      },
    });
  }

  async findOrCreate(
    data: {
      ownerUserId: string | null;
      entityType: string;
      entityId: string | null;
      visibility: "public" | "private";
      subdir: string;
      storedFilename: string;
      originalFilename: string | null;
      mimeType: string | null;
      sizeBytes: number | null;
      sha256: string | null;
      createdBy: string | null;
    },
    transaction?: Transaction,
  ): Promise<UploadedFile> {
    const [record, created] = await UploadedFile.findOrCreate({
      where: {
        subdir: data.subdir,
        storedFilename: data.storedFilename,
      },
      defaults: {
        ownerUserId: data.ownerUserId,
        entityType: data.entityType,
        entityId: data.entityId,
        visibility: data.visibility,
        subdir: data.subdir,
        storedFilename: data.storedFilename,
        originalFilename: data.originalFilename,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        sha256: data.sha256,
        status: "active",
        createdBy: data.createdBy,
        deletedBy: null,
        deletedAt: null,
      },
      ...(transaction ? { transaction } : {}),
    });

    if (!created) {
      await record.update(
        {
          ownerUserId: data.ownerUserId ?? record.ownerUserId,
          entityType: data.entityType,
          entityId: data.entityId,
          visibility: data.visibility,
          originalFilename: data.originalFilename ?? record.originalFilename,
          mimeType: data.mimeType ?? record.mimeType,
          sizeBytes: data.sizeBytes ?? record.sizeBytes,
          sha256: data.sha256 ?? record.sha256,
          status: "active",
          deletedBy: null,
          deletedAt: null,
        },
        transaction ? { transaction } : {},
      );
    }

    return record;
  }

  async markDeleted(
    file: UploadedFile,
    deletedBy: string | null,
    transaction?: Transaction,
  ): Promise<void> {
    await file.update(
      {
        status: "deleted",
        deletedBy,
        deletedAt: new Date(),
      },
      transaction ? { transaction } : {},
    );
  }
}
