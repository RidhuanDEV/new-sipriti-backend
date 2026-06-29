-- Phase 2 master-data foundation for SIPRITI TypeScript backend.
-- Safe to run more than once on MySQL-compatible databases.

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `prodis` (
  `id` CHAR(36) NOT NULL,
  `kode_prodi` VARCHAR(20) NOT NULL,
  `nama_prodi` VARCHAR(255) NOT NULL,
  `jenjang` ENUM('D3', 'S1', 'S2', 'S3') NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `prodis_kode_prodi_unique` (`kode_prodi`)
);

CREATE TABLE IF NOT EXISTS `skemas` (
  `id` CHAR(36) NOT NULL,
  `nama_skema` VARCHAR(255) NOT NULL,
  `tipe` ENUM('Penelitian', 'Pengabdian', 'HKI') NOT NULL,
  `deskripsi` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `skemas_nama_skema_unique` (`nama_skema`)
);

CREATE TABLE IF NOT EXISTS `bidang_fokus` (
  `id` CHAR(36) NOT NULL,
  `nama_bidang` VARCHAR(100) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bidang_fokus_nama_bidang_unique` (`nama_bidang`)
);

CREATE TABLE IF NOT EXISTS `tahun_akademik` (
  `id` CHAR(36) NOT NULL,
  `tahun_mulai` INT NOT NULL,
  `tahun_selesai` INT NOT NULL,
  `semester` ENUM('Ganjil', 'Genap') NOT NULL DEFAULT 'Ganjil',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `outputs` (
  `id` CHAR(36) NOT NULL,
  `nama_output` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `outputs_nama_output_unique` (`nama_output`)
);

CREATE TABLE IF NOT EXISTS `sertifikat_mutu` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sertifikat_description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'name') = 0,
  'ALTER TABLE `users` ADD COLUMN `name` VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'username') = 0,
  'ALTER TABLE `users` ADD COLUMN `username` VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'nidn') = 0,
  'ALTER TABLE `users` ADD COLUMN `nidn` VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'institusi') = 0,
  'ALTER TABLE `users` ADD COLUMN `institusi` VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'prodi_kode') = 0,
  'ALTER TABLE `users` ADD COLUMN `prodi_kode` VARCHAR(20) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;
