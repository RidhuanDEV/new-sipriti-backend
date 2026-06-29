-- Phase 3 permission seed for public content/upload migration.
-- Safe to run more than once. Assigns permissions to admin role when it exists.

INSERT IGNORE INTO `permissions` (`id`, `name`, `created_at`, `updated_at`) VALUES
  ('f0020000-0000-7000-8000-000000000001', 'create_berita', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000002', 'edit_berita', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000003', 'delete_berita', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000004', 'manage_berita', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000005', 'create_pengumuman', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000006', 'edit_pengumuman', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000007', 'delete_pengumuman', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000008', 'manage_pengumuman', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000009', 'create_panduan', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000010', 'edit_panduan', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000011', 'delete_panduan', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000012', 'manage_panduan', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000013', 'manage_carousel', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000014', 'manage_landing_slider', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000015', 'manage_capaian', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000016', 'manage_kategori_publikasi', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000017', 'manage_publikasi', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000018', 'manage_mitra_kerja_riset', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000019', 'manage_product_riset', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000020', 'manage_penghargaan_riset', NOW(), NOW()),
  ('f0020000-0000-7000-8000-000000000021', 'manage_hibah_internal', NOW(), NOW());

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r
JOIN `permissions` p ON p.name IN (
  'create_berita',
  'edit_berita',
  'delete_berita',
  'manage_berita',
  'create_pengumuman',
  'edit_pengumuman',
  'delete_pengumuman',
  'manage_pengumuman',
  'create_panduan',
  'edit_panduan',
  'delete_panduan',
  'manage_panduan',
  'manage_carousel',
  'manage_landing_slider',
  'manage_capaian',
  'manage_kategori_publikasi',
  'manage_publikasi',
  'manage_mitra_kerja_riset',
  'manage_product_riset',
  'manage_penghargaan_riset',
  'manage_hibah_internal'
)
WHERE r.name = 'admin';
