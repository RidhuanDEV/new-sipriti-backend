-- Phase 6 legacy audit log response-contract patch.
-- Idempotent manual production patch matching migration 20260604060000.

DROP PROCEDURE IF EXISTS sipriti_phase6_add_audit_column_if_missing;
DELIMITER $$
CREATE PROCEDURE sipriti_phase6_add_audit_column_if_missing(
  IN p_column_name VARCHAR(128),
  IN p_column_definition TEXT
)
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'audit_logs'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'audit_logs'
      AND column_name = p_column_name
  ) THEN
    SET @phase6_column_sql = CONCAT('ALTER TABLE audit_logs ADD COLUMN ', p_column_definition);
    PREPARE phase6_column_stmt FROM @phase6_column_sql;
    EXECUTE phase6_column_stmt;
    DEALLOCATE PREPARE phase6_column_stmt;
  END IF;
END$$
DELIMITER ;

CALL sipriti_phase6_add_audit_column_if_missing('entity_type', '`entity_type` VARCHAR(100) NULL');
CALL sipriti_phase6_add_audit_column_if_missing('description', '`description` VARCHAR(500) NULL');
CALL sipriti_phase6_add_audit_column_if_missing('old_value', '`old_value` LONGTEXT NULL');
CALL sipriti_phase6_add_audit_column_if_missing('new_value', '`new_value` LONGTEXT NULL');
CALL sipriti_phase6_add_audit_column_if_missing('user_name', '`user_name` VARCHAR(255) NULL');
CALL sipriti_phase6_add_audit_column_if_missing('ip_address', '`ip_address` VARCHAR(45) NULL');
CALL sipriti_phase6_add_audit_column_if_missing('user_agent', '`user_agent` VARCHAR(500) NULL');
CALL sipriti_phase6_add_audit_column_if_missing('http_method', '`http_method` VARCHAR(10) NULL');
CALL sipriti_phase6_add_audit_column_if_missing('endpoint', '`endpoint` VARCHAR(500) NULL');

DROP PROCEDURE sipriti_phase6_add_audit_column_if_missing;

UPDATE audit_logs
SET entity_type = COALESCE(NULLIF(entity_type, ''), NULLIF(module, ''), 'audit_logs')
WHERE entity_type IS NULL OR entity_type = '';

UPDATE audit_logs
SET description = CONCAT(action, ' ', COALESCE(NULLIF(entity_type, ''), NULLIF(module, ''), 'audit_logs'))
WHERE description IS NULL OR description = '';

UPDATE audit_logs
SET old_value = `before`
WHERE old_value IS NULL AND `before` IS NOT NULL;

UPDATE audit_logs
SET new_value = `after`
WHERE new_value IS NULL AND `after` IS NOT NULL;

DROP PROCEDURE IF EXISTS sipriti_phase6_add_audit_index_if_missing;
DELIMITER $$
CREATE PROCEDURE sipriti_phase6_add_audit_index_if_missing(
  IN p_index_name VARCHAR(128),
  IN p_index_sql TEXT
)
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'audit_logs'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'audit_logs'
      AND index_name = p_index_name
  ) THEN
    SET @phase6_index_sql = p_index_sql;
    PREPARE phase6_index_stmt FROM @phase6_index_sql;
    EXECUTE phase6_index_stmt;
    DEALLOCATE PREPARE phase6_index_stmt;
  END IF;
END$$
DELIMITER ;

CALL sipriti_phase6_add_audit_index_if_missing('idx_audit_action', 'CREATE INDEX idx_audit_action ON audit_logs (action)');
CALL sipriti_phase6_add_audit_index_if_missing('idx_audit_entity', 'CREATE INDEX idx_audit_entity ON audit_logs (entity_type, entity_id)');
CALL sipriti_phase6_add_audit_index_if_missing('idx_audit_user', 'CREATE INDEX idx_audit_user ON audit_logs (user_id)');

DROP PROCEDURE sipriti_phase6_add_audit_index_if_missing;
