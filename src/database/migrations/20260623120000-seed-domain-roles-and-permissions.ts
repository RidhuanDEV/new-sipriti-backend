import type { QueryInterface } from "sequelize";
import { QueryTypes } from "sequelize";
import { PHASE8_VIEW_PERMISSION_SEEDS } from "../rbac-source.js";

interface IdRow {
  id: string;
}

const DOMAIN_ROLES = [
  { id: "e0010000-0000-7000-8000-000000000001", name: "mahasiswa", description: "Mahasiswa" },
  { id: "e0010000-0000-7000-8000-000000000002", name: "dosen", description: "Dosen/Pengajar" },
  { id: "e0010000-0000-7000-8000-000000000003", name: "koordinator_penelitian", description: "Koordinator Penelitian" },
  { id: "e0010000-0000-7000-8000-000000000004", name: "koordinator_pengabdian", description: "Koordinator Pengabdian" },
  { id: "e0010000-0000-7000-8000-000000000005", name: "koordinator_publikasi", description: "Koordinator Publikasi" },
  { id: "e0010000-0000-7000-8000-000000000006", name: "koordinator_hki", description: "Koordinator HKI" },
  { id: "e0010000-0000-7000-8000-000000000007", name: "kaprodi", description: "Kepala Program Studi" },
  { id: "e0010000-0000-7000-8000-000000000008", name: "reviewer", description: "Reviewer Proposal" },
] as const;

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  mahasiswa: [
    "view_dashboard", "view_user_profile", "edit_user_profile",
    "create_proposal", "view_proposal", "edit_proposal", "delete_proposal", "submit_proposal",
    "view_perbaikan_usulan", "submit_perbaikan_usulan",
    "create_laporan_kemajuan", "view_laporan_kemajuan", "edit_laporan_kemajuan", "delete_laporan_kemajuan",
    "create_laporan_akhir", "view_laporan_akhir", "edit_laporan_akhir", "delete_laporan_akhir",
    "view_monitoring_evaluasi",
    "create_hki", "view_hki", "edit_hki", "delete_hki", "submit_hki",
    "view_publikasi", "view_berita", "view_pengumuman", "view_panduan",
    "view_prodi", "view_skema", "view_tahun_akademik", "view_carousel",
    "view_audit_log", "view_users",
    "view_penelitian", "view_pengabdian",
  ],
  dosen: [
    "view_dashboard", "view_user_profile", "edit_user_profile",
    "create_proposal", "view_proposal", "edit_proposal", "delete_proposal", "submit_proposal",
    "view_perbaikan_usulan", "submit_perbaikan_usulan",
    "create_laporan_kemajuan", "view_laporan_kemajuan", "edit_laporan_kemajuan", "delete_laporan_kemajuan",
    "create_laporan_akhir", "view_laporan_akhir", "edit_laporan_akhir", "delete_laporan_akhir",
    "view_monitoring_evaluasi",
    "create_hki", "view_hki", "edit_hki", "delete_hki", "submit_hki",
    "view_publikasi", "create_publikasi",
    "view_berita", "view_pengumuman", "view_panduan",
    "view_prodi", "view_skema", "view_bidang_fokus", "view_tahun_akademik", "view_carousel",
    "view_audit_log", "view_users",
    "view_penelitian", "submit_proposal", "forward_usulan_penelitian",
    "view_pengabdian", "forward_usulan_pengabdian",
  ],
  koordinator_penelitian: [
    "view_dashboard", "view_admin_dashboard",
    "view_proposal", "review_proposal", "approve_proposal",
    "view_users", "view_prodi", "view_skema", "view_bidang_fokus",
    "view_monev", "view_review_proposal", "view_perbaikan_usulan_admin",
    "view_penelitian", "manage_output",
  ],
  koordinator_pengabdian: [
    "view_dashboard", "view_admin_dashboard",
    "view_proposal", "review_proposal", "approve_proposal",
    "view_users", "view_prodi", "view_skema", "view_bidang_fokus",
    "view_monev", "view_review_proposal", "view_perbaikan_usulan_admin",
    "view_pengabdian", "manage_output",
  ],
  koordinator_publikasi: [
    "view_dashboard", "view_admin_dashboard", "view_publikasi", "view_users",
    "view_berita", "create_berita", "edit_berita", "delete_berita",
    "view_pengumuman", "create_pengumuman", "edit_pengumuman", "delete_pengumuman",
    "view_panduan", "create_panduan", "edit_panduan", "delete_panduan",
  ],
  koordinator_hki: [
    "view_dashboard", "view_admin_dashboard",
    "view_hki", "view_users", "approve_hki", "submit_hki",
  ],
  kaprodi: [
    "view_dashboard", "view_admin_dashboard",
    "view_users", "view_prodi", "view_skema", "view_bidang_fokus",
    "view_proposal", "view_publikasi", "view_hki",
    "view_monev", "view_review_proposal", "view_signature",
    "view_penelitian", "view_pengabdian",
  ],
  reviewer: [
    "view_dashboard", "view_proposal", "review_proposal",
    "view_penelitian", "view_pengabdian", "view_hki",
  ],
};

