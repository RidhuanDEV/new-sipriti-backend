import type { QueryInterface } from "sequelize";
import { DataTypes } from "sequelize";

const MANAGE_PRODUCT_PERMISSION_ID = "f0060000-0000-7000-8000-000000000001";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.changeColumn("users", "email", {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  });

  await queryInterface.addColumn("roles", "description", {
    type: DataTypes.STRING(255),
    allowNull: true,
  });
  await queryInterface.addColumn("roles", "is_active", {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await queryInterface.addColumn("permissions", "description", {
    type: DataTypes.STRING(255),
    allowNull: true,
  });
  await queryInterface.addColumn("permissions", "module", {
    type: DataTypes.STRING(50),
    allowNull: true,
  });

  await queryInterface.sequelize.query(
    "INSERT IGNORE INTO permissions (id, name, description, module, created_at, updated_at) VALUES (:id, 'manage_product', 'Manage legacy product example endpoint', 'product', NOW(), NOW())",
    { replacements: { id: MANAGE_PRODUCT_PERMISSION_ID } },
  );
  await queryInterface.sequelize.query(
    "UPDATE permissions SET description = 'Edit HKI', module = 'hki' WHERE name = 'edit_hki' AND (module IS NULL OR module = '')",
  );
  await queryInterface.sequelize.query(
    "UPDATE permissions SET description = 'Hapus HKI', module = 'hki' WHERE name = 'delete_hki' AND (module IS NULL OR module = '')",
  );
  await queryInterface.sequelize.query(
    "INSERT IGNORE INTO role_permissions (role_id, permission_id) SELECT r.id, p.id FROM roles r JOIN permissions p ON p.name = 'manage_product' WHERE r.name = 'admin'",
  );
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.query(
    "DELETE rp FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE p.name = 'manage_product'",
  );
  await queryInterface.sequelize.query("DELETE FROM permissions WHERE name = 'manage_product'");
  await queryInterface.removeColumn("permissions", "module");
  await queryInterface.removeColumn("permissions", "description");
  await queryInterface.removeColumn("roles", "is_active");
  await queryInterface.removeColumn("roles", "description");
  await queryInterface.changeColumn("users", "email", {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  });
}
