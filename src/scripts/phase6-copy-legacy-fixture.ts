import mysql from "mysql2/promise";
import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { env } from "../config/env.js";

type SqlValue = string | number | boolean | Date | Buffer | null;

type GenericRow = RowDataPacket & Record<string, SqlValue | undefined>;

interface ColumnRow extends RowDataPacket {
  Field: string;
}

interface NameIdRow extends RowDataPacket {
  id: string;
  name: string;
}

interface CountRow extends RowDataPacket {
  count: number;
}

type ValueOverride = (row: GenericRow) => SqlValue;

const LEGACY_DATABASE_URL = process.env.LEGACY_DATABASE_URL ?? "mysql://root@localhost:3306/sipriti_db";

const TABLE_COPY_ORDER = [
  "prodis",
  "skemas",
  "bidang_fokus",
  "tahun_akademik",
  "outputs",
  "sertifikat_mutu",
  "users",
  "user_roles",
  "uploaded_files",
  "berita",
  "pengumuman",
  "panduan",
  "carousel",
  "landing_slider",
  "deskripsi_capaian",
  "kategori_publikasi",
  "publikasi",
  "mitra_kerja_riset",
  "product_riset",
  "penghargaan_riset",
  "hibahinternal",
  "userhibahinternalpair",
  "haki_proposals",
  "memberproposals",
  "mahasiswas",
  "notifications",
  "tbl_penelitian_proposals",
  "tbl_pengabdian_proposals",
  "jadwal_bulanan",
  "jadwal_proposal",
  "luaranproposals",
  "rabproposals",
  "haki_proposal_outputs",
  "laporan_usulan",
  "official_signatures",
  "hkis",
  "monevs",
  "audit_logs",
] as const;

const TIMESTAMP_ALIASES = new Map<string, string>([
  ["created_at", "createdAt"],
  ["updated_at", "updatedAt"],
  ["deleted_at", "deletedAt"],
  ["createdAt", "created_at"],
  ["updatedAt", "updated_at"],
  ["deletedAt", "deleted_at"],
]);

const LEGACY_AUDIT_COLUMNS = [
  "entity_type",
  "description",
  "old_value",
  "new_value",
  "user_name",
  "ip_address",
  "user_agent",
  "http_method",
  "endpoint",
] as const;

function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `\`${identifier}\``;
}

async function getColumns(connection: Connection, tableName: string): Promise<Set<string>> {
  const [rows] = await connection.query<ColumnRow[]>(`SHOW COLUMNS FROM ${quoteIdentifier(tableName)}`);
  return new Set(rows.map((row) => row.Field));
}

async function tableExists(connection: Connection, tableName: string): Promise<boolean> {
  const [rows] = await connection.query<RowDataPacket[]>("SHOW TABLES LIKE ?", [tableName]);
  return rows.length > 0;
}

async function fetchRows(connection: Connection, tableName: string): Promise<GenericRow[]> {
  const [rows] = await connection.query<GenericRow[]>(`SELECT * FROM ${quoteIdentifier(tableName)}`);
  return rows;
}

async function insertIgnore(
  connection: Connection,
  tableName: string,
  values: Readonly<Record<string, SqlValue>>,
): Promise<void> {
  const columns = Object.keys(values);
  if (columns.length === 0) {
    return;
  }

  const sql = [
    `INSERT IGNORE INTO ${quoteIdentifier(tableName)}`,
    `(${columns.map(quoteIdentifier).join(", ")})`,
    `VALUES (${columns.map(() => "?").join(", ")})`,
  ].join(" ");

  await connection.execute<ResultSetHeader>(
    sql,
    columns.map((column) => values[column] ?? null),
  );
}

async function fetchNameIdMap(connection: Connection, tableName: "roles" | "permissions"): Promise<Map<string, string>> {
  const [rows] = await connection.query<NameIdRow[]>(`SELECT id, name FROM ${quoteIdentifier(tableName)}`);
  return new Map(rows.map((row) => [row.name, row.id]));
}

