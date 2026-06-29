import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from "sequelize";
import type { Permission } from "../permissions/permission.model.js";
import type { User } from "../user/user.model.js";

export class Role extends Model<
  InferAttributes<Role, { omit: "permissions" | "users" | "members" }>,
  InferCreationAttributes<Role, { omit: "permissions" | "users" | "members" }>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations (eager-loaded)
  declare permissions?: NonAttribute<Permission[]>;
  declare users?: NonAttribute<User[]>;
  declare members?: NonAttribute<User[]>;
}

export function initModel(sequelize: Sequelize): typeof Role {
  Role.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_active",
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "roles",
      underscored: true,
    },
  );
  return Role;
}
