import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

interface ArtifactCheck {
  file: string;
  ok: boolean;
  notes: string[];
}

interface CheckSummary {
  migrations: ArtifactCheck[];
  sqlPatches: ArtifactCheck[];
}

const IDEMPOTENT_SQL_MARKERS: string[] = [
  "IF NOT EXISTS",
  "INSERT IGNORE",
  "ON DUPLICATE KEY",
  "WHERE NOT EXISTS",
  "DROP PROCEDURE IF EXISTS",
];

function hasIdempotentMarker(content: string): boolean {
  const upperContent = content.toUpperCase();
  return IDEMPOTENT_SQL_MARKERS.some((marker) => upperContent.includes(marker));
}

function checkMigrationContent(file: string, content: string): ArtifactCheck {
  const notes: string[] = [];
  if (!content.includes("export async function up")) {
    notes.push("missing exported up migration");
  }
  if (!content.includes("export async function down")) {
    notes.push("missing exported down migration");
  }

  return { file, ok: notes.length === 0, notes };
}

function checkSqlPatchContent(file: string, content: string): ArtifactCheck {
  const notes: string[] = [];
  if (!hasIdempotentMarker(content)) {
    notes.push("missing obvious idempotency marker");
  }
  if (content.toUpperCase().includes("FOREIGN KEY")) {
    if (!content.includes("SET FOREIGN_KEY_CHECKS = 0;")) {
      notes.push("foreign-key patch missing FK disable guard");
    }
    if (!content.includes("SET FOREIGN_KEY_CHECKS = 1;")) {
      notes.push("foreign-key patch missing FK restore guard");
    }
  }

  return { file, ok: notes.length === 0, notes };
}

async function checkDirectory(
  directory: string,
  extension: string,
  checker: (file: string, content: string) => ArtifactCheck,
): Promise<ArtifactCheck[]> {
  const entries = await readdir(directory);
  const checks: ArtifactCheck[] = [];

  for (const entry of entries.filter((file) => file.endsWith(extension)).sort()) {
    const fullPath = path.join(directory, entry);
    const content = await readFile(fullPath, "utf8");
    checks.push(checker(entry, content));
  }

  return checks;
}

async function main(): Promise<void> {
  const migrationsDirectory = path.join(process.cwd(), "src", "database", "migrations");
  const sqlDirectory = path.join(process.cwd(), "sql");
  const summary: CheckSummary = {
    migrations: await checkDirectory(migrationsDirectory, ".ts", checkMigrationContent),
    sqlPatches: await checkDirectory(sqlDirectory, ".sql", checkSqlPatchContent),
  };
  const failed = [...summary.migrations, ...summary.sqlPatches].filter((check) => !check.ok);

  console.log(JSON.stringify({ failed: failed.length, ...summary }, null, 2));
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown migration static-check failure";
  console.error(message);
  process.exit(1);
});
