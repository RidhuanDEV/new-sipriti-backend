import type { QueryInterface } from "sequelize";

const adminRoleId = "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1";
const userRoleId = "b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2";

const manageUsersPermissionId = "c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3";
const manageRolesPermissionId = "d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4";
const managePermissionsPermissionId = "e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5";
const phase2PermissionSeeds = [
  { id: "f0010000-0000-7000-8000-000000000001", name: "view_prodi" },
  { id: "f0010000-0000-7000-8000-000000000002", name: "manage_prodi" },
  { id: "f0010000-0000-7000-8000-000000000003", name: "view_skema" },
  { id: "f0010000-0000-7000-8000-000000000004", name: "manage_skema" },
  { id: "f0010000-0000-7000-8000-000000000005", name: "view_bidang_fokus" },
  { id: "f0010000-0000-7000-8000-000000000006", name: "manage_bidang_fokus" },
  { id: "f0010000-0000-7000-8000-000000000007", name: "view_tahun_akademik" },
  { id: "f0010000-0000-7000-8000-000000000008", name: "manage_tahun_akademik" },
  { id: "f0010000-0000-7000-8000-000000000009", name: "view_output" },
  { id: "f0010000-0000-7000-8000-000000000010", name: "manage_output" },
  { id: "f0010000-0000-7000-8000-000000000011", name: "manage_sertifikat_mutu" },
] as const;
const phase3PermissionSeeds = [
  { id: "f0020000-0000-7000-8000-000000000001", name: "create_berita" },
  { id: "f0020000-0000-7000-8000-000000000002", name: "edit_berita" },
  { id: "f0020000-0000-7000-8000-000000000003", name: "delete_berita" },
  { id: "f0020000-0000-7000-8000-000000000004", name: "manage_berita" },
  { id: "f0020000-0000-7000-8000-000000000005", name: "create_pengumuman" },
  { id: "f0020000-0000-7000-8000-000000000006", name: "edit_pengumuman" },
  { id: "f0020000-0000-7000-8000-000000000007", name: "delete_pengumuman" },
  { id: "f0020000-0000-7000-8000-000000000008", name: "manage_pengumuman" },
  { id: "f0020000-0000-7000-8000-000000000009", name: "create_panduan" },
  { id: "f0020000-0000-7000-8000-000000000010", name: "edit_panduan" },
  { id: "f0020000-0000-7000-8000-000000000011", name: "delete_panduan" },
  { id: "f0020000-0000-7000-8000-000000000012", name: "manage_panduan" },
  { id: "f0020000-0000-7000-8000-000000000013", name: "manage_carousel" },
  { id: "f0020000-0000-7000-8000-000000000014", name: "manage_landing_slider" },
  { id: "f0020000-0000-7000-8000-000000000015", name: "manage_capaian" },
  { id: "f0020000-0000-7000-8000-000000000016", name: "manage_kategori_publikasi" },
  { id: "f0020000-0000-7000-8000-000000000017", name: "manage_publikasi" },
  { id: "f0020000-0000-7000-8000-000000000018", name: "manage_mitra_kerja_riset" },
  { id: "f0020000-0000-7000-8000-000000000019", name: "manage_product_riset" },
  { id: "f0020000-0000-7000-8000-000000000020", name: "manage_penghargaan_riset" },
  { id: "f0020000-0000-7000-8000-000000000021", name: "manage_hibah_internal" },
] as const;
const phase4PermissionSeeds = [
  { id: "f0030000-0000-7000-8000-000000000001", name: "view_proposal" },
  { id: "f0030000-0000-7000-8000-000000000002", name: "create_proposal" },
  { id: "f0030000-0000-7000-8000-000000000003", name: "edit_proposal" },
  { id: "f0030000-0000-7000-8000-000000000004", name: "delete_proposal" },
  { id: "f0030000-0000-7000-8000-000000000005", name: "review_proposal" },
  { id: "f0030000-0000-7000-8000-000000000006", name: "manage_proposal" },
  { id: "f0030000-0000-7000-8000-000000000007", name: "submit_proposal" },
  { id: "f0030000-0000-7000-8000-000000000008", name: "edit_usulan_by_prodi" },
  { id: "f0030000-0000-7000-8000-000000000009", name: "view_penelitian" },
  { id: "f0030000-0000-7000-8000-000000000010", name: "manage_penelitian" },
  { id: "f0030000-0000-7000-8000-000000000011", name: "forward_usulan_penelitian" },
  { id: "f0030000-0000-7000-8000-000000000012", name: "view_pengabdian" },
  { id: "f0030000-0000-7000-8000-000000000013", name: "manage_pengabdian" },
  { id: "f0030000-0000-7000-8000-000000000014", name: "forward_usulan_pengabdian" },
] as const;
const phase5PermissionSeeds = [
  { id: "f0040000-0000-7000-8000-000000000001", name: "approve_proposal" },
  { id: "f0040000-0000-7000-8000-000000000002", name: "view_hki" },
  { id: "f0040000-0000-7000-8000-000000000003", name: "create_hki" },
  { id: "f0040000-0000-7000-8000-000000000004", name: "edit_hki" },
  { id: "f0040000-0000-7000-8000-000000000005", name: "delete_hki" },
  { id: "f0040000-0000-7000-8000-000000000006", name: "submit_hki" },
  { id: "f0040000-0000-7000-8000-000000000007", name: "manage_hki" },
  { id: "f0040000-0000-7000-8000-000000000008", name: "approve_hki" },
  { id: "f0040000-0000-7000-8000-000000000009", name: "view_monev" },
  { id: "f0040000-0000-7000-8000-000000000010", name: "manage_monev" },
  { id: "f0040000-0000-7000-8000-000000000011", name: "view_dashboard" },
  { id: "f0040000-0000-7000-8000-000000000012", name: "view_admin_dashboard" },
  { id: "f0040000-0000-7000-8000-000000000013", name: "manage_signature" },
  { id: "f0040000-0000-7000-8000-000000000014", name: "view_audit_log" },
] as const;
const phase6GranularPermissionSeeds = [
  { id: "f0060000-0000-7000-8000-000000000001", name: "create_user" },
  { id: "f0060000-0000-7000-8000-000000000002", name: "edit_user" },
  { id: "f0060000-0000-7000-8000-000000000003", name: "delete_user" },
  { id: "f0060000-0000-7000-8000-000000000004", name: "assign_roles" },
  { id: "f0060000-0000-7000-8000-000000000005", name: "view_roles" },
  { id: "f0060000-0000-7000-8000-000000000006", name: "create_role" },
  { id: "f0060000-0000-7000-8000-000000000007", name: "edit_role" },
  { id: "f0060000-0000-7000-8000-000000000008", name: "delete_role" },
  { id: "f0060000-0000-7000-8000-000000000009", name: "view_permissions" },
  { id: "f0060000-0000-7000-8000-000000000010", name: "assign_permissions" },
  { id: "f0060000-0000-7000-8000-000000000011", name: "create_prodi" },
  { id: "f0060000-0000-7000-8000-000000000012", name: "edit_prodi" },
  { id: "f0060000-0000-7000-8000-000000000013", name: "delete_prodi" },
  { id: "f0060000-0000-7000-8000-000000000014", name: "create_skema" },
  { id: "f0060000-0000-7000-8000-000000000015", name: "edit_skema" },
  { id: "f0060000-0000-7000-8000-000000000016", name: "delete_skema" },
  { id: "f0060000-0000-7000-8000-000000000017", name: "create_bidang_fokus" },
  { id: "f0060000-0000-7000-8000-000000000018", name: "edit_bidang_fokus" },
  { id: "f0060000-0000-7000-8000-000000000019", name: "delete_bidang_fokus" },
  { id: "f0060000-0000-7000-8000-000000000020", name: "create_tahun_akademik" },
  { id: "f0060000-0000-7000-8000-000000000021", name: "edit_tahun_akademik" },
  { id: "f0060000-0000-7000-8000-000000000022", name: "delete_tahun_akademik" },
  { id: "f0060000-0000-7000-8000-000000000023", name: "create_output" },
  { id: "f0060000-0000-7000-8000-000000000024", name: "edit_output" },
  { id: "f0060000-0000-7000-8000-000000000025", name: "delete_output" },
  { id: "f0060000-0000-7000-8000-000000000026", name: "view_landing_slider" },
  { id: "f0060000-0000-7000-8000-000000000027", name: "create_landing_slider" },
  { id: "f0060000-0000-7000-8000-000000000028", name: "edit_landing_slider" },
  { id: "f0060000-0000-7000-8000-000000000029", name: "delete_landing_slider" },
  { id: "f0060000-0000-7000-8000-000000000030", name: "view_capaian" },
  { id: "f0060000-0000-7000-8000-000000000031", name: "create_capaian" },
  { id: "f0060000-0000-7000-8000-000000000032", name: "edit_capaian" },
  { id: "f0060000-0000-7000-8000-000000000033", name: "delete_capaian" },
  { id: "f0060000-0000-7000-8000-000000000034", name: "view_publikasi" },
  { id: "f0060000-0000-7000-8000-000000000035", name: "create_publikasi" },
  { id: "f0060000-0000-7000-8000-000000000036", name: "edit_publikasi" },
  { id: "f0060000-0000-7000-8000-000000000037", name: "delete_publikasi" },
  { id: "f0060000-0000-7000-8000-000000000038", name: "view_hibah_internal" },
  { id: "f0060000-0000-7000-8000-000000000039", name: "create_hibah_internal" },
  { id: "f0060000-0000-7000-8000-000000000040", name: "edit_hibah_internal" },
  { id: "f0060000-0000-7000-8000-000000000041", name: "delete_hibah_internal" },
  { id: "f0060000-0000-7000-8000-000000000042", name: "create_monev" },
  { id: "f0060000-0000-7000-8000-000000000043", name: "edit_monev" },
  { id: "f0060000-0000-7000-8000-000000000044", name: "delete_monev" },
  { id: "f0060000-0000-7000-8000-000000000045", name: "view_signature" },
  { id: "f0060000-0000-7000-8000-000000000046", name: "create_signature" },
  { id: "f0060000-0000-7000-8000-000000000047", name: "edit_signature" },
  { id: "f0060000-0000-7000-8000-000000000048", name: "delete_signature" },
] as const;

