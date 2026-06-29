import type { QueryInterface } from "sequelize";
import { QueryTypes } from "sequelize";
import { PHASE4_PERMISSION_SEEDS } from "../rbac-source.js";

interface IdRow {
  id: string;
}

async function findIdByName(queryInterface: QueryInterface, tableName: "roles" | "permissions", name: string): Promise<string | null> {
  const rows = await queryInterface.sequelize.query<IdRow>(
    `SELECT id FROM ${tableName} WHERE name = :name LIMIT 1`,
    { type: QueryTypes.SELECT, replacements: { name } },
  );
  return rows[0]?.id ?? null;
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const now = new Date();
  const adminRoleId = await findIdByName(queryInterface, "roles", "admin");
  const userRoleId = await findIdByName(queryInterface, "roles", "user");

  for (const permission of PHASE4_PERMISSION_SEEDS) {
    const existingPermissionId = await findIdByName(queryInterface, "permissions", permission.name);
    const permissionId = existingPermissionId ?? permission.id;

    if (!existingPermissionId) {
      await queryInterface.bulkInsert("permissions", [
        {
          id: permission.id,
          name: permission.name,
          created_at: now,
          updated_at: now,
        },
      ]);
    }

    if (adminRoleId) {
      await queryInterface.sequelize.query(
        "INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (:roleId, :permissionId)",
        { replacements: { roleId: adminRoleId, permissionId } },
      );
    }

    if (userRoleId && ["view_proposal", "create_proposal", "edit_proposal", "delete_proposal", "submit_proposal", "view_penelitian", "view_pengabdian"].includes(permission.name)) {
      await queryInterface.sequelize.query(
        "INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (:roleId, :permissionId)",
        { replacements: { roleId: userRoleId, permissionId } },
      );
    }
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  for (const permission of PHASE4_PERMISSION_SEEDS) {
    const permissionId = await findIdByName(queryInterface, "permissions", permission.name);
    if (permissionId) {
      await queryInterface.sequelize.query("DELETE FROM role_permissions WHERE permission_id = :permissionId", {
        replacements: { permissionId },
      });
      await queryInterface.bulkDelete("permissions", { id: permissionId });
    }
  }
}
