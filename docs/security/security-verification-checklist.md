# SIPRITI Backend Security & Logic Verification Checklist

Date: 2026-06-07
Target: `new_sipriti_backend`
Legacy source of truth: `sipriti_backend`

## Scope

This checklist records the security and logic pass after the Phase 6 parity work. The goal is cutover/UAT confidence without changing legacy endpoint URLs, response envelopes, permission names, or business workflow semantics.

Reviewed source areas:

- `DEVELOPER_GUIDE.md`, `MIGRATION_EXECUTION_PLAN.md`, `SIPRITI_BACKEND_MIGRATION_GAP.md`
- `sipriti_backend/md/RULES-PERUBAHAN-CODE.md`
- Auth, JWT, session cookie, CSRF, RBAC, request validation, upload/static storage, bulk import, audit log, proposal access policy, migration/static check scripts

## Fixed Items

| status | item | evidence |
| --- | --- | --- |
| done | Production environment now rejects the development `JWT_SECRET` placeholder. | `src/config/env.ts` production `superRefine` guard |
| done | Production environment now rejects `FRONTEND_URL` values that still point to localhost. | `src/config/env.ts` production `superRefine` guard |
| done | JWT expiry now follows `JWT_COOKIE_EXPIRES_IN`, preventing token/cookie lifetime mismatch. | `src/core/auth/jwt.service.ts` uses day-to-second conversion from env |
| done | Login/logout now persist non-blocking legacy-style audit metadata when an authenticated user is known. | `src/modules/auth/auth.controller.ts`, `src/core/audit/audit.service.ts`, `src/core/audit/audit-log.repository.ts` |
| done | Logout preserves the legacy authenticated guard behavior. | `phase6:smoke` confirms unauthenticated `POST /api/auth/logout` returns `401` with legacy auth envelope. |
| done | Proposal access policy preserves legacy owner/admin/prodi/related-user behavior and is unit-tested. | `src/modules/proposal/policies/proposal.policy.ts`, `src/modules/proposal/proposal.policy.test.ts` |
| done | `exceljs -> uuid` moderate advisory fixed without downgrading `exceljs`. | `package.json` override pins ExcelJS transitive `uuid` to `^11.1.1`; `npm audit` reports 0 vulnerabilities |

## Reviewed & Kept

| status | item | note |
| --- | --- | --- |
| verified | Upload file validation | Size, MIME, extension denylist, magic-byte checks, UUID filename generation, and path guards are present in storage/upload flows. |
| verified | Static upload serving | Static serving denies dotfiles, disables directory index, sets `nosniff`, referrer policy, cache policy, and attachment fallback for unknown types. |
| verified | Bulk import selected-member enforcement | Template generation writes `Master_Anggota` as a hidden/veryHidden source sheet; import rejects missing/tampered member metadata and enforces exactly one `Ketua`. |
| verified | Excel template worksheet password | `sipriti-import-template` is worksheet protection only, not an application secret; tamper rejection relies on hidden metadata validation, not password secrecy. |
| verified | CSRF for state-changing API routes | Smoke matrix confirms protected POST routes reject missing CSRF with `403`. |
| verified | RBAC route guards | Protected admin/proposal/workflow endpoints reject unauthenticated access with `401` in the smoke matrix. |
| verified | Public endpoint leakage guard | Smoke/parity contracts keep forbidden `password` fields out of response checks. |

## Verification Commands

| command | result |
| --- | --- |
| `npm.cmd install --ignore-scripts` | exit 0; changed 1 package; audited 559 packages; found 0 vulnerabilities |
| `npm.cmd audit --audit-level=moderate` | exit 0; found 0 vulnerabilities |
| `npm.cmd ls uuid` | `exceljs@4.4.0 -> uuid@11.1.1`; `sequelize@6.37.8 -> uuid@14.0.0` |
| `node -e "const {v4}=require('./node_modules/exceljs/node_modules/uuid'); ..."` | exit 0; CommonJS `require` compatibility verified |
| `node -e "const ExcelJS=require('exceljs'); ... writeBuffer/load ..."` | exit 0; ExcelJS workbook write/read sanity check passed |
| `npm.cmd run build` | exit 0 |
| `npm.cmd run api-docs` | exit 0; synced 203 Zod schemas |
| `npm.cmd test` | exit 0; 14 passing checks |
| `npm.cmd run phase6:migration-check` | exit 0; 16 migrations and 11 SQL patches passed static checks |
| `npm.cmd run phase6:smoke` | latest completed DB-free smoke evidence: 30/30 checks passed |
| `npm.cmd run phase6:http-parity` | latest completed DB-backed evidence: 20/20 checks passed; fresh 2026-06-07 rerun blocked because local `MySQL82` is stopped |

## Blocked / Must Rerun Before UAT Sign-Off

- [ ] Start local MySQL service `MySQL82` and confirm `sipriti_db` and `new_sipriti_db` are reachable on `localhost:3306`.
- [ ] Re-run `npm.cmd run db:migrate`, `npm.cmd run phase6:smoke`, and `npm.cmd run phase6:http-parity` after DB is reachable.
- [ ] Add a DB-backed auth audit smoke check that logs in, logs out, and confirms `audit_logs` receives `LOGIN` and `LOGOUT` rows with legacy metadata.
- [ ] Run FE UAT against the real frontend for login/session refresh, CSRF state-changing requests, proposal create/update/submit/detail/search/forward, uploads/static file reads, PDF generation, dashboard, audit log, and bulk import tamper cases.

## Optional Hardening Backlog

- [ ] Consider Origin/Referer validation for state-changing CSRF-protected requests once staging/production frontend origins are final.
- [ ] Consider moving upload storage to object storage after parity cutover; local storage is acceptable for migration parity but needs backup/restore operations.
- [ ] Add authenticated smoke fixtures for role-specific proposal coordinator/ketua/member denial cases, not only unauthenticated route guards.
