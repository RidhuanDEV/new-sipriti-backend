import type { QueryInterface } from "sequelize";
import { DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable("user_roles", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "roles", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    assigned_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    assigned_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  });

  await queryInterface.addConstraint("user_roles", {
    fields: ["user_id", "role_id"],
    type: "unique",
    name: "user_roles_user_id_role_id_unique",
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable("user_roles");
}
