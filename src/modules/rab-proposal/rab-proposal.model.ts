import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type { CreationOptional, InferAttributes, InferCreationAttributes, Sequelize } from "sequelize";

export class RABProposal extends Model<
  InferAttributes<RABProposal>,
  InferCreationAttributes<RABProposal>
> {
  declare id: CreationOptional<string>;
  declare haki_proposal_id: string;
  declare tahun_ke: CreationOptional<string | null>;
  declare kelompok: CreationOptional<string | null>;
  declare komponen: CreationOptional<string | null>;
  declare item: CreationOptional<string | null>;
  declare satuan: CreationOptional<string | null>;
  declare biaya_satuan: CreationOptional<number | null>;
  declare volume: CreationOptional<number | null>;
  declare total_biaya: CreationOptional<number | null>;
  declare pajak: CreationOptional<string | null>;
  declare sumber_dana: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initModel(sequelize: Sequelize): typeof RABProposal {
  RABProposal.init(
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
      tahun_ke: DataTypes.STRING,
      kelompok: DataTypes.STRING,
      komponen: DataTypes.STRING,
      item: DataTypes.STRING,
      satuan: DataTypes.STRING,
      biaya_satuan: DataTypes.BIGINT,
      volume: DataTypes.INTEGER,
      total_biaya: DataTypes.BIGINT,
      pajak: DataTypes.STRING,
      sumber_dana: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "RABProposal",
      tableName: "rabproposals",
      freezeTableName: true,
      paranoid: false,
    },
  );

  return RABProposal;
}
