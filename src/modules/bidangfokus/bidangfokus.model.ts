import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  Sequelize,
} from "sequelize";

export class BidangFokus extends Model<
  InferAttributes<BidangFokus>,
  InferCreationAttributes<BidangFokus>
> {
  declare id: CreationOptional<string>;
  declare namaBidang: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

export function initModel(sequelize: Sequelize): typeof BidangFokus {
  BidangFokus.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      namaBidang: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: "nama_bidang",
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "bidang_fokus",
      underscored: true,
      paranoid: true,
      indexes: [{ unique: true, fields: ["nama_bidang"] }],
    },
  );
  return BidangFokus;
}
