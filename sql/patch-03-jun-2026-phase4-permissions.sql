-- Phase 4 proposal permissions patch.
-- Idempotent manual production patch. Assigns all Phase 4 permissions to admin
-- and baseline proposal permissions to user role.

INSERT IGNORE INTO permissions (id, name, created_at, updated_at) VALUES
('f0030000-0000-7000-8000-000000000001', 'view_proposal', NOW(), NOW()),
('f0030000-0000-7000-8000-000000000002', 'create_proposal', NOW(), NOW()),
('f0030000-0000-7000-8000-000000000003', 'edit_proposal', NOW(), NOW()),
('f0030000-0000-7000-8000-000000000004', 'delete_proposal', NOW(), NOW()),
('f0030000-0000-7000-8000-000000000005', 'review_proposal', NOW(), NOW()),
('f0030000-0000-7000-8000-000000000006', 'manage_proposal', NOW(), NOW()),
('f0030000-0000-7000-8000-000000000007', 'submit_proposal', NOW(), NOW()),
('f0030000-0000-7000-8000-000000000008', 'edit_usulan_by_prodi', NOW(), NOW()),
('f0030000-0000-7000-8000-000000000009', 'view_penelitian', NOW(), NOW()),
('f0030000-0000-7000-8000-000000000010', 'manage_penelitian', NOW(), NOW()),
('f0030000-0000-7000-8000-000000000011', 'forward_usulan_penelitian', NOW(), NOW()),
('f0030000-0000-7000-8000-000000000012', 'view_pengabdian', NOW(), NOW()),
('f0030000-0000-7000-8000-000000000013', 'manage_pengabdian', NOW(), NOW()),
('f0030000-0000-7000-8000-000000000014', 'forward_usulan_pengabdian', NOW(), NOW());

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
WHERE r.name = 'admin'
  AND p.name IN (
    'view_proposal','create_proposal','edit_proposal','delete_proposal','review_proposal',
    'manage_proposal','submit_proposal','edit_usulan_by_prodi','view_penelitian',
    'manage_penelitian','forward_usulan_penelitian','view_pengabdian','manage_pengabdian',
    'forward_usulan_pengabdian'
  );

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
WHERE r.name = 'user'
  AND p.name IN (
    'view_proposal','create_proposal','edit_proposal','delete_proposal',
    'submit_proposal','view_penelitian','view_pengabdian'
  );
