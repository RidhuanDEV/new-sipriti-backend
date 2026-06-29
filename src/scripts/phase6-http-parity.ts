import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import { env } from "../config/env.js";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import type { RowDataPacket } from "mysql2";

type HttpMethod = "GET" | "POST";
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

interface JsonObject {
  [key: string]: JsonValue;
}

interface RoleRow extends RowDataPacket {
  id: string;
}

interface ProdiRow extends RowDataPacket {
  kode_prodi: string;
}

interface ParityCase {
  group: string;
  name: string;
  method: HttpMethod;
  path: string;
  auth: boolean;
  body?: JsonObject;
  compareShape: boolean;
  requiredPaths: string[];
  forbiddenPaths: string[];
}

interface HttpResult {
  status: number;
  contentType: string;
  body: JsonValue | string | null;
  bodyPrefix: string;
  bodySignature: string[];
}

interface ParityResult {
  group: string;
  name: string;
  method: HttpMethod;
  path: string;
  oldStatus: number;
  newStatus: number;
  ok: boolean;
  differences: string[];
  oldBodyPrefix: string;
  newBodyPrefix: string;
  oldBodySignature: string[];
  newBodySignature: string[];
}

interface StartedProcess {
  label: string;
  process: ChildProcessWithoutNullStreams;
}

const WORKSPACE_ROOT = path.resolve(process.cwd(), "..");
const OLD_ROOT = path.join(WORKSPACE_ROOT, "sipriti_backend");
const RESULT_DIR = path.join(process.cwd(), "docs", "migration");
const OLD_PORT = 3010;
const NEW_PORT = env.PORT;
const OLD_BASE_URL = `http://127.0.0.1:${OLD_PORT}`;
const NEW_BASE_URL = `http://127.0.0.1:${NEW_PORT}`;
const LEGACY_DATABASE_URL =
  process.env.LEGACY_DATABASE_URL || "mysql://root@localhost:3308/sipriti_db";
const TEST_USER_ID = "01970000-0000-7000-8000-000000000006";
const TEST_USERNAME = "phase6_admin";
const TEST_PASSWORD = "Phase6LocalOnly123";
const TEST_EMAIL = "phase6_admin@example.test";
const TEST_NIDN = "9900000006";

