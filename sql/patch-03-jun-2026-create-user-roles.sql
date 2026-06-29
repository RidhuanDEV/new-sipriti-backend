-- Phase 1 user_roles schema patch.
-- Idempotent manual production patch for multi-role RBAC compatibility.

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `role_id` CHAR(36) NOT NULL,
  `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_by` CHAR(36) NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_user_roles_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_role_id`
    FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY `user_roles_user_id_role_id_unique` (`user_id`, `role_id`)
);

SET FOREIGN_KEY_CHECKS = 1;
