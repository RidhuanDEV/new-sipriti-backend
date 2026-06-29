import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
  Sequelize,
} from "sequelize";
import type { KategoriPublikasi } from "../kategoripublikasi/kategoripublikasi.model.js";
import type { TahunAkademik } from "../tahunakademik/tahunakademik.model.js";

export class Publikasi extends Model<
  InferAttributes<Publikasi>,
  InferCreationAttributes<Publikasi>
> {
  declare id: CreationOptional<string>;
  declare tahunAkademikId: string;
  declare kategoriPublikasiId: string;
  declare totalPublikasi: CreationOptional<number>;
  declare publikasi_ilmiah_description: string | null;
  declare tahunAkademik?: NonAttribute<TahunAkademik>;
  declare kategori?: NonAttribute<KategoriPublikasi>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initModel(sequelize: Sequelize): typeof Publikasi {
  Publikasi.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      tahunAkademikId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "tahun_akademik_id",
      },
      kategoriPublikasiId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "kategori_publikasi_id",
      },
      totalPublikasi: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "total_publikasi",
      },
      publikasi_ilmiah_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Publikasi",
      tableName: "publikasi",
      underscored: true,
      timestamps: true,
    },
  );

  return Publikasi;
}