const PARITY_CASES: ParityCase[] = [
  {
    group: "auth",
    name: "login",
    method: "POST",
    path: "/api/auth/login",
    auth: false,
    body: { username: TEST_USERNAME, password: TEST_PASSWORD },
    compareShape: true,
    requiredPaths: ["success", "message", "data.user.id", "data.user.role"],
    forbiddenPaths: ["data.token"],
  },
  {
    group: "auth",
    name: "me",
    method: "GET",
    path: "/api/auth/me",
    auth: true,
    compareShape: true,
    requiredPaths: ["success", "message", "data.permissions"],
    forbiddenPaths: ["data.password"],
  },
  {
    group: "auth",
    name: "users-me-alias",
    method: "GET",
    path: "/api/users/me",
    auth: true,
    compareShape: true,
    requiredPaths: ["success", "data.permissions"],
    forbiddenPaths: ["data.password"],
  },
  {
    group: "auth",
    name: "user-search",
    method: "GET",
    path: "/api/users/search?query=phase6",
    auth: true,
    compareShape: true,
    requiredPaths: ["success", "data"],
    forbiddenPaths: ["data.password"],
  },
  {
    group: "auth",
    name: "user-admin-list",
    method: "GET",
    path: "/api/users/admin/list?page=1&limit=2",
    auth: true,
    compareShape: true,
    requiredPaths: ["success", "data"],
    forbiddenPaths: ["data.password"],
  },
  {
    group: "public-content",
    name: "berita-list",
    method: "GET",
    path: "/api/berita?page=1&limit=2",
    auth: false,
    compareShape: true,
    requiredPaths: ["success", "data"],
    forbiddenPaths: ["data.password"],
  },
  {
    group: "public-content",
    name: "pengumuman-list",
    method: "GET",
    path: "/api/pengumuman?page=1&limit=2",
    auth: false,
    compareShape: true,
    requiredPaths: ["success", "data"],
    forbiddenPaths: ["data.password"],
  },
  {
    group: "public-content",
    name: "panduan-list",
    method: "GET",
    path: "/api/panduan?page=1&limit=2",
    auth: false,
    compareShape: true,
    requiredPaths: ["success", "data"],
    forbiddenPaths: ["data.password"],
  },
  {
    group: "public-content",
    name: "publicpage-berita",
    method: "GET",
    path: "/api/publicpage/berita?page=1&limit=2",
    auth: false,
    compareShape: true,
    requiredPaths: ["success", "data"],
    forbiddenPaths: ["data.password"],
  },
  {
    group: "master-data",
    name: "prodi-options",
    method: "GET",
    path: "/api/prodi/options",
    auth: false,
    compareShape: true,
    requiredPaths: ["success", "data"],
    forbiddenPaths: [],
  },
  {
    group: "master-data",
    name: "skema-options",
    method: "GET",
    path: "/api/skema/options",
    auth: false,
    compareShape: true,
    requiredPaths: ["success", "data"],
    forbiddenPaths: [],
  },
  {
    group: "master-data",
    name: "bidang-fokus-options",
    method: "GET",
    path: "/api/bidang-fokus/options",
    auth: false,
    compareShape: true,
    requiredPaths: ["success", "data"],
    forbiddenPaths: [],
  },
  {
    group: "proposal",
    name: "penelitian-options",
    method: "GET",
    path: "/api/penelitian/options",
    auth: true,
    compareShape: true,
    requiredPaths: ["success", "data"],
    forbiddenPaths: ["data.password"],
  },
  {
    group: "proposal",
    name: "pengabdian-options",
    method: "GET",
    path: "/api/pengabdian/options",
    auth: true,
    compareShape: true,
    requiredPaths: ["success", "data"],
    forbiddenPaths: ["data.password"],
  },
  {
    group: "proposal",
    name: "search-anggota",
    method: "GET",
    path: "/api/usulan/search-anggota?query=phase6",
    auth: true,
    compareShape: true,
    requiredPaths: ["success", "data"],
    forbiddenPaths: ["data.password"],
  },
  {
    group: "dashboard",
    name: "dashboard-counts",
    method: "GET",
    path: "/api/dashboard/counts",
    auth: true,
    compareShape: true,
    requiredPaths: ["success", "data"],
    forbiddenPaths: [],
  },
  {
    group: "dashboard",
    name: "admin-dashboard-stats",
    method: "GET",
    path: "/api/admin/dashboard/stats",
    auth: true,
    compareShape: true,
    requiredPaths: ["success", "data"],
    forbiddenPaths: [],
  },
  {
    group: "auditlog",
    name: "audit-logs",
    method: "GET",
    path: "/api/audit-logs?page=1&limit=2",
    auth: true,
    compareShape: true,
    requiredPaths: ["success", "data"],
    forbiddenPaths: ["data.password"],
  },
  {
    group: "notification",
    name: "unread-count",
    method: "GET",
    path: "/api/notifications/unread-count",
    auth: true,
    compareShape: true,
    requiredPaths: ["success", "data"],
    forbiddenPaths: [],
  },
  {
    group: "auth",
    name: "logout",
    method: "POST",
    path: "/api/auth/logout",
    auth: true,
    body: {},
    compareShape: true,
    requiredPaths: ["success", "message"],
    forbiddenPaths: ["data.token"],
  },
];

class CookieJar {
  private readonly values = new Map<string, string>();

  absorb(combinedSetCookieHeader: string | null): void {
    if (!combinedSetCookieHeader) {
      return;
    }

    for (const header of splitSetCookieHeader(combinedSetCookieHeader)) {
      const cookiePair = header.split(";")[0];
      if (!cookiePair) {
        continue;
      }

      const separatorIndex = cookiePair.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const name = cookiePair.slice(0, separatorIndex).trim();
      const value = cookiePair.slice(separatorIndex + 1).trim();
      if (value.length === 0) {
        this.values.delete(name);
      } else {
        this.values.set(name, value);
      }
    }
  }

