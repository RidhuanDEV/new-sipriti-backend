import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type { CreationOptional, InferAttributes, InferCreationAttributes, Sequelize } from "sequelize";

export class PenelitianProposal extends Model<
  InferAttributes<PenelitianProposal>,
  InferCreationAttributes<PenelitianProposal>
> {
  declare id: CreationOptional<string>;
  declare haki_proposal_id: string;
  declare ringkasan: CreationOptional<string | null>;
  declare kata_kunci: CreationOptional<string[] | null>;
  declare pendahuluan: CreationOptional<string | null>;
  declare metode: CreationOptional<string | null>;
  declare daftar_pustaka: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initModel(sequelize: Sequelize): typeof PenelitianProposal {
  PenelitianProposal.init(
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
      ringkasan: DataTypes.TEXT("long"),
      kata_kunci: DataTypes.JSON,
      pendahuluan: DataTypes.TEXT("long"),
      metode: DataTypes.TEXT("long"),
      daftar_pustaka: DataTypes.TEXT("long"),
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "PenelitianProposal",
      tableName: "tbl_penelitian_proposals",
      freezeTableName: true,
      paranoid: false,
    },
  );

  return PenelitianProposal;
}
