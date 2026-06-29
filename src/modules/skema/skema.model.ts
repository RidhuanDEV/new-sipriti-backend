import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  Sequelize,
} from "sequelize";

export type SkemaTipe = "Penelitian" | "Pengabdian" | "HKI";

export class Skema extends Model<
  InferAttributes<Skema>,
  InferCreationAttributes<Skema>
> {
  declare id: CreationOptional<string>;
  declare namaSkema: string;
  declare tipe: SkemaTipe;
  declare deskripsi: CreationOptional<string | null>;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

export function initModel(sequelize: Sequelize): typeof Skema {
  Skema.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      namaSkema: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        field: "nama_skema",
      },
      tipe: {
        type: DataTypes.ENUM("Penelitian", "Pengabdian", "HKI"),
        allowNull: false,
      },
      deskripsi: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "is_active",
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "skemas",
      underscored: true,
      paranoid: true,
      indexes: [{ unique: true, fields: ["nama_skema"] }],
    },
  );
  return Skema;
}