  header(): string | undefined {
    const serialized = Array.from(this.values.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
    return serialized.length > 0 ? serialized : undefined;
  }

  csrfToken(): string | undefined {
    return this.values.get("XSRF-TOKEN");
  }
}

function splitSetCookieHeader(header: string): string[] {
  return header
    .split(/,(?=\s*[^;,\s]+=)/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function isJsonObject(value: JsonValue | string | null): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasPath(value: JsonValue | string | null, dotPath: string): boolean {
  let current: JsonValue | string | null = value;
  for (const segment of dotPath.split(".")) {
    if (!isJsonObject(current)) {
      return false;
    }
    if (!(segment in current)) {
      return false;
    }
    const next = current[segment];
    if (next === undefined) {
      return false;
    }
    current = next;
  }
  return true;
}

function collectSignature(
  value: JsonValue | string | null,
  prefix = "body",
  depth = 0,
): string[] {
  if (value === null) {
    return [`${prefix}:null`];
  }

  if (Array.isArray(value)) {
    const entries = [`${prefix}:array`];
    if (value.length > 0 && depth < 3) {
      entries.push(...collectSignature(value[0] ?? null, `${prefix}[]`, depth + 1));
    }
    return entries;
  }

  if (typeof value === "object") {
    const entries = [`${prefix}:object`];
    if (depth >= 3) {
      return entries;
    }

    for (const key of Object.keys(value).sort()) {
      entries.push(...collectSignature(value[key] ?? null, `${prefix}.${key}`, depth + 1));
    }
    return entries;
  }

  return [`${prefix}:${typeof value}`];
}

function bodyPreview(bodyText: string): string {
  return bodyText.replace(/\s+/g, " ").slice(0, 300);
}

async function parseResponse(response: Response): Promise<HttpResult> {
  const contentType = response.headers.get("content-type") || "";
  const bodyText = await response.text();
  const body =
    bodyText.length === 0
      ? null
      : contentType.includes("application/json")
        ? JSON.parse(bodyText)
        : bodyText;

  return {
    status: response.status,
    contentType,
    body,
    bodyPrefix: bodyPreview(bodyText),
    bodySignature: collectSignature(body),
  };
}

async function request(
  baseUrl: string,
  parityCase: ParityCase,
  jar: CookieJar,
): Promise<HttpResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const cookieHeader = jar.header();
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }
  const csrfToken = jar.csrfToken();
  if (parityCase.method !== "GET" && csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const requestInit: RequestInit = {
    method: parityCase.method,
    headers,
  };
  if (parityCase.method !== "GET") {
    requestInit.body = JSON.stringify(parityCase.body ?? {});
  }

  const response = await fetch(`${baseUrl}${parityCase.path}`, requestInit);
  jar.absorb(response.headers.get("set-cookie"));
  return parseResponse(response);
}

function compareResponses(
  parityCase: ParityCase,
  oldResult: HttpResult,
  newResult: HttpResult,
): string[] {
  const differences: string[] = [];

  if (oldResult.status !== newResult.status) {
    differences.push(`status ${oldResult.status} != ${newResult.status}`);
  }

  if (parityCase.compareShape) {
    const oldSignature = oldResult.bodySignature.join("\n");
    const newSignature = newResult.bodySignature.join("\n");
    if (oldSignature !== newSignature) {
      differences.push("body signature differs");
    }
  }

  for (const requiredPath of parityCase.requiredPaths) {
    if (!hasPath(oldResult.body, requiredPath)) {
      differences.push(`old missing required path ${requiredPath}`);
    }
    if (!hasPath(newResult.body, requiredPath)) {
      differences.push(`new missing required path ${requiredPath}`);
    }
  }

  for (const forbiddenPath of parityCase.forbiddenPaths) {
    if (hasPath(oldResult.body, forbiddenPath)) {
      differences.push(`old exposes forbidden path ${forbiddenPath}`);
    }
    if (hasPath(newResult.body, forbiddenPath)) {
      differences.push(`new exposes forbidden path ${forbiddenPath}`);
    }
  }

  return differences;
}

async function findRoleId(connection: mysql.Connection, roleName: string): Promise<string> {
  const [rows] = await connection.query<RoleRow[]>(
    "SELECT id FROM roles WHERE name = ? LIMIT 1",
    [roleName],
  );
  const role = rows[0];
  if (!role) {
    throw new Error(`Role ${roleName} not found`);
  }
  return role.id;
}

async function findNewRoleId(connection: mysql.Connection, roleName: string): Promise<string> {
  const [rows] = await connection.query<RoleRow[]>(
    "SELECT id FROM roles WHERE name = ? ORDER BY created_at DESC LIMIT 1",
    [roleName],
  );
  const role = rows[0];
  if (!role) {
    throw new Error(`Role ${roleName} not found`);
  }
  return role.id;
}

async function findProdiKode(connection: mysql.Connection): Promise<string | null> {
  const [rows] = await connection.query<ProdiRow[]>(
    "SELECT kode_prodi FROM prodis ORDER BY kode_prodi LIMIT 1",
  );
  return rows[0]?.kode_prodi ?? null;
}

async function prepareParityUser(): Promise<void> {
  const legacyConnection = await mysql.createConnection(LEGACY_DATABASE_URL);
  const newConnection = await mysql.createConnection(env.DATABASE_URL);

  try {
    const legacyAdminRoleId = await findRoleId(legacyConnection, "admin");
    const newAdminRoleId = await findNewRoleId(newConnection, "admin");
    const prodiKode =
      (await findProdiKode(legacyConnection)) ?? (await findProdiKode(newConnection));
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

    await legacyConnection.execute(
      `INSERT INTO users
        (id, name, username, password, nidn, email, institusi, prodi_kode, role_id, createdAt, updatedAt, deletedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
       ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        password = VALUES(password),
        nidn = VALUES(nidn),
        email = VALUES(email),
        institusi = VALUES(institusi),
        prodi_kode = VALUES(prodi_kode),
        role_id = VALUES(role_id),
        updatedAt = NOW(),
        deletedAt = NULL`,
      [
        TEST_USER_ID,
        "Phase 6 Admin",
        TEST_USERNAME,
        passwordHash,
        TEST_NIDN,
        TEST_EMAIL,
        "Institut Teknologi Indonesia",
        prodiKode,
        legacyAdminRoleId,
      ],
    );

    await legacyConnection.execute(
      `INSERT INTO user_roles (id, user_id, role_id, assigned_at, assigned_by, created_at)
       VALUES (UUID(), ?, ?, NOW(), NULL, NOW())
       ON DUPLICATE KEY UPDATE assigned_at = VALUES(assigned_at)`,
      [TEST_USER_ID, legacyAdminRoleId],
    );

    await newConnection.execute(
      `INSERT INTO users
        (id, email, password, role_id, created_at, updated_at, deleted_at, name, username, nidn, institusi, prodi_kode)
       VALUES (?, ?, ?, ?, NOW(), NOW(), NULL, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        email = VALUES(email),
        password = VALUES(password),
        role_id = VALUES(role_id),
        updated_at = NOW(),
        deleted_at = NULL,
        name = VALUES(name),
        username = VALUES(username),
        nidn = VALUES(nidn),
        institusi = VALUES(institusi),
        prodi_kode = VALUES(prodi_kode)`,
      [
        TEST_USER_ID,
        TEST_EMAIL,
        passwordHash,
        newAdminRoleId,
        "Phase 6 Admin",
        TEST_USERNAME,
        TEST_NIDN,
        "Institut Teknologi Indonesia",
        prodiKode,
      ],
    );

    await newConnection.execute(
      `INSERT INTO user_roles (id, user_id, role_id, assigned_at, assigned_by)
       VALUES (UUID(), ?, ?, NOW(), NULL)
       ON DUPLICATE KEY UPDATE assigned_at = VALUES(assigned_at)`,
      [TEST_USER_ID, newAdminRoleId],
    );
  } finally {
    await legacyConnection.end();
    await newConnection.end();
  }
}

function startProcess(label: string, cwd: string, args: string[], port: number): StartedProcess {
  const logPath = path.join(RESULT_DIR, `phase6-${label}-server.log`);
  const logStream = createWriteStream(logPath, { flags: "w" });
  const child = spawn(process.execPath, args, {
    cwd,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: "development",
    },
    windowsHide: true,
  });

  child.stdout.on("data", (chunk: Buffer) => {
    logStream.write(chunk);
  });
  child.stderr.on("data", (chunk: Buffer) => {
    logStream.write(chunk);
  });
  child.on("close", () => {
    logStream.end();
  });

  return { label, process: child };
}

async function stopProcess(started: StartedProcess): Promise<void> {
  if (started.process.exitCode !== null) {
    return;
  }

  started.process.kill("SIGTERM");
  await Promise.race([
    new Promise<void>((resolve) => {
      started.process.once("exit", () => resolve());
    }),
    delay(5_000).then(() => {
      if (started.process.exitCode === null) {
        started.process.kill("SIGKILL");
      }
    }),
  ]);
}

async function waitForServer(
  started: StartedProcess,
  baseUrl: string,
  readinessPath: string,
): Promise<void> {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    if (started.process.exitCode !== null) {
      throw new Error(`${started.label} server exited before readiness`);
    }

    try {
      const response = await fetch(`${baseUrl}${readinessPath}`);
      if (response.status < 500) {
        return;
      }
    } catch {
      // The server may still be binding the port.
    }

    await delay(500);
  }

