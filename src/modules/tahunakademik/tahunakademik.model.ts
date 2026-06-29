import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  Sequelize,
} from "sequelize";

export type Semester = "Ganjil" | "Genap";

export class TahunAkademik extends Model<
  InferAttributes<TahunAkademik>,
  InferCreationAttributes<TahunAkademik>
> {
  declare id: CreationOptional<string>;
  declare tahunMulai: number;
  declare tahunSelesai: number;
  declare semester: CreationOptional<Semester>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initModel(sequelize: Sequelize): typeof TahunAkademik {
  TahunAkademik.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      tahunMulai: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "tahun_mulai",
      },
      tahunSelesai: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "tahun_selesai",
      },
      semester: {
        type: DataTypes.ENUM("Ganjil", "Genap"),
        allowNull: false,
        defaultValue: "Ganjil",
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "tahun_akademik",
      underscored: true,
    },
  );
  return TahunAkademik;
}
