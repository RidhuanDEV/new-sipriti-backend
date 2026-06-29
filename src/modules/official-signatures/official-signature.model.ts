import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
  Sequelize,
} from "sequelize";
import type { Prodi } from "../prodi/prodi.model.js";
import type { User } from "../user/user.model.js";

export class OfficialSignature extends Model<
  InferAttributes<
    OfficialSignature,
    { omit: "uploadedByUser" | "updatedByUser" | "prodi" }
  >,
  InferCreationAttributes<
    OfficialSignature,
    { omit: "uploadedByUser" | "updatedByUser" | "prodi" }
  >
> {
  declare id: CreationOptional<string>;
  declare signature_key: string;
  declare role_code: CreationOptional<string | null>;
  declare kode_prodi: CreationOptional<string | null>;
  declare signer_name: string;
  declare signer_nidn: CreationOptional<string | null>;
  declare stored_filename: string;
  declare original_filename: CreationOptional<string | null>;
  declare mime_type: CreationOptional<string>;
  declare file_size: number;
  declare sha256: string;
  declare is_active: CreationOptional<boolean>;
  declare activated_at: CreationOptional<Date | null>;
  declare uploaded_by: CreationOptional<string | null>;
  declare updated_by: CreationOptional<string | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;

  declare uploadedByUser?: NonAttribute<User | null>;
  declare updatedByUser?: NonAttribute<User | null>;
  declare prodi?: NonAttribute<Prodi | null>;
}

export function initModel(sequelize: Sequelize): typeof OfficialSignature {
  OfficialSignature.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      signature_key: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      role_code: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      kode_prodi: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      signer_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      signer_nidn: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      stored_filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      original_filename: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      mime_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "image/png",
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      sha256: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      activated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      uploaded_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "deleted_at",
      },
    },
    {
      sequelize,
      modelName: "OfficialSignature",
      tableName: "official_signatures",
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
      indexes: [
        { name: "idx_official_signatures_key", fields: ["signature_key"] },
        { name: "idx_official_signatures_key_active", fields: ["signature_key", "is_active"] },
        { name: "idx_official_signatures_uploaded_by", fields: ["uploaded_by"] },
        { name: "idx_official_signatures_sha256", fields: ["sha256"] },
        { name: "idx_official_signatures_prodi", fields: ["kode_prodi"] },
        {
          name: "idx_official_signatures_key_prodi_active",
          fields: ["signature_key", "kode_prodi", "is_active"],
        },
      ],
    },
  );

  return OfficialSignature;
}
