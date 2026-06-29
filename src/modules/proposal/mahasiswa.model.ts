import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
  Sequelize,
} from "sequelize";
import type { Prodi } from "../prodi/prodi.model.js";
import type { User } from "../user/user.model.js";

export class Mahasiswa extends Model<
  InferAttributes<Mahasiswa, { omit: "prodiRelasi" | "akun" }>,
  InferCreationAttributes<Mahasiswa, { omit: "prodiRelasi" | "akun" }>
> {
  declare id: CreationOptional<string>;
  declare nrp: string;
  declare nama: string;
  declare prodi_kode: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare prodiRelasi?: NonAttribute<Prodi | null>;
  declare akun?: NonAttribute<User | null>;
}

export function initModel(sequelize: Sequelize): typeof Mahasiswa {
  Mahasiswa.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      nrp: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      nama: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      prodi_kode: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Mahasiswa",
      tableName: "mahasiswas",
      underscored: true,
      timestamps: true,
      paranoid: false,
      indexes: [{ name: "mahasiswas_prodi_kode_index", fields: ["prodi_kode"] }],
    },
  );

  return Mahasiswa;
}
