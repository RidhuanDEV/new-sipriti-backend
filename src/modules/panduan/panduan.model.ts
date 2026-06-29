import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  Sequelize,
} from "sequelize";

export class Panduan extends Model<
  InferAttributes<Panduan>,
  InferCreationAttributes<Panduan>
> {
  declare id: CreationOptional<string>;
  declare judul: string;
  declare isi_panduan: string;
  declare thumbnail: string | null;
  declare file_url: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

export function initModel(sequelize: Sequelize): typeof Panduan {
  Panduan.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      judul: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isi_panduan: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      thumbnail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      file_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "deleted_at",
      },
    },
    {
      sequelize,
      modelName: "Panduan",
      tableName: "panduan",
      freezeTableName: true,
      underscored: false,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  return Panduan;
}