async function copyNamedRows(
  source: Connection,
  target: Connection,
  tableName: "roles" | "permissions",
): Promise<Map<string, string>> {
  const sourceRows = await fetchRows(source, tableName);
  const targetByName = await fetchNameIdMap(target, tableName);
  const sourceColumns = await getColumns(source, tableName);
  const targetColumns = await getColumns(target, tableName);
  const metadataColumns =
    tableName === "permissions"
      ? ["description", "module", "created_at", "updated_at"]
      : ["description", "is_active", "created_at", "updated_at"];

  for (const row of sourceRows) {
    const nameValue = row.name;
    if (typeof row.id !== "string" || typeof nameValue !== "string") {
      continue;
    }
    if (!targetByName.has(nameValue)) {
      await insertIgnore(target, tableName, {
        id: row.id,
        name: nameValue,
        created_at: row.created_at ?? row.createdAt ?? new Date(),
        updated_at: row.updated_at ?? row.updatedAt ?? new Date(),
      });
    }

    const updates: Record<string, SqlValue> = {};
    for (const targetColumn of metadataColumns) {
      if (!targetColumns.has(targetColumn)) {
        continue;
      }
      const sourceColumn = sourceColumnForTarget(targetColumn, sourceColumns);
      if (sourceColumn) {
        updates[targetColumn] = row[sourceColumn] ?? null;
      }
    }

    const columns = Object.keys(updates);
    if (columns.length > 0) {
      await target.execute<ResultSetHeader>(
        `UPDATE ${quoteIdentifier(tableName)} SET ${columns.map((column) => `${quoteIdentifier(column)} = ?`).join(", ")} WHERE ${quoteIdentifier("name")} = ?`,
        [...columns.map((column) => updates[column] ?? null), nameValue],
      );
    }
  }

  return fetchNameIdMap(target, tableName);
}

async function buildLegacyIdToTargetIdMap(
  source: Connection,
  target: Connection,
  tableName: "roles" | "permissions",
): Promise<Map<string, string>> {
  const sourceRows = await fetchRows(source, tableName);
  const targetByName = await fetchNameIdMap(target, tableName);
  const map = new Map<string, string>();

  for (const row of sourceRows) {
    if (typeof row.id !== "string" || typeof row.name !== "string") {
      continue;
    }
    const targetId = targetByName.get(row.name);
    if (targetId) {
      map.set(row.id, targetId);
    }
  }

  return map;
}

async function copyRolePermissions(
  source: Connection,
  target: Connection,
  roleIdMap: ReadonlyMap<string, string>,
  permissionIdMap: ReadonlyMap<string, string>,
): Promise<number> {
  const rows = await fetchRows(source, "role_permissions");
  let copied = 0;

  for (const row of rows) {
    if (typeof row.role_id !== "string" || typeof row.permission_id !== "string") {
      continue;
    }
    const roleId = roleIdMap.get(row.role_id);
    const permissionId = permissionIdMap.get(row.permission_id);
    if (!roleId || !permissionId) {
      continue;
    }
    await insertIgnore(target, "role_permissions", {
      role_id: roleId,
      permission_id: permissionId,
    });
    copied += 1;
  }

  return copied;
}

function sourceColumnForTarget(targetColumn: string, sourceColumns: ReadonlySet<string>): string | null {
  if (sourceColumns.has(targetColumn)) {
    return targetColumn;
  }

  const alias = TIMESTAMP_ALIASES.get(targetColumn);
  if (alias && sourceColumns.has(alias)) {
    return alias;
  }

  return null;
}

async function copyCompatibleTable(
  source: Connection,
  target: Connection,
  tableName: string,
  overrides: Readonly<Record<string, ValueOverride>>,
): Promise<number> {
  if (!(await tableExists(source, tableName)) || !(await tableExists(target, tableName))) {
    return 0;
  }

  const sourceColumns = await getColumns(source, tableName);
  const targetColumns = await getColumns(target, tableName);
  const rows = await fetchRows(source, tableName);
  let copied = 0;

  for (const row of rows) {
    const values: Record<string, SqlValue> = {};
    for (const targetColumn of targetColumns) {
      const override = overrides[targetColumn];
      if (override) {
        values[targetColumn] = override(row);
        continue;
      }

      const sourceColumn = sourceColumnForTarget(targetColumn, sourceColumns);
      if (sourceColumn) {
        values[targetColumn] = row[sourceColumn] ?? null;
      }
    }
    await insertIgnore(target, tableName, values);
    copied += 1;
  }

  return copied;
}

