-- Phase 5 advanced workflow schema patch.
-- Idempotent manual production patch for official signatures, HKI, and monev.

CREATE TABLE IF NOT EXISTS official_signatures (
  id CHAR(36) NOT NULL PRIMARY KEY,
  signature_key VARCHAR(100) NOT NULL,
  role_code VARCHAR(100) NULL,
  kode_prodi VARCHAR(20) NULL,
  signer_name VARCHAR(255) NOT NULL,
  signer_nidn VARCHAR(50) NULL,
  stored_filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NULL,
  mime_type VARCHAR(100) NOT NULL DEFAULT 'image/png',
  file_size INT NOT NULL,
  sha256 VARCHAR(64) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  activated_at DATETIME NULL,
  uploaded_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS hkis (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  judul VARCHAR(255) NOT NULL,
  jenis_hki VARCHAR(255) NOT NULL,
  sub_jenis_ciptaan VARCHAR(255) NULL,
  nomor_permohonan VARCHAR(255) NULL,
  tanggal_permohonan DATETIME NULL,
  status_hki VARCHAR(255) NULL,
  inventor TEXT NOT NULL,
  pemegang_hak VARCHAR(255) NOT NULL,
  deskripsi TEXT NULL,
  file_sertifikat VARCHAR(255) NULL,
  file_dokumen_pendukung VARCHAR(255) NULL,
  file_surat_pernyataan VARCHAR(255) NULL,
  file_bukti_pengalihan VARCHAR(255) NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'Pending',
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS monevs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  usulan_id CHAR(36) NOT NULL,
  tgl_monev DATE NOT NULL,
  direktorat ENUM('PRPM', 'PRODI', 'PKA') NOT NULL DEFAULT 'PRPM',
  status_dokumen ENUM('Pending', 'Uploaded', 'Complete') NOT NULL DEFAULT 'Pending',
  jenis_usulan ENUM('Penelitian', 'Pengabdian') NOT NULL,
  berita_acara VARCHAR(500) NULL,
  form_penilaian VARCHAR(500) NULL,
  ringkasan_monev VARCHAR(500) NULL,
  catatan TEXT NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

DROP PROCEDURE IF EXISTS sipriti_phase5_add_index_if_missing;
DELIMITER $$
CREATE PROCEDURE sipriti_phase5_add_index_if_missing(
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
    SET @phase5_index_sql = p_index_sql;
    PREPARE phase5_stmt FROM @phase5_index_sql;
    EXECUTE phase5_stmt;
    DEALLOCATE PREPARE phase5_stmt;
  END IF;
END$$
DELIMITER ;

CALL sipriti_phase5_add_index_if_missing('official_signatures', 'idx_official_signatures_key', 'CREATE INDEX idx_official_signatures_key ON official_signatures (signature_key)');
CALL sipriti_phase5_add_index_if_missing('official_signatures', 'idx_official_signatures_key_active', 'CREATE INDEX idx_official_signatures_key_active ON official_signatures (signature_key, is_active)');
CALL sipriti_phase5_add_index_if_missing('official_signatures', 'idx_official_signatures_uploaded_by', 'CREATE INDEX idx_official_signatures_uploaded_by ON official_signatures (uploaded_by)');
CALL sipriti_phase5_add_index_if_missing('official_signatures', 'idx_official_signatures_sha256', 'CREATE INDEX idx_official_signatures_sha256 ON official_signatures (sha256)');
CALL sipriti_phase5_add_index_if_missing('official_signatures', 'idx_official_signatures_prodi', 'CREATE INDEX idx_official_signatures_prodi ON official_signatures (kode_prodi)');
CALL sipriti_phase5_add_index_if_missing('official_signatures', 'idx_official_signatures_key_prodi_active', 'CREATE INDEX idx_official_signatures_key_prodi_active ON official_signatures (signature_key, kode_prodi, is_active)');
CALL sipriti_phase5_add_index_if_missing('hkis', 'idx_hkis_user_id', 'CREATE INDEX idx_hkis_user_id ON hkis (user_id)');
CALL sipriti_phase5_add_index_if_missing('hkis', 'idx_hkis_status', 'CREATE INDEX idx_hkis_status ON hkis (status)');
CALL sipriti_phase5_add_index_if_missing('monevs', 'monevs_usulan_id_index', 'CREATE INDEX monevs_usulan_id_index ON monevs (usulan_id)');
CALL sipriti_phase5_add_index_if_missing('monevs', 'monevs_tgl_monev_index', 'CREATE INDEX monevs_tgl_monev_index ON monevs (tgl_monev)');

DROP PROCEDURE sipriti_phase5_add_index_if_missing;
