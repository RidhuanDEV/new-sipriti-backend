-- Phase 5 advanced workflow permissions patch.
-- Idempotent manual production patch. Assigns all Phase 5 permissions to admin
-- and user-owned HKI/dashboard permissions to the baseline user role.

INSERT IGNORE INTO permissions (id, name, created_at, updated_at) VALUES
('f0040000-0000-7000-8000-000000000001', 'approve_proposal', NOW(), NOW()),
('f0040000-0000-7000-8000-000000000002', 'view_hki', NOW(), NOW()),
('f0040000-0000-7000-8000-000000000003', 'create_hki', NOW(), NOW()),
('f0040000-0000-7000-8000-000000000004', 'edit_hki', NOW(), NOW()),
('f0040000-0000-7000-8000-000000000005', 'delete_hki', NOW(), NOW()),
('f0040000-0000-7000-8000-000000000006', 'submit_hki', NOW(), NOW()),
('f0040000-0000-7000-8000-000000000007', 'manage_hki', NOW(), NOW()),
('f0040000-0000-7000-8000-000000000008', 'approve_hki', NOW(), NOW()),
('f0040000-0000-7000-8000-000000000009', 'view_monev', NOW(), NOW()),
('f0040000-0000-7000-8000-000000000010', 'manage_monev', NOW(), NOW()),
('f0040000-0000-7000-8000-000000000011', 'view_dashboard', NOW(), NOW()),
('f0040000-0000-7000-8000-000000000012', 'view_admin_dashboard', NOW(), NOW()),
('f0040000-0000-7000-8000-000000000013', 'manage_signature', NOW(), NOW()),
('f0040000-0000-7000-8000-000000000014', 'view_audit_log', NOW(), NOW());

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
WHERE r.name = 'admin'
  AND p.name IN (
    'approve_proposal','view_hki','create_hki','edit_hki','delete_hki','submit_hki',
    'manage_hki','approve_hki','view_monev','manage_monev','view_dashboard',
    'view_admin_dashboard','manage_signature','view_audit_log'
  );

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
WHERE r.name = 'user'
  AND p.name IN ('view_hki','create_hki','edit_hki','delete_hki','submit_hki','view_dashboard');