  throw new Error(`${started.label} server did not become ready`);
}

async function primeCsrf(baseUrl: string, jar: CookieJar): Promise<void> {
  const response = await fetch(`${baseUrl}/api/berita?page=1&limit=1`);
  jar.absorb(response.headers.get("set-cookie"));
}

async function runParity(): Promise<ParityResult[]> {
  const oldJar = new CookieJar();
  const newJar = new CookieJar();
  const results: ParityResult[] = [];

  await primeCsrf(OLD_BASE_URL, oldJar);
  await primeCsrf(NEW_BASE_URL, newJar);

  for (const parityCase of PARITY_CASES) {
    const oldResult = await request(OLD_BASE_URL, parityCase, oldJar);
    const newResult = await request(NEW_BASE_URL, parityCase, newJar);
    const differences = compareResponses(parityCase, oldResult, newResult);

    results.push({
      group: parityCase.group,
      name: parityCase.name,
      method: parityCase.method,
      path: parityCase.path,
      oldStatus: oldResult.status,
      newStatus: newResult.status,
      ok: differences.length === 0,
      differences,
      oldBodyPrefix: oldResult.bodyPrefix,
      newBodyPrefix: newResult.bodyPrefix,
      oldBodySignature: oldResult.bodySignature,
      newBodySignature: newResult.bodySignature,
    });
  }

  return results;
}

async function main(): Promise<void> {
  await mkdir(RESULT_DIR, { recursive: true });
  await prepareParityUser();

  const oldProcess = startProcess("old", OLD_ROOT, ["index.js"], OLD_PORT);
  const newProcess = startProcess("new", process.cwd(), ["dist/server.js"], NEW_PORT);

  try {
    await waitForServer(oldProcess, OLD_BASE_URL, "/api/berita?page=1&limit=1");
    await waitForServer(newProcess, NEW_BASE_URL, "/health");
    const results = await runParity();
    const failed = results.filter((result) => !result.ok);
    const output = {
      oldBaseUrl: OLD_BASE_URL,
      newBaseUrl: NEW_BASE_URL,
      total: results.length,
      failed: failed.length,
      results,
    };
    await writeFile(
      path.join(RESULT_DIR, "phase6-http-parity-results.json"),
      JSON.stringify(output, null, 2),
      "utf-8",
    );
    console.log(JSON.stringify(output, null, 2));
    process.exitCode = failed.length === 0 ? 0 : 1;
  } finally {
    await stopProcess(oldProcess);
    await stopProcess(newProcess);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Phase 6 HTTP parity failed";
  console.error(message);
  process.exit(1);
});
