import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type { CreationOptional, InferAttributes, InferCreationAttributes, NonAttribute, Sequelize } from "sequelize";
import type { HakiProposal } from "./proposal.model.js";
import type { User } from "../user/user.model.js";

export type JenisLaporanUsulan = "laporan_kemajuan" | "laporan_akhir";
export type ScopeTipeLaporan = "umum" | "hibah_internal";
export type StatusLaporanUsulan = "Lengkapi Dokumen" | "Pending" | "Revisi" | "Sesuai";

export class LaporanUsulan extends Model<
  InferAttributes<LaporanUsulan, { omit: "proposal" | "ketua" | "validator" }>,
  InferCreationAttributes<LaporanUsulan, { omit: "proposal" | "ketua" | "validator" }>
> {
  declare id: CreationOptional<string>;
  declare haki_proposal_id: string;
  declare ketua_user_id: CreationOptional<string | null>;
  declare jenis_laporan: JenisLaporanUsulan;
  declare scope_tipe: CreationOptional<ScopeTipeLaporan>;
  declare file_url: CreationOptional<string | null>;
  declare nama_file: CreationOptional<string | null>;
  declare status_laporan: CreationOptional<StatusLaporanUsulan>;
  declare last_uploaded_at: CreationOptional<Date | null>;
  declare last_replaced_at: CreationOptional<Date | null>;
  declare replace_count: CreationOptional<number>;
  declare catatan_validator: CreationOptional<string | null>;
  declare validated_by: CreationOptional<string | null>;
  declare validated_at: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare proposal?: NonAttribute<HakiProposal | null>;
  declare ketua?: NonAttribute<User | null>;
  declare validator?: NonAttribute<User | null>;
}

export function initModel(sequelize: Sequelize): typeof LaporanUsulan {
  LaporanUsulan.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      haki_proposal_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      ketua_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      jenis_laporan: {
        type: DataTypes.ENUM("laporan_kemajuan", "laporan_akhir"),
        allowNull: false,
      },
      scope_tipe: {
        type: DataTypes.ENUM("umum", "hibah_internal"),
        allowNull: false,
        defaultValue: "umum",
      },
      file_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      nama_file: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status_laporan: {
        type: DataTypes.ENUM("Lengkapi Dokumen", "Pending", "Revisi", "Sesuai"),
        allowNull: false,
        defaultValue: "Lengkapi Dokumen",
      },
      last_uploaded_at: DataTypes.DATE,
      last_replaced_at: DataTypes.DATE,
      replace_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      catatan_validator: DataTypes.TEXT,
      validated_by: DataTypes.UUID,
      validated_at: DataTypes.DATE,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "LaporanUsulan",
      tableName: "laporan_usulan",
      underscored: true,
      timestamps: true,
      paranoid: false,
      indexes: [
        {
          name: "uniq_laporan_usulan_scope",
          unique: true,
          fields: ["haki_proposal_id", "jenis_laporan", "scope_tipe"],
        },
      ],
    },
  );

  return LaporanUsulan;
}
