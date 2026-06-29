import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  Sequelize,
} from "sequelize";

export class MitraKerjaRiset extends Model<
  InferAttributes<MitraKerjaRiset>,
  InferCreationAttributes<MitraKerjaRiset>
> {
  declare id: CreationOptional<string>;
  declare nama_mitra: string;
  declare mitra_description: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initModel(sequelize: Sequelize): typeof MitraKerjaRiset {
  MitraKerjaRiset.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      nama_mitra: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mitra_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "mitrakerjariset",
      tableName: "mitra_kerja_riset",
      timestamps: true,
    },
  );

  return MitraKerjaRiset;
}
