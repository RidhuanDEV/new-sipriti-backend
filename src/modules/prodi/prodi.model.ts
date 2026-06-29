import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
  Sequelize,
} from "sequelize";
import type { User } from "../user/user.model.js";

export type JenjangProdi = "D3" | "S1" | "S2" | "S3";

export class Prodi extends Model<
  InferAttributes<Prodi, { omit: "users" }>,
  InferCreationAttributes<Prodi, { omit: "users" }>
> {
  declare id: CreationOptional<string>;
  declare kodeProdi: string;
  declare namaProdi: string;
  declare jenjang: JenjangProdi;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;

  declare users?: NonAttribute<User[]>;
}

export function initModel(sequelize: Sequelize): typeof Prodi {
  Prodi.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      kodeProdi: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: "kode_prodi",
      },
      namaProdi: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "nama_prodi",
      },
      jenjang: {
        type: DataTypes.ENUM("D3", "S1", "S2", "S3"),
        allowNull: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "prodis",
      underscored: true,
      paranoid: true,
      indexes: [{ unique: true, fields: ["kode_prodi"] }],
    },
  );
  return Prodi;
}
