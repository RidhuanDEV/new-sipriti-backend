-- Legacy auth/RBAC/product compatibility patch.
-- Safe to run more than once on MySQL 8+.

ALTER TABLE `users` MODIFY COLUMN `email` VARCHAR(255) NULL;

ALTER TABLE `roles` ADD COLUMN IF NOT EXISTS `description` VARCHAR(255) NULL;
ALTER TABLE `roles` ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE `permissions` ADD COLUMN IF NOT EXISTS `description` VARCHAR(255) NULL;
ALTER TABLE `permissions` ADD COLUMN IF NOT EXISTS `module` VARCHAR(50) NULL;

INSERT IGNORE INTO `permissions` (`id`, `name`, `description`, `module`, `created_at`, `updated_at`) VALUES
  ('f0060000-0000-7000-8000-000000000001', 'manage_product', 'Manage legacy product example endpoint', 'product', NOW(), NOW());

UPDATE `permissions`
SET `description` = 'Edit HKI', `module` = 'hki'
WHERE `name` = 'edit_hki' AND (`module` IS NULL OR `module` = '');

UPDATE `permissions`
SET `description` = 'Hapus HKI', `module` = 'hki'
WHERE `name` = 'delete_hki' AND (`module` IS NULL OR `module` = '');

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r
JOIN `permissions` p ON p.name = 'manage_product'
WHERE r.name = 'admin';
