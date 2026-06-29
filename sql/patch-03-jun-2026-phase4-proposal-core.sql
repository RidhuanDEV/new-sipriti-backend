-- Phase 4 proposal core schema patch.
-- Idempotent manual production patch for SIPRITI proposal workflow tables.

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `haki_proposals` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `judul` VARCHAR(1000) NOT NULL,
  `prodi_pengusul` VARCHAR(20) NULL,
  `kelompok_skema` VARCHAR(255) NULL,
  `bidang_fokus` VARCHAR(255) NULL,
  `sumber_dana` VARCHAR(200) NULL,
  `jumlah_dana` DECIMAL(20,2) NULL DEFAULT 0,
  `keterlibatan_lain` TEXT NULL,
  `tipe_usulan` ENUM('Penelitian','Pengabdian') NOT NULL DEFAULT 'Penelitian',
  `status_usulan` ENUM('Draft','Pending','Approved','Declined') NOT NULL DEFAULT 'Draft',
  `skema_id` CHAR(36) NULL,
  `tahun_pelaksanaan` VARCHAR(20) NULL,
  `tipe` ENUM('umum','hibah_internal') NOT NULL DEFAULT 'umum',
  `tahun_akademik_id` CHAR(36) NULL,
  `catatan_revisi` LONGTEXT NULL,
  `status_revisi` ENUM('Belum Diperbaiki','Sudah Diperbaiki','Tidak Ada') NOT NULL DEFAULT 'Tidak Ada',
  `file_url` VARCHAR(500) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `memberproposals` (
  `id` CHAR(36) NOT NULL,
  `haki_proposal_id` CHAR(36) NOT NULL,
  `no_identitas` VARCHAR(255) NULL,
  `peran` ENUM('Ketua','Anggota') NULL DEFAULT 'Anggota',
  `status` ENUM('Mahasiswa','Dosen') NULL DEFAULT 'Dosen',
  `bidang_tugas` TEXT NULL,
  `status_invite` ENUM('pending','accepted','rejected') NULL DEFAULT 'accepted',
  `invited_by_user_id` CHAR(36) NULL,
  `nama_anggota` VARCHAR(255) NULL,
  `institusi_anggota` VARCHAR(255) NULL,
  `prodi_anggota` VARCHAR(255) NULL,
  `prodi_kode_anggota` VARCHAR(20) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mahasiswas` (
  `id` CHAR(36) NOT NULL,
  `nrp` VARCHAR(255) NOT NULL,
  `nama` VARCHAR(255) NOT NULL,
  `prodi_kode` VARCHAR(20) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mahasiswas_nrp_unique` (`nrp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NULL,
  `type` ENUM('invite_anggota','invite_accepted','invite_rejected','usulan_approved','usulan_rejected') NOT NULL,
  `related_type` ENUM('member_proposal','haki_proposal') NULL,
  `related_id` CHAR(36) NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('unread','read') NOT NULL DEFAULT 'unread',
  `metadata` JSON NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tbl_penelitian_proposals` (
  `id` CHAR(36) NOT NULL,
  `haki_proposal_id` CHAR(36) NOT NULL,
  `ringkasan` LONGTEXT NULL,
  `kata_kunci` JSON NULL,
  `pendahuluan` LONGTEXT NULL,
  `metode` LONGTEXT NULL,
  `daftar_pustaka` LONGTEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tbl_penelitian_proposals_haki_unique` (`haki_proposal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tbl_pengabdian_proposals` (
  `id` CHAR(36) NOT NULL,
  `haki_proposal_id` CHAR(36) NOT NULL,
  `tingkat` ENUM('Lokal','Nasional','Internasional') NULL,
  `ringkasan` LONGTEXT NULL,
  `kata_kunci` JSON NULL,
  `pendahuluan` LONGTEXT NULL,
  `permasalahan_dan_solusi` LONGTEXT NULL,
  `metode` LONGTEXT NULL,
  `gambaran_ipteks` LONGTEXT NULL,
  `peta_lokasi_mitra_url` VARCHAR(1024) NULL,
  `daftar_pustaka` LONGTEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tbl_pengabdian_proposals_haki_unique` (`haki_proposal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `jadwal_proposal` (
  `id` CHAR(36) NOT NULL,
  `haki_proposal_id` CHAR(36) NOT NULL,
  `nama_kegiatan` VARCHAR(255) NOT NULL,
  `tahun` INT NOT NULL DEFAULT 1,
  `urutan` INT NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `jadwal_bulanan` (
  `id` CHAR(36) NOT NULL,
  `jadwal_id` CHAR(36) NOT NULL,
  `bulan` TINYINT UNSIGNED NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `luaranproposals` (
  `id` CHAR(36) NOT NULL,
  `haki_proposal_id` CHAR(36) NOT NULL,
  `luaran` VARCHAR(255) NOT NULL,
  `target_capaian` TEXT NULL,
  `iku_terkait` VARCHAR(255) NULL,
  `target_iku` VARCHAR(255) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rabproposals` (
  `id` CHAR(36) NOT NULL,
  `haki_proposal_id` CHAR(36) NOT NULL,
  `tahun_ke` VARCHAR(255) NULL,
  `kelompok` VARCHAR(255) NULL,
  `komponen` VARCHAR(255) NULL,
  `item` VARCHAR(255) NULL,
  `satuan` VARCHAR(255) NULL,
  `biaya_satuan` BIGINT NULL,
  `volume` INT NULL,
  `total_biaya` BIGINT NULL,
  `pajak` VARCHAR(255) NULL,
  `sumber_dana` VARCHAR(255) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `haki_proposal_outputs` (
  `id` CHAR(36) NOT NULL,
  `haki_proposal_id` CHAR(36) NOT NULL,
  `output_id` CHAR(36) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `laporan_usulan` (
  `id` CHAR(36) NOT NULL,
  `haki_proposal_id` CHAR(36) NOT NULL,
  `ketua_user_id` CHAR(36) NULL,
  `jenis_laporan` ENUM('laporan_kemajuan','laporan_akhir') NOT NULL,
  `scope_tipe` ENUM('umum','hibah_internal') NOT NULL DEFAULT 'umum',
  `file_url` VARCHAR(500) NULL,
  `nama_file` VARCHAR(255) NULL,
  `status_laporan` ENUM('Lengkapi Dokumen','Pending','Revisi','Sesuai') NOT NULL DEFAULT 'Lengkapi Dokumen',
  `last_uploaded_at` DATETIME NULL,
  `last_replaced_at` DATETIME NULL,
  `replace_count` INT NOT NULL DEFAULT 0,
  `catatan_validator` TEXT NULL,
  `validated_by` CHAR(36) NULL,
  `validated_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DELIMITER $$
CREATE PROCEDURE sipriti_phase4_add_index_if_missing(
  IN p_table_name VARCHAR(128),
  IN p_index_name VARCHAR(128),
  IN p_index_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = p_table_name
      AND index_name = p_index_name
  ) THEN
    SET @phase4_index_sql = p_index_sql;
    PREPARE phase4_stmt FROM @phase4_index_sql;
    EXECUTE phase4_stmt;
    DEALLOCATE PREPARE phase4_stmt;
  END IF;
END$$
DELIMITER ;

CALL sipriti_phase4_add_index_if_missing('haki_proposals', 'idx_hakiproposals_user_id', 'CREATE INDEX idx_hakiproposals_user_id ON haki_proposals (user_id)');
CALL sipriti_phase4_add_index_if_missing('haki_proposals', 'idx_hakiproposals_tipe', 'CREATE INDEX idx_hakiproposals_tipe ON haki_proposals (tipe_usulan)');
CALL sipriti_phase4_add_index_if_missing('haki_proposals', 'idx_hakiproposals_status', 'CREATE INDEX idx_hakiproposals_status ON haki_proposals (status_usulan)');
CALL sipriti_phase4_add_index_if_missing('haki_proposals', 'idx_hakiproposals_skema', 'CREATE INDEX idx_hakiproposals_skema ON haki_proposals (skema_id)');
CALL sipriti_phase4_add_index_if_missing('haki_proposals', 'haki_proposals_prodi_pengusul_index', 'CREATE INDEX haki_proposals_prodi_pengusul_index ON haki_proposals (prodi_pengusul)');
CALL sipriti_phase4_add_index_if_missing('memberproposals', 'idx_memberproposals_no_identitas', 'CREATE INDEX idx_memberproposals_no_identitas ON memberproposals (no_identitas)');
CALL sipriti_phase4_add_index_if_missing('memberproposals', 'idx_memberproposals_proposal_id', 'CREATE INDEX idx_memberproposals_proposal_id ON memberproposals (haki_proposal_id)');
CALL sipriti_phase4_add_index_if_missing('memberproposals', 'uniq_memberproposals_proposal_identitas', 'CREATE UNIQUE INDEX uniq_memberproposals_proposal_identitas ON memberproposals (haki_proposal_id, no_identitas)');
CALL sipriti_phase4_add_index_if_missing('memberproposals', 'idx_memberproposals_prodi_kode_anggota', 'CREATE INDEX idx_memberproposals_prodi_kode_anggota ON memberproposals (prodi_kode_anggota)');
CALL sipriti_phase4_add_index_if_missing('mahasiswas', 'mahasiswas_prodi_kode_index', 'CREATE INDEX mahasiswas_prodi_kode_index ON mahasiswas (prodi_kode)');
CALL sipriti_phase4_add_index_if_missing('notifications', 'idx_notifications_user_id', 'CREATE INDEX idx_notifications_user_id ON notifications (user_id)');
CALL sipriti_phase4_add_index_if_missing('notifications', 'idx_notifications_status', 'CREATE INDEX idx_notifications_status ON notifications (status)');
CALL sipriti_phase4_add_index_if_missing('notifications', 'idx_notifications_user_status', 'CREATE INDEX idx_notifications_user_status ON notifications (user_id, status)');
CALL sipriti_phase4_add_index_if_missing('jadwal_proposal', 'idx_jproposal_haki', 'CREATE INDEX idx_jproposal_haki ON jadwal_proposal (haki_proposal_id)');
CALL sipriti_phase4_add_index_if_missing('jadwal_bulanan', 'uq_jadwal_bulan', 'CREATE UNIQUE INDEX uq_jadwal_bulan ON jadwal_bulanan (jadwal_id, bulan)');
CALL sipriti_phase4_add_index_if_missing('jadwal_bulanan', 'idx_jbulanan_jadwal', 'CREATE INDEX idx_jbulanan_jadwal ON jadwal_bulanan (jadwal_id)');
CALL sipriti_phase4_add_index_if_missing('luaranproposals', 'idx_luaran_haki', 'CREATE INDEX idx_luaran_haki ON luaranproposals (haki_proposal_id)');
CALL sipriti_phase4_add_index_if_missing('haki_proposal_outputs', 'uq_haki_proposal_outputs_proposal_output', 'CREATE UNIQUE INDEX uq_haki_proposal_outputs_proposal_output ON haki_proposal_outputs (haki_proposal_id, output_id)');
CALL sipriti_phase4_add_index_if_missing('laporan_usulan', 'uniq_laporan_usulan_scope', 'CREATE UNIQUE INDEX uniq_laporan_usulan_scope ON laporan_usulan (haki_proposal_id, jenis_laporan, scope_tipe)');

DROP PROCEDURE sipriti_phase4_add_index_if_missing;

SET FOREIGN_KEY_CHECKS = 1;
