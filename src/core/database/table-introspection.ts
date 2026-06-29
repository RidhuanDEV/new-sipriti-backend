import { QueryTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

interface CountRow {
  total: number;
}

interface TableExistsRow {
  exists_flag: number;
}

const SAFE_IDENTIFIER_PATTERN = /^[a-zA-Z0-9_]+$/;

function assertSafeIdentifier(identifier: string): string {
  if (!SAFE_IDENTIFIER_PATTERN.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }

  return identifier;
}

export async function tableExists(tableName: string): Promise<boolean> {
  const safeTableName = assertSafeIdentifier(tableName);
  const rows = await sequelize.query<TableExistsRow>(
    `SELECT 1 AS exists_flag FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = :tableName LIMIT 1`,
    {
      type: QueryTypes.SELECT,
      replacements: { tableName: safeTableName },
    },
  );

  return rows.length > 0;
}

export async function countRowsByColumn(
  tableName: string,
  columnName: string,
  value: string,
): Promise<number> {
  const safeTableName = assertSafeIdentifier(tableName);
  const safeColumnName = assertSafeIdentifier(columnName);

  if (!(await tableExists(safeTableName))) {
    return 0;
  }

  const rows = await sequelize.query<CountRow>(
    `SELECT COUNT(*) AS total FROM \`${safeTableName}\` WHERE \`${safeColumnName}\` = :value`,
    {
      type: QueryTypes.SELECT,
      replacements: { value },
    },
  );

  return rows[0]?.total ?? 0;
}