async function assignRolePermissions(queryInterface: QueryInterface, roleName: string, permNames: string[]): Promise<void> {
  for (const permName of permNames) {
    await queryInterface.sequelize.query(
      `INSERT IGNORE INTO role_permissions (role_id, permission_id)
       SELECT r.id, p.id FROM roles r JOIN permissions p
       WHERE r.name = :roleName AND p.name = :permName`,
      { type: QueryTypes.INSERT, replacements: { roleName, permName } },
    );
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const now = new Date();

  // Seed missing view permissions
  for (const perm of PHASE8_VIEW_PERMISSION_SEEDS) {
    await queryInterface.sequelize.query(
      "INSERT IGNORE INTO permissions (id, name, created_at, updated_at) VALUES (:id, :name, :now, :now)",
      { replacements: { id: perm.id, name: perm.name, now } },
    );
  }

  // Assign new view permissions to admin role
  for (const perm of PHASE8_VIEW_PERMISSION_SEEDS) {
    await queryInterface.sequelize.query(
      `INSERT IGNORE INTO role_permissions (role_id, permission_id)
       SELECT r.id, :permId FROM roles r WHERE r.name = 'admin'`,
      { replacements: { permId: perm.id } },
    );
  }

  // Seed domain roles
  for (const role of DOMAIN_ROLES) {
    await queryInterface.sequelize.query(
      "INSERT IGNORE INTO roles (id, name, description, is_active, created_at, updated_at) VALUES (:id, :name, :description, true, :now, :now)",
      { replacements: { id: role.id, name: role.name, description: role.description, now } },
    );
  }

  // Assign permissions to each domain role
  for (const role of DOMAIN_ROLES) {
    const perms = ROLE_PERMISSION_MAP[role.name];
    if (perms) {
      await assignRolePermissions(queryInterface, role.name, perms);
    }
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Remove role-permission assignments for domain roles
  for (const role of DOMAIN_ROLES) {
    await queryInterface.sequelize.query(
      "DELETE rp FROM role_permissions rp JOIN roles r ON r.id = rp.role_id WHERE r.name = :roleName",
      { replacements: { roleName: role.name } },
    );
  }

  // Remove domain roles
  for (const role of DOMAIN_ROLES) {
    await queryInterface.sequelize.query(
      "DELETE FROM roles WHERE id = :id",
      { replacements: { id: role.id } },
    );
  }

  // Remove view permission assignments for admin
  for (const perm of PHASE8_VIEW_PERMISSION_SEEDS) {
    await queryInterface.sequelize.query(
      "DELETE FROM role_permissions WHERE permission_id = :permId",
      { replacements: { permId: perm.id } },
    );
  }

  // Remove new view permissions
  for (const perm of PHASE8_VIEW_PERMISSION_SEEDS) {
    await queryInterface.sequelize.query(
      "DELETE FROM permissions WHERE id = :id",
      { replacements: { id: perm.id } },
    );
  }
}
