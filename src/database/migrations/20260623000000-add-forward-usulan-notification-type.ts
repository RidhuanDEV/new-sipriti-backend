import type { QueryInterface } from "sequelize";
import { DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.changeColumn("notifications", "type", {
    type: DataTypes.ENUM(
      "invite_anggota",
      "invite_accepted",
      "invite_rejected",
      "usulan_approved",
      "usulan_rejected",
      "forward_usulan"
    ),
    allowNull: false,
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.query(
    "DELETE FROM notifications WHERE type = 'forward_usulan'"
  );
  await queryInterface.changeColumn("notifications", "type", {
    type: DataTypes.ENUM(
      "invite_anggota",
      "invite_accepted",
      "invite_rejected",
      "usulan_approved",
      "usulan_rejected"
    ),
    allowNull: false,
  });
}
