import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type { CreationOptional, InferAttributes, InferCreationAttributes, Sequelize } from "sequelize";

export class JadwalBulanan extends Model<
  InferAttributes<JadwalBulanan>,
  InferCreationAttributes<JadwalBulanan>
> {
  declare id: CreationOptional<string>;
  declare jadwal_id: string;
  declare bulan: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initModel(sequelize: Sequelize): typeof JadwalBulanan {
  JadwalBulanan.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      jadwal_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      bulan: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "JadwalBulanan",
      tableName: "jadwal_bulanan",
      freezeTableName: true,
      paranoid: false,
      indexes: [
        { name: "uq_jadwal_bulan", unique: true, fields: ["jadwal_id", "bulan"] },
        { name: "idx_jbulanan_jadwal", fields: ["jadwal_id"] },
      ],
    },
  );

  return JadwalBulanan;
}