async function updateLegacyAuditLogColumns(source: Connection, target: Connection): Promise<number> {
  if (!(await tableExists(source, "audit_logs")) || !(await tableExists(target, "audit_logs"))) {
    return 0;
  }

  const sourceColumns = await getColumns(source, "audit_logs");
  const targetColumns = await getColumns(target, "audit_logs");
  const columns = LEGACY_AUDIT_COLUMNS.filter((column) => sourceColumns.has(column) && targetColumns.has(column));
  if (columns.length === 0) {
    return 0;
  }

  const rows = await fetchRows(source, "audit_logs");
  let updated = 0;

  for (const row of rows) {
    if (typeof row.id !== "string") {
      continue;
    }

    const assignments = columns.map((column) => `${quoteIdentifier(column)} = ?`).join(", ");
    await target.execute<ResultSetHeader>(
      `UPDATE ${quoteIdentifier("audit_logs")} SET ${assignments} WHERE ${quoteIdentifier("id")} = ?`,
      [...columns.map((column) => row[column] ?? null), row.id],
    );
    updated += 1;
  }

  return updated;
}

async function countRows(connection: Connection, tableName: string): Promise<number> {
  if (!(await tableExists(connection, tableName))) {
    return 0;
  }
  const [rows] = await connection.query<CountRow[]>(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)}`);
  return rows[0]?.count ?? 0;
}

async function main(): Promise<void> {
  const source = await mysql.createConnection(LEGACY_DATABASE_URL);
  const target = await mysql.createConnection(env.DATABASE_URL);
  const copiedTables: Record<string, number> = {};

  try {
    await target.query("SET FOREIGN_KEY_CHECKS = 0");

    await copyNamedRows(source, target, "roles");
    await copyNamedRows(source, target, "permissions");
    const roleIdMap = await buildLegacyIdToTargetIdMap(source, target, "roles");
    const permissionIdMap = await buildLegacyIdToTargetIdMap(source, target, "permissions");
    copiedTables.role_permissions = await copyRolePermissions(source, target, roleIdMap, permissionIdMap);

    for (const tableName of TABLE_COPY_ORDER) {
      const overrides: Record<string, ValueOverride> = {};
      if (tableName === "users") {
        overrides.role_id = (row) => typeof row.role_id === "string" ? roleIdMap.get(row.role_id) ?? row.role_id : row.role_id ?? null;
      }
      if (tableName === "user_roles") {
        overrides.role_id = (row) => typeof row.role_id === "string" ? roleIdMap.get(row.role_id) ?? row.role_id : row.role_id ?? null;
      }
      copiedTables[tableName] = await copyCompatibleTable(source, target, tableName, overrides);
    }
    copiedTables.audit_logs_legacy_column_updates = await updateLegacyAuditLogColumns(source, target);
  } finally {
    await target.query("SET FOREIGN_KEY_CHECKS = 1");
    await source.end();
    await target.end();
  }

  const summaryConnection = await mysql.createConnection(env.DATABASE_URL);
  try {
    const summary: Record<string, number> = {};
    for (const tableName of ["users", "roles", "permissions", "role_permissions", "prodis", "skemas", "berita", "pengumuman", "panduan", "haki_proposals", "memberproposals", "laporan_usulan", "audit_logs"]) {
      summary[tableName] = await countRows(summaryConnection, tableName);
    }
    console.log(JSON.stringify({ copiedTables, summary }, null, 2));
  } finally {
    await summaryConnection.end();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown fixture copy failure";
  console.error(message);
  process.exit(1);
});
