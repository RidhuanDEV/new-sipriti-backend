import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type { CreationOptional, InferAttributes, InferCreationAttributes, Sequelize } from "sequelize";

export type PengabdianTingkat = "Lokal" | "Nasional" | "Internasional";

export class PengabdianProposal extends Model<
  InferAttributes<PengabdianProposal>,
  InferCreationAttributes<PengabdianProposal>
> {
  declare id: CreationOptional<string>;
  declare haki_proposal_id: string;
  declare tingkat: CreationOptional<PengabdianTingkat | null>;
  declare ringkasan: CreationOptional<string | null>;
  declare kata_kunci: CreationOptional<string[] | null>;
  declare pendahuluan: CreationOptional<string | null>;
  declare permasalahan_dan_solusi: CreationOptional<string | null>;
  declare metode: CreationOptional<string | null>;
  declare gambaran_ipteks: CreationOptional<string | null>;
  declare peta_lokasi_mitra_url: CreationOptional<string | null>;
  declare daftar_pustaka: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initModel(sequelize: Sequelize): typeof PengabdianProposal {
  PengabdianProposal.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      haki_proposal_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      tingkat: {
        type: DataTypes.ENUM("Lokal", "Nasional", "Internasional"),
        allowNull: true,
      },
      ringkasan: DataTypes.TEXT("long"),
      kata_kunci: DataTypes.JSON,
      pendahuluan: DataTypes.TEXT("long"),
      permasalahan_dan_solusi: DataTypes.TEXT("long"),
      metode: DataTypes.TEXT("long"),
      gambaran_ipteks: DataTypes.TEXT("long"),
      peta_lokasi_mitra_url: DataTypes.STRING(1024),
      daftar_pustaka: DataTypes.TEXT("long"),
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "PengabdianProposal",
      tableName: "tbl_pengabdian_proposals",
      freezeTableName: true,
      paranoid: false,
    },
  );

  return PengabdianProposal;
}
