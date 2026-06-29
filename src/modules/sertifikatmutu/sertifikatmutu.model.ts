import { DataTypes, Model } from "sequelize";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  Sequelize,
} from "sequelize";

export class SertifikatMutu extends Model<
  InferAttributes<SertifikatMutu>,
  InferCreationAttributes<SertifikatMutu>
> {
  declare id: CreationOptional<number>;
  declare sertifikatDescription: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initModel(sequelize: Sequelize): typeof SertifikatMutu {
  SertifikatMutu.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      sertifikatDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "sertifikat_description",
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "sertifikat_mutu",
      underscored: true,
    },
  );
  return SertifikatMutu;
}
