import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  Sequelize,
} from "sequelize";

export class UserRole extends Model<
  InferAttributes<UserRole>,
  InferCreationAttributes<UserRole>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare roleId: string;
  declare assignedAt: CreationOptional<Date>;
  declare assignedBy: CreationOptional<string | null>;
}

export function initModel(sequelize: Sequelize): typeof UserRole {
  UserRole.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      roleId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      assignedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      assignedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "user_roles",
      underscored: true,
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["user_id", "role_id"],
          name: "user_roles_user_id_role_id_unique",
        },
      ],
    },
  );
  return UserRole;
}
