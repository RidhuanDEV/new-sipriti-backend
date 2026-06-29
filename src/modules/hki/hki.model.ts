import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
  Sequelize,
} from "sequelize";
import type { User } from "../user/user.model.js";

export type HkiReviewStatus = "Pending" | "Approved" | "Rejected";

export class HKI extends Model<
  InferAttributes<HKI, { omit: "user" }>,
  InferCreationAttributes<HKI, { omit: "user" }>
> {
  declare id: CreationOptional<string>;
  declare user_id: string;
  declare judul: string;
  declare jenis_hki: string;
  declare sub_jenis_ciptaan: CreationOptional<string | null>;
  declare nomor_permohonan: CreationOptional<string | null>;
  declare tanggal_permohonan: CreationOptional<Date | null>;
  declare status_hki: CreationOptional<string | null>;
  declare inventor: string;
  declare pemegang_hak: string;
  declare deskripsi: CreationOptional<string | null>;
  declare file_sertifikat: CreationOptional<string | null>;
  declare file_dokumen_pendukung: CreationOptional<string | null>;
  declare file_surat_pernyataan: CreationOptional<string | null>;
  declare file_bukti_pengalihan: CreationOptional<string | null>;
  declare status: CreationOptional<HkiReviewStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;

  declare user?: NonAttribute<User | null>;
}

export function initModel(sequelize: Sequelize): typeof HKI {
  HKI.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      judul: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      jenis_hki: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sub_jenis_ciptaan: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      nomor_permohonan: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tanggal_permohonan: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status_hki: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      inventor: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      pemegang_hak: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      deskripsi: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      file_sertifikat: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      file_dokumen_pendukung: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      file_surat_pernyataan: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      file_bukti_pengalihan: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Pending",
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "deleted_at",
      },
    },
    {
      sequelize,
      modelName: "HKI",
      tableName: "hkis",
      freezeTableName: true,
      timestamps: true,
      underscored: false,
      paranoid: true,
      deletedAt: "deleted_at",
      indexes: [
        { name: "idx_hkis_user_id", fields: ["user_id"] },
        { name: "idx_hkis_status", fields: ["status"] },
      ],
    },
  );

  return HKI;
}
