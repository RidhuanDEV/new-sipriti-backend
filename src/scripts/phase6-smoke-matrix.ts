import http from "node:http";
import { app } from "../app.js";

type SmokeMethod = "GET" | "POST";

interface SmokeCase {
  group: string;
  method: SmokeMethod;
  path: string;
  expectedStatus: number;
}

interface SmokeResult extends SmokeCase {
  status: number;
  ok: boolean;
  bodyPrefix: string;
}

const SMOKE_CASES: SmokeCase[] = [
  { group: "health", method: "GET", path: "/health", expectedStatus: 200 },
  { group: "root", method: "GET", path: "/api/", expectedStatus: 200 },
  { group: "auth", method: "GET", path: "/api/auth/me", expectedStatus: 401 },
  { group: "auth", method: "POST", path: "/api/auth/logout", expectedStatus: 401 },
  { group: "rbac", method: "GET", path: "/api/permissions", expectedStatus: 401 },
  { group: "rbac-legacy", method: "GET", path: "/api/rbac/roles", expectedStatus: 401 },
  { group: "master-data", method: "GET", path: "/api/admin/prodi", expectedStatus: 401 },
  { group: "admin-usulan", method: "GET", path: "/api/admin/usulan", expectedStatus: 401 },
  { group: "product-legacy", method: "GET", path: "/api/products", expectedStatus: 200 },
  { group: "upload", method: "POST", path: "/api/upload/richtext", expectedStatus: 403 },
  { group: "proposal", method: "POST", path: "/api/proposal", expectedStatus: 403 },
  { group: "penelitian", method: "GET", path: "/api/penelitian", expectedStatus: 401 },
  { group: "penelitian-alias", method: "GET", path: "/api/usulan-penelitian", expectedStatus: 401 },
  { group: "pengabdian", method: "GET", path: "/api/pengabdian", expectedStatus: 401 },
  { group: "pengabdian-alias", method: "GET", path: "/api/usulan-pengabdian", expectedStatus: 401 },
  { group: "proposal-section", method: "GET", path: "/api/proposals/00000000-0000-4000-8000-000000000000/jadwal", expectedStatus: 401 },
  { group: "search-anggota", method: "GET", path: "/api/usulan/search-anggota?keyword=rid", expectedStatus: 401 },
  { group: "review", method: "GET", path: "/api/proposal-review/penelitian", expectedStatus: 401 },
  { group: "laporan", method: "GET", path: "/api/laporan-usulan", expectedStatus: 401 },
  { group: "pdf", method: "GET", path: "/api/proposal-final-pdf/user/00000000-0000-4000-8000-000000000000", expectedStatus: 401 },
  { group: "signature", method: "GET", path: "/api/admin/signatures", expectedStatus: 401 },
  { group: "hki", method: "GET", path: "/api/hki", expectedStatus: 401 },
  { group: "hki-review", method: "GET", path: "/api/hki-review/stats", expectedStatus: 401 },
  { group: "monev", method: "GET", path: "/api/monev", expectedStatus: 401 },
  { group: "admin-monev", method: "GET", path: "/api/admin/monev/options/usulan", expectedStatus: 401 },
  { group: "dashboard", method: "GET", path: "/api/dashboard/counts", expectedStatus: 401 },
  { group: "admin-dashboard", method: "GET", path: "/api/admin/dashboard/stats", expectedStatus: 401 },
  { group: "auditlog", method: "GET", path: "/api/audit-logs", expectedStatus: 401 },
  { group: "bulk-import", method: "POST", path: "/api/admin/usulan/import/template", expectedStatus: 403 },
  { group: "bulk-import", method: "POST", path: "/api/admin/usulan/import", expectedStatus: 403 },
];

function createServer(): Promise<http.Server> {
  const server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function closeServer(server: http.Server): Promise<void> {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function runSmokeCase(baseUrl: string, smokeCase: SmokeCase): Promise<SmokeResult> {
  const requestInit: RequestInit = { method: smokeCase.method };
  if (smokeCase.method === "POST") {
    requestInit.headers = { "Content-Type": "application/json" };
    requestInit.body = JSON.stringify({});
  }

  const response = await fetch(`${baseUrl}${smokeCase.path}`, requestInit);
  const body = await response.text();

  return {
    ...smokeCase,
    status: response.status,
    ok: response.status === smokeCase.expectedStatus,
    bodyPrefix: body.slice(0, 140),
  };
}

async function main(): Promise<void> {
  const server = await createServer();
  const address = server.address();
  if (address === null || typeof address === "string") {
    await closeServer(server);
    throw new Error("Phase 6 smoke server did not expose a TCP port");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;
  const results: SmokeResult[] = [];

  try {
    for (const smokeCase of SMOKE_CASES) {
      results.push(await runSmokeCase(baseUrl, smokeCase));
    }
  } finally {
    await closeServer(server);
  }

  const failed = results.filter((result) => !result.ok);
  console.log(JSON.stringify({ total: results.length, failed: failed.length, results }, null, 2));
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown Phase 6 smoke failure";
  console.error(message);
  process.exit(1);
});