interface RoleSeed {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

interface PermissionSeedRow {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

interface RolePermissionSeed {
  role_id: string;
  permission_id: string;
}

async function insertRoleIgnore(
  queryInterface: QueryInterface,
  row: RoleSeed,
): Promise<void> {
  await queryInterface.sequelize.query(
    "INSERT IGNORE INTO roles (id, name, created_at, updated_at) VALUES (:id, :name, :created_at, :updated_at)",
    {
      replacements: {
        id: row.id,
        name: row.name,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
    },
  );
}

async function insertPermissionIgnore(
  queryInterface: QueryInterface,
  row: PermissionSeedRow,
): Promise<void> {
  await queryInterface.sequelize.query(
    "INSERT IGNORE INTO permissions (id, name, created_at, updated_at) VALUES (:id, :name, :created_at, :updated_at)",
    {
      replacements: {
        id: row.id,
        name: row.name,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
    },
  );
}

async function insertRolePermissionIgnore(
  queryInterface: QueryInterface,
  row: RolePermissionSeed,
): Promise<void> {
  await queryInterface.sequelize.query(
    "INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (:role_id, :permission_id)",
    {
      replacements: {
        role_id: row.role_id,
        permission_id: row.permission_id,
      },
    },
  );
}

const seeder = {
  async up(queryInterface: QueryInterface): Promise<void> {
    const now = new Date();

    for (const role of [
      { id: adminRoleId, name: "admin", created_at: now, updated_at: now },
      { id: userRoleId, name: "user", created_at: now, updated_at: now },
    ]) {
      await insertRoleIgnore(queryInterface, role);
    }

    for (const permission of [
      { id: manageUsersPermissionId, name: "manage_users", created_at: now, updated_at: now },
      { id: manageRolesPermissionId, name: "manage_roles", created_at: now, updated_at: now },
      { id: managePermissionsPermissionId, name: "manage_permissions", created_at: now, updated_at: now },
      ...phase2PermissionSeeds.map((permission) => ({
        id: permission.id,
        name: permission.name,
        created_at: now,
        updated_at: now,
      })),
      ...phase3PermissionSeeds.map((permission) => ({
        id: permission.id,
        name: permission.name,
        created_at: now,
        updated_at: now,
      })),
      ...phase4PermissionSeeds.map((permission) => ({
        id: permission.id,
        name: permission.name,
        created_at: now,
        updated_at: now,
      })),
      ...phase5PermissionSeeds.map((permission) => ({
        id: permission.id,
        name: permission.name,
        created_at: now,
        updated_at: now,
      })),
      ...phase6GranularPermissionSeeds.map((permission) => ({
        id: permission.id,
        name: permission.name,
        created_at: now,
        updated_at: now,
      })),
    ]) {
      await insertPermissionIgnore(queryInterface, permission);
    }

    for (const rolePermission of [
      { role_id: adminRoleId, permission_id: manageUsersPermissionId },
      { role_id: adminRoleId, permission_id: manageRolesPermissionId },
      { role_id: adminRoleId, permission_id: managePermissionsPermissionId },
      ...phase2PermissionSeeds.map((permission) => ({
        role_id: adminRoleId,
        permission_id: permission.id,
      })),
      ...phase3PermissionSeeds.map((permission) => ({
        role_id: adminRoleId,
        permission_id: permission.id,
      })),
      ...phase4PermissionSeeds.map((permission) => ({
        role_id: adminRoleId,
        permission_id: permission.id,
      })),
      ...phase5PermissionSeeds.map((permission) => ({
        role_id: adminRoleId,
        permission_id: permission.id,
      })),
      ...phase6GranularPermissionSeeds.map((permission) => ({
        role_id: adminRoleId,
        permission_id: permission.id,
      })),
      ...phase4PermissionSeeds
        .filter((permission) =>
          ["view_proposal", "create_proposal", "edit_proposal", "delete_proposal", "submit_proposal", "view_penelitian", "view_pengabdian"].includes(permission.name),
        )
        .map((permission) => ({
          role_id: userRoleId,
          permission_id: permission.id,
        })),
      ...phase5PermissionSeeds
        .filter((permission) =>
          ["view_hki", "create_hki", "edit_hki", "delete_hki", "submit_hki", "view_dashboard"].includes(permission.name),
        )
        .map((permission) => ({
          role_id: userRoleId,
          permission_id: permission.id,
        })),
    ]) {
      await insertRolePermissionIgnore(queryInterface, rolePermission);
    }
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    // Delete in reverse order of dependencies
    await queryInterface.bulkDelete("role_permissions", {
      role_id: [adminRoleId, userRoleId],
    });

    await queryInterface.bulkDelete("permissions", {
      id: [
        manageUsersPermissionId,
        manageRolesPermissionId,
        managePermissionsPermissionId,
        ...phase2PermissionSeeds.map((permission) => permission.id),
        ...phase3PermissionSeeds.map((permission) => permission.id),
        ...phase4PermissionSeeds.map((permission) => permission.id),
        ...phase5PermissionSeeds.map((permission) => permission.id),
        ...phase6GranularPermissionSeeds.map((permission) => permission.id),
      ],
    });

    await queryInterface.bulkDelete("roles", {
      id: [adminRoleId, userRoleId],
    });
  }
};

export = seeder;
