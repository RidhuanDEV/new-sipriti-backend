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

export class HibahInternal extends Model<
  InferAttributes<HibahInternal>,
  InferCreationAttributes<HibahInternal>
> {
  declare id: CreationOptional<string>;
  declare tipe_hibah: string;
  declare judul_hibah: string;
  declare susunan_tim_hibah: string;
  declare tahun_hibah: string;
  declare dana_hibah: string;
  declare pengalaman_riset_description: string | null;
  declare users?: NonAttribute<User[]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

export function initModel(sequelize: Sequelize): typeof HibahInternal {
  HibahInternal.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      tipe_hibah: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      judul_hibah: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      susunan_tim_hibah: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "[]",
      },
      tahun_hibah: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      dana_hibah: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      pengalaman_riset_description: {
        type: DataTypes.TEXT,
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
      modelName: "HibahInternal",
      tableName: "hibahinternal",
      freezeTableName: true,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  return HibahInternal;
}
