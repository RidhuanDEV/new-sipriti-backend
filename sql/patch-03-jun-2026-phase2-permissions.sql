-- Phase 2 permission seed for master-data migration.
-- Safe to run more than once. Assigns permissions to admin role when it exists.

INSERT IGNORE INTO `permissions` (`id`, `name`, `created_at`, `updated_at`) VALUES
  ('f0010000-0000-7000-8000-000000000001', 'view_prodi', NOW(), NOW()),
  ('f0010000-0000-7000-8000-000000000002', 'manage_prodi', NOW(), NOW()),
  ('f0010000-0000-7000-8000-000000000003', 'view_skema', NOW(), NOW()),
  ('f0010000-0000-7000-8000-000000000004', 'manage_skema', NOW(), NOW()),
  ('f0010000-0000-7000-8000-000000000005', 'view_bidang_fokus', NOW(), NOW()),
  ('f0010000-0000-7000-8000-000000000006', 'manage_bidang_fokus', NOW(), NOW()),
  ('f0010000-0000-7000-8000-000000000007', 'view_tahun_akademik', NOW(), NOW()),
  ('f0010000-0000-7000-8000-000000000008', 'manage_tahun_akademik', NOW(), NOW()),
  ('f0010000-0000-7000-8000-000000000009', 'view_output', NOW(), NOW()),
  ('f0010000-0000-7000-8000-000000000010', 'manage_output', NOW(), NOW()),
  ('f0010000-0000-7000-8000-000000000011', 'manage_sertifikat_mutu', NOW(), NOW());

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r
JOIN `permissions` p ON p.name IN (
  'view_prodi',
  'manage_prodi',
  'view_skema',
  'manage_skema',
  'view_bidang_fokus',
  'manage_bidang_fokus',
  'view_tahun_akademik',
  'manage_tahun_akademik',
  'view_output',
  'manage_output',
  'manage_sertifikat_mutu'
)
WHERE r.name = 'admin';
