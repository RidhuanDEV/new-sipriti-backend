import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  Sequelize,
} from "sequelize";

export type UploadedFileVisibility = "public" | "private";
export type UploadedFileStatus = "active" | "orphan" | "deleted";

export class UploadedFile extends Model<
  InferAttributes<UploadedFile>,
  InferCreationAttributes<UploadedFile>
> {
  declare id: CreationOptional<string>;
  declare ownerUserId: string | null;
  declare entityType: string;
  declare entityId: string | null;
  declare visibility: CreationOptional<UploadedFileVisibility>;
  declare subdir: string;
  declare storedFilename: string;
  declare originalFilename: string | null;
  declare mimeType: string | null;
  declare sizeBytes: number | null;
  declare sha256: string | null;
  declare status: CreationOptional<UploadedFileStatus>;
  declare createdBy: string | null;
  declare deletedBy: string | null;
  declare deletedAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initModel(sequelize: Sequelize): typeof UploadedFile {
  UploadedFile.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      ownerUserId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "owner_user_id",
      },
      entityType: {
        type: DataTypes.STRING(80),
        allowNull: false,
        field: "entity_type",
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "entity_id",
      },
      visibility: {
        type: DataTypes.ENUM("public", "private"),
        allowNull: false,
        defaultValue: "private",
      },
      subdir: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      storedFilename: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "stored_filename",
      },
      originalFilename: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "original_filename",
      },
      mimeType: {
        type: DataTypes.STRING(120),
        allowNull: true,
        field: "mime_type",
      },
      sizeBytes: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: "size_bytes",
      },
      sha256: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("active", "orphan", "deleted"),
        allowNull: false,
        defaultValue: "active",
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "created_by",
      },
      deletedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "deleted_by",
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "deleted_at",
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "UploadedFile",
      tableName: "uploaded_files",
      underscored: true,
      indexes: [
        { name: "idx_uploaded_files_owner", fields: ["owner_user_id"] },
        {
          name: "idx_uploaded_files_entity",
          fields: ["entity_type", "entity_id"],
        },
        {
          name: "idx_uploaded_files_visibility_status",
          fields: ["visibility", "status"],
        },
        {
          name: "uniq_uploaded_files_storage_path",
          unique: true,
          fields: ["subdir", "stored_filename"],
        },
      ],
    },
  );

  return UploadedFile;
}
