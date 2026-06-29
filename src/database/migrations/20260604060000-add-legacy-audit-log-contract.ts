import type { QueryInterface, QueryInterfaceIndexOptions } from "sequelize";
import { DataTypes, QueryTypes } from "sequelize";

interface ExistsRow {
  found: number;
}

async function tableExists(queryInterface: QueryInterface, tableName: string): Promise<boolean> {
  const rows = await queryInterface.sequelize.query<ExistsRow>(
    "SELECT 1 AS found FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = :tableName LIMIT 1",
    { type: QueryTypes.SELECT, replacements: { tableName } },
  );
  return rows.length > 0;
}

async function columnExists(queryInterface: QueryInterface, tableName: string, columnName: string): Promise<boolean> {
  const rows = await queryInterface.sequelize.query<ExistsRow>(
    "SELECT 1 AS found FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :tableName AND column_name = :columnName LIMIT 1",
    { type: QueryTypes.SELECT, replacements: { tableName, columnName } },
  );
  return rows.length > 0;
}

async function indexExists(queryInterface: QueryInterface, tableName: string, indexName: string): Promise<boolean> {
  const rows = await queryInterface.sequelize.query<ExistsRow>(
    "SELECT 1 AS found FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = :tableName AND index_name = :indexName LIMIT 1",
    { type: QueryTypes.SELECT, replacements: { tableName, indexName } },
  );
  return rows.length > 0;
}

async function addColumnIfMissing(
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string,
  definition: Parameters<QueryInterface["addColumn"]>[2],
): Promise<void> {
  if (!(await columnExists(queryInterface, tableName, columnName))) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
}

async function removeColumnIfExists(
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string,
): Promise<void> {
  if (await columnExists(queryInterface, tableName, columnName)) {
    await queryInterface.removeColumn(tableName, columnName);
  }
}

async function addIndexIfMissing(
  queryInterface: QueryInterface,
  tableName: string,
  fields: string[],
  options: QueryInterfaceIndexOptions & { name: string },
): Promise<void> {
  if (!(await indexExists(queryInterface, tableName, options.name))) {
    await queryInterface.addIndex(tableName, fields, options);
  }
}

async function removeIndexIfExists(
  queryInterface: QueryInterface,
  tableName: string,
  indexName: string,
): Promise<void> {
  if (await indexExists(queryInterface, tableName, indexName)) {
    await queryInterface.removeIndex(tableName, indexName);
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  if (!(await tableExists(queryInterface, "audit_logs"))) {
    return;
  }

  await addColumnIfMissing(queryInterface, "audit_logs", "entity_type", { type: DataTypes.STRING(100), allowNull: true });
  await addColumnIfMissing(queryInterface, "audit_logs", "description", { type: DataTypes.STRING(500), allowNull: true });
  await addColumnIfMissing(queryInterface, "audit_logs", "old_value", { type: DataTypes.TEXT("long"), allowNull: true });
  await addColumnIfMissing(queryInterface, "audit_logs", "new_value", { type: DataTypes.TEXT("long"), allowNull: true });
  await addColumnIfMissing(queryInterface, "audit_logs", "user_name", { type: DataTypes.STRING(255), allowNull: true });
  await addColumnIfMissing(queryInterface, "audit_logs", "ip_address", { type: DataTypes.STRING(45), allowNull: true });
  await addColumnIfMissing(queryInterface, "audit_logs", "user_agent", { type: DataTypes.STRING(500), allowNull: true });
  await addColumnIfMissing(queryInterface, "audit_logs", "http_method", { type: DataTypes.STRING(10), allowNull: true });
  await addColumnIfMissing(queryInterface, "audit_logs", "endpoint", { type: DataTypes.STRING(500), allowNull: true });

  await queryInterface.sequelize.query(
    "UPDATE audit_logs SET entity_type = COALESCE(NULLIF(entity_type, ''), NULLIF(module, ''), 'audit_logs') WHERE entity_type IS NULL OR entity_type = ''",
  );
  await queryInterface.sequelize.query(
    "UPDATE audit_logs SET description = CONCAT(action, ' ', COALESCE(NULLIF(entity_type, ''), NULLIF(module, ''), 'audit_logs')) WHERE description IS NULL OR description = ''",
  );
  await queryInterface.sequelize.query(
    "UPDATE audit_logs SET old_value = `before` WHERE old_value IS NULL AND `before` IS NOT NULL",
  );
  await queryInterface.sequelize.query(
    "UPDATE audit_logs SET new_value = `after` WHERE new_value IS NULL AND `after` IS NOT NULL",
  );

  await addIndexIfMissing(queryInterface, "audit_logs", ["action"], { name: "idx_audit_action" });
  await addIndexIfMissing(queryInterface, "audit_logs", ["entity_type", "entity_id"], { name: "idx_audit_entity" });
  await addIndexIfMissing(queryInterface, "audit_logs", ["user_id"], { name: "idx_audit_user" });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  if (!(await tableExists(queryInterface, "audit_logs"))) {
    return;
  }

  await removeIndexIfExists(queryInterface, "audit_logs", "idx_audit_entity");
  await removeIndexIfExists(queryInterface, "audit_logs", "idx_audit_action");
  await removeIndexIfExists(queryInterface, "audit_logs", "idx_audit_user");

  await removeColumnIfExists(queryInterface, "audit_logs", "endpoint");
  await removeColumnIfExists(queryInterface, "audit_logs", "http_method");
  await removeColumnIfExists(queryInterface, "audit_logs", "user_agent");
  await removeColumnIfExists(queryInterface, "audit_logs", "ip_address");
  await removeColumnIfExists(queryInterface, "audit_logs", "user_name");
  await removeColumnIfExists(queryInterface, "audit_logs", "new_value");
  await removeColumnIfExists(queryInterface, "audit_logs", "old_value");
  await removeColumnIfExists(queryInterface, "audit_logs", "description");
  await removeColumnIfExists(queryInterface, "audit_logs", "entity_type");

}
