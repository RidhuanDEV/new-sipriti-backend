import { DataTypes, Model } from "sequelize";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  Sequelize,
} from "sequelize";

export class PenghargaanRiset extends Model<
  InferAttributes<PenghargaanRiset>,
  InferCreationAttributes<PenghargaanRiset>
> {
  declare id: CreationOptional<number>;
  declare penghargaan_description: string | null;
  declare penghargaan_image: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initModel(sequelize: Sequelize): typeof PenghargaanRiset {
  PenghargaanRiset.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      penghargaan_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      penghargaan_image: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "PenghargaanRiset",
      tableName: "penghargaan_riset",
      timestamps: true,
      underscored: true,
    },
  );

  return PenghargaanRiset;
}
