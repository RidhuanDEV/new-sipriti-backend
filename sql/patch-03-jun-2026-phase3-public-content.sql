-- Phase 3 public content/upload foundation for SIPRITI TypeScript backend.
-- Safe to run more than once on MySQL-compatible databases.

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `uploaded_files` (
  `id` CHAR(36) NOT NULL,
  `owner_user_id` CHAR(36) NULL,
  `entity_type` VARCHAR(80) NOT NULL,
  `entity_id` CHAR(36) NULL,
  `visibility` ENUM('public', 'private') NOT NULL DEFAULT 'private',
  `subdir` VARCHAR(120) NOT NULL,
  `stored_filename` VARCHAR(255) NOT NULL,
  `original_filename` VARCHAR(255) NULL,
  `mime_type` VARCHAR(120) NULL,
  `size_bytes` BIGINT NULL,
  `sha256` VARCHAR(64) NULL,
  `status` ENUM('active', 'orphan', 'deleted') NOT NULL DEFAULT 'active',
  `created_by` CHAR(36) NULL,
  `deleted_by` CHAR(36) NULL,
  `deleted_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_uploaded_files_storage_path` (`subdir`, `stored_filename`),
  KEY `idx_uploaded_files_owner` (`owner_user_id`),
  KEY `idx_uploaded_files_entity` (`entity_type`, `entity_id`),
  KEY `idx_uploaded_files_visibility_status` (`visibility`, `status`)
);

CREATE TABLE IF NOT EXISTS `berita` (
  `id` CHAR(36) NOT NULL,
  `judul` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `isi_berita` TEXT NOT NULL,
  `photo_url` VARCHAR(255) NULL,
  `file_url` VARCHAR(255) NULL,
  `kategori` ENUM('Pendanaan', 'Workshop', 'Panduan', 'Umum') NOT NULL DEFAULT 'Umum',
  `tanggal_rilis` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_berita_slug` (`slug`),
  KEY `idx_berita_kategori` (`kategori`),
  KEY `idx_berita_createdAt` (`createdAt`)
);

CREATE TABLE IF NOT EXISTS `pengumuman` (
  `id` CHAR(36) NOT NULL,
  `judul` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `isi_pengumuman` TEXT NOT NULL,
  `gambar` VARCHAR(255) NULL,
  `file_lampiran` VARCHAR(255) NULL,
  `tanggal_rilis` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_pengumuman_slug` (`slug`)
);

CREATE TABLE IF NOT EXISTS `panduan` (
  `id` CHAR(36) NOT NULL,
  `judul` VARCHAR(255) NOT NULL,
  `isi_panduan` TEXT NOT NULL,
  `thumbnail` VARCHAR(255) NULL,
  `file_url` VARCHAR(255) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `carousel` (
  `id` CHAR(36) NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `display_order` INT NOT NULL DEFAULT 0,
  `page` VARCHAR(255) NOT NULL DEFAULT 'capaian',
  `tentang_prpm_description` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `landing_slider` (
  `id` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `img_desktop` VARCHAR(255) NOT NULL,
  `img_mobile` VARCHAR(255) NOT NULL,
  `btn_text` VARCHAR(255) NULL,
  `btn_link` VARCHAR(255) NULL,
  `btn_color` VARCHAR(255) NULL,
  `order_index` INT NOT NULL DEFAULT 0,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `deskripsi_capaian` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `section_key` ENUM('tentang_prpm', 'publikasi_ilmiah', 'hki_paten', 'pengalaman_riset', 'penghargaan_riset', 'produk_riset', 'sertifikasi_mutu') NOT NULL,
  `content` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_deskripsi_capaian_section_key` (`section_key`)
);

CREATE TABLE IF NOT EXISTS `kategori_publikasi` (
  `id` CHAR(36) NOT NULL,
  `nama_kategori` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kategori_publikasi_nama_kategori_unique` (`nama_kategori`)
);

CREATE TABLE IF NOT EXISTS `publikasi` (
  `id` CHAR(36) NOT NULL,
  `tahun_akademik_id` CHAR(36) NOT NULL,
  `kategori_publikasi_id` CHAR(36) NOT NULL,
  `total_publikasi` INT NOT NULL DEFAULT 0,
  `publikasi_ilmiah_description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_publikasi_tahun_akademik` (`tahun_akademik_id`),
  KEY `idx_publikasi_kategori` (`kategori_publikasi_id`)
);

CREATE TABLE IF NOT EXISTS `mitra_kerja_riset` (
  `id` CHAR(36) NOT NULL,
  `nama_mitra` VARCHAR(255) NOT NULL,
  `mitra_description` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `product_riset` (
  `id` CHAR(36) NOT NULL,
  `nama_produk` VARCHAR(255) NOT NULL,
  `produk_riset_description` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `penghargaan_riset` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `penghargaan_description` TEXT NULL,
  `penghargaan_image` VARCHAR(500) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `hibahinternal` (
  `id` CHAR(36) NOT NULL,
  `tipe_hibah` VARCHAR(255) NOT NULL,
  `judul_hibah` VARCHAR(255) NOT NULL,
  `susunan_tim_hibah` TEXT NOT NULL,
  `tahun_hibah` VARCHAR(255) NOT NULL,
  `dana_hibah` DECIMAL(15,2) NOT NULL,
  `pengalaman_riset_description` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `userhibahinternalpair` (
  `user_id` CHAR(36) NOT NULL,
  `hibah_internal_id` CHAR(36) NOT NULL,
  UNIQUE KEY `uniq_user_hibahinternal_pair` (`user_id`, `hibah_internal_id`)
);

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'berita' AND column_name = 'slug') = 0,
  'ALTER TABLE `berita` ADD COLUMN `slug` VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'berita' AND index_name = 'idx_berita_slug') = 0,
  'CREATE UNIQUE INDEX `idx_berita_slug` ON `berita` (`slug`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pengumuman' AND column_name = 'slug') = 0,
  'ALTER TABLE `pengumuman` ADD COLUMN `slug` VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'pengumuman' AND index_name = 'idx_pengumuman_slug') = 0,
  'CREATE UNIQUE INDEX `idx_pengumuman_slug` ON `pengumuman` (`slug`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;
