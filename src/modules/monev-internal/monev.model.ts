import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
  Sequelize,
} from "sequelize";
import type { HakiProposal } from "../proposal/proposal.model.js";

export type MonevDirektorat = "PRPM" | "PRODI" | "PKA";
export type MonevDocumentStatus = "Pending" | "Uploaded" | "Complete";
export type MonevJenisUsulan = "Penelitian" | "Pengabdian";

export class Monev extends Model<
  InferAttributes<Monev, { omit: "usulan" }>,
  InferCreationAttributes<Monev, { omit: "usulan" }>
> {
  declare id: CreationOptional<string>;
  declare usulan_id: string;
  declare tgl_monev: string;
  declare direktorat: CreationOptional<MonevDirektorat>;
  declare status_dokumen: CreationOptional<MonevDocumentStatus>;
  declare jenis_usulan: MonevJenisUsulan;
  declare berita_acara: CreationOptional<string | null>;
  declare form_penilaian: CreationOptional<string | null>;
  declare ringkasan_monev: CreationOptional<string | null>;
  declare catatan: CreationOptional<string | null>;
  declare created_by: CreationOptional<string | null>;
  declare updated_by: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;

  declare usulan?: NonAttribute<HakiProposal | null>;
}

export function initModel(sequelize: Sequelize): typeof Monev {
  Monev.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      usulan_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      tgl_monev: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      direktorat: {
        type: DataTypes.ENUM("PRPM", "PRODI", "PKA"),
        allowNull: false,
        defaultValue: "PRPM",
      },
      status_dokumen: {
        type: DataTypes.ENUM("Pending", "Uploaded", "Complete"),
        allowNull: false,
        defaultValue: "Pending",
      },
      jenis_usulan: {
        type: DataTypes.ENUM("Penelitian", "Pengabdian"),
        allowNull: false,
      },
      berita_acara: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      form_penilaian: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      ringkasan_monev: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      catatan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Monev",
      tableName: "monevs",
      timestamps: true,
      underscored: true,
      paranoid: true,
      indexes: [
        { name: "monevs_usulan_id_index", fields: ["usulan_id"] },
        { name: "monevs_tgl_monev_index", fields: ["tgl_monev"] },
      ],
    },
  );

  return Monev;
}
