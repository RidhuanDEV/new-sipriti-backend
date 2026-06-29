import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
  Sequelize,
} from "sequelize";
import type { Publikasi } from "../publikasi/publikasi.model.js";

export class KategoriPublikasi extends Model<
  InferAttributes<KategoriPublikasi>,
  InferCreationAttributes<KategoriPublikasi>
> {
  declare id: CreationOptional<string>;
  declare namaKategori: string;
  declare publikasi?: NonAttribute<Publikasi[]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initModel(sequelize: Sequelize): typeof KategoriPublikasi {
  KategoriPublikasi.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      namaKategori: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: "nama_kategori",
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "KategoriPublikasi",
      tableName: "kategori_publikasi",
      underscored: true,
      timestamps: true,
    },
  );

  return KategoriPublikasi;
}
