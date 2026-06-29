import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type { CreationOptional, InferAttributes, InferCreationAttributes, Sequelize } from "sequelize";

export class HakiProposalOutput extends Model<
  InferAttributes<HakiProposalOutput>,
  InferCreationAttributes<HakiProposalOutput>
> {
  declare id: CreationOptional<string>;
  declare haki_proposal_id: string;
  declare output_id: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initModel(sequelize: Sequelize): typeof HakiProposalOutput {
  HakiProposalOutput.init(
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
      output_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "HakiProposalOutput",
      tableName: "haki_proposal_outputs",
      freezeTableName: true,
      timestamps: true,
      underscored: true,
      paranoid: false,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          name: "uq_haki_proposal_outputs_proposal_output",
          unique: true,
          fields: ["haki_proposal_id", "output_id"],
        },
      ],
    },
  );

  return HakiProposalOutput;
}
