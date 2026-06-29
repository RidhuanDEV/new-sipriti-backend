-- Phase 6 RBAC granular completion.
-- Idempotent patch: inserts missing granular permissions and grants them to admin.

INSERT IGNORE INTO permissions (id, name, created_at, updated_at) VALUES
('f0060000-0000-7000-8000-000000000001', 'create_user', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000002', 'edit_user', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000003', 'delete_user', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000004', 'assign_roles', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000005', 'view_roles', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000006', 'create_role', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000007', 'edit_role', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000008', 'delete_role', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000009', 'view_permissions', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000010', 'assign_permissions', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000011', 'create_prodi', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000012', 'edit_prodi', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000013', 'delete_prodi', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000014', 'create_skema', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000015', 'edit_skema', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000016', 'delete_skema', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000017', 'create_bidang_fokus', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000018', 'edit_bidang_fokus', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000019', 'delete_bidang_fokus', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000020', 'create_tahun_akademik', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000021', 'edit_tahun_akademik', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000022', 'delete_tahun_akademik', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000023', 'create_output', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000024', 'edit_output', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000025', 'delete_output', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000026', 'view_landing_slider', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000027', 'create_landing_slider', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000028', 'edit_landing_slider', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000029', 'delete_landing_slider', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000030', 'view_capaian', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000031', 'create_capaian', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000032', 'edit_capaian', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000033', 'delete_capaian', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000034', 'view_publikasi', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000035', 'create_publikasi', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000036', 'edit_publikasi', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000037', 'delete_publikasi', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000038', 'view_hibah_internal', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000039', 'create_hibah_internal', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000040', 'edit_hibah_internal', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000041', 'delete_hibah_internal', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000042', 'create_monev', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000043', 'edit_monev', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000044', 'delete_monev', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000045', 'view_signature', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000046', 'create_signature', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000047', 'edit_signature', NOW(), NOW()),
('f0060000-0000-7000-8000-000000000048', 'delete_signature', NOW(), NOW());

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.name = 'admin'
  AND p.name IN (
    'create_user', 'edit_user', 'delete_user', 'assign_roles',
    'view_roles', 'create_role', 'edit_role', 'delete_role',
    'view_permissions', 'assign_permissions',
    'create_prodi', 'edit_prodi', 'delete_prodi',
    'create_skema', 'edit_skema', 'delete_skema',
    'create_bidang_fokus', 'edit_bidang_fokus', 'delete_bidang_fokus',
    'create_tahun_akademik', 'edit_tahun_akademik', 'delete_tahun_akademik',
    'create_output', 'edit_output', 'delete_output',
    'view_landing_slider', 'create_landing_slider', 'edit_landing_slider', 'delete_landing_slider',
    'view_capaian', 'create_capaian', 'edit_capaian', 'delete_capaian',
    'view_publikasi', 'create_publikasi', 'edit_publikasi', 'delete_publikasi',
    'view_hibah_internal', 'create_hibah_internal', 'edit_hibah_internal', 'delete_hibah_internal',
    'create_monev', 'edit_monev', 'delete_monev',
    'view_signature', 'create_signature', 'edit_signature', 'delete_signature'
  );
