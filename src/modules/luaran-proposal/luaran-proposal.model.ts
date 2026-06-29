import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type { CreationOptional, InferAttributes, InferCreationAttributes, Sequelize } from "sequelize";

export class LuaranProposal extends Model<
  InferAttributes<LuaranProposal>,
  InferCreationAttributes<LuaranProposal>
> {
  declare id: CreationOptional<string>;
  declare haki_proposal_id: string;
  declare luaran: string;
  declare target_capaian: CreationOptional<string | null>;
  declare iku_terkait: CreationOptional<string | null>;
  declare target_iku: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initModel(sequelize: Sequelize): typeof LuaranProposal {
  LuaranProposal.init(
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
      luaran: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      target_capaian: DataTypes.TEXT,
      iku_terkait: DataTypes.STRING(255),
      target_iku: DataTypes.STRING(255),
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "LuaranProposal",
      tableName: "luaranproposals",
      freezeTableName: true,
      paranoid: false,
      indexes: [{ name: "idx_luaran_haki", fields: ["haki_proposal_id"] }],
    },
  );

  return LuaranProposal;
}
