import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from "sequelize";
import type { Role } from "../roles/role.model.js";
import type { Prodi } from "../prodi/prodi.model.js";

export class User extends Model<
  InferAttributes<User, { omit: "role" | "roles" | "prodiRelation" }>,
  InferCreationAttributes<User, { omit: "role" | "roles" | "prodiRelation" }>
> {
  declare id: CreationOptional<string>;
  declare name: CreationOptional<string | null>;
  declare username: CreationOptional<string | null>;
  declare email: CreationOptional<string | null>;
  declare password: string;
  declare nidn: CreationOptional<string | null>;
  declare institusi: CreationOptional<string | null>;
  declare prodiKode: CreationOptional<string | null>;
  declare roleId: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;

  // Association (eager-loaded)
  declare role?: NonAttribute<Role>;
  declare roles?: NonAttribute<Role[]>;
  declare prodiRelation?: NonAttribute<Prodi | null>;
}

export interface UserCreateInput {
  email: string | null;
  password: string;
  roleId: string;
}

export function initModel(sequelize: Sequelize): typeof User {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      nidn: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      institusi: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      prodiKode: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: "prodi_kode",
      },
      roleId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "users",
      paranoid: true,
      underscored: true,
    },
  );
  return User;
}
