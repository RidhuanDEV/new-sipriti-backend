# Phase 6 Parity Gap Log

Date: 2026-06-04

This file records anomalies found while running DB-backed Phase 6 verification against local MySQL. Each gap must be fixed or explicitly deferred before production cutover.

## GAP-001 - RBAC Seeder Is Not Idempotent After Permission Migrations

Status: fixed

Evidence:

- `npm.cmd run db:migrate` completed all 14 migrations against `new_sipriti_db`.
- `npm.cmd run db:seed` failed at `20260524000000-seed-roles-permissions` with `ERROR: Validation error`.
- Database inspection showed `roles` had 2 rows, `permissions` had 60 rows, and `role_permissions` had 0 rows after the failed seed.
- Root cause: Phase 2-5 permission migrations insert permission rows before the RBAC seeder runs. The seeder then performs non-idempotent `bulkInsert` for the same permissions, partially inserts base rows, and fails before role-permission mappings are created.

Legacy/new rule impact:

- `RULES-PERUBAHAN-CODE.md` requires permission/role seeding to be safe for fresh install and re-seed.
- Cutover cannot rely on a seeder that fails after migrations.

Fix plan:

- Make the RBAC seeder idempotent with `INSERT IGNORE` for roles, permissions, and role-permission mappings.
- Preserve exact role IDs, permission IDs, names, and role-permission mapping intent.
- Rerun `npm.cmd run db:seed`, migration static checks, build, docs, tests, and smoke.

Verification:

- `npm.cmd run build` passed after the seeder update.
- A rerun of `npm.cmd run db:seed` progressed through `20260524000000-seed-roles-permissions`, created 63 permissions and 76 role-permission mappings, then exposed GAP-002.

## GAP-002 - Stale `dist/database/seeders/rbac-source.js` Is Executed As A Seeder

Status: fixed

Evidence:

- After GAP-001 fix, `npm.cmd run db:seed` completed `20260524000000-seed-roles-permissions`.
- Sequelize CLI then attempted `== rbac-source: migrating =======` and failed with `ERROR: Could not find migration method: up`.
- `src/database/seeders` no longer contains `rbac-source.ts`, but stale generated files existed under `dist/database/seeders`.

Root cause:

- The TypeScript build does not clean old generated seeder files from `dist/database/seeders`.
- Sequelize CLI executes every JavaScript file in the configured seeders path.

Fix plan:

- Remove stale generated `dist/database/seeders/rbac-source.js` and its source map.
- Rerun `npm.cmd run db:seed`.

Verification:

- Stale generated `rbac-source` seeder artifact was removed from `dist/database/seeders`.
- `npm.cmd run db:seed` completed without error and reported `No seeders found` after the already-recorded RBAC seeder state.
- Direct idempotency rerun of compiled `20260524000000-seed-roles-permissions.js` completed with stable counts: 2 roles, 63 permissions, 76 role-permission mappings.

## GAP-003 - New Parity Database Has Schema But No Legacy Data Fixture

Status: fixed

Evidence:

- `sipriti_db` contains legacy fixture data: 9 users, 9 roles, 143 permissions, 313 role-permission mappings, 8 prodi, 11 skema, public content rows, 24 proposals, 66 proposal members, 16 laporan rows, and 632 audit logs.
- `new_sipriti_db` after migrations and seed contains 0 users, 2 roles, 63 permissions, 76 role-permission mappings, and no master/content/proposal/audit rows.

Impact:

- DB-backed old/new response fixture comparison cannot pass on happy-path endpoints while the databases contain different data.
- Public list/detail endpoints, login, authenticated proposal flows, dashboard, auditlog, review, laporan, PDF, and bulk import tests will compare real legacy rows against empty new rows.

Fix plan:

- Build or run a data fixture migration from `sipriti_db` into `new_sipriti_db` before happy-path parity tests.
- Preserve legacy IDs and natural keys where the new schema still uses the same contract.
- Use the new schema as the target of truth and copy only table/column pairs that exist and are compatible.
- Re-run old/new parity matrix after the new DB contains equivalent fixture data.

Verification:

- Added `npm.cmd run phase6:copy-legacy-fixture` to copy compatible legacy data from `sipriti_db` into `new_sipriti_db`.
- The fixture copy completed successfully and copied master/content/proposal/workflow rows, including users, roles, permissions, user roles, prodis, skemas, public content, proposals, laporan rows, and audit logs.
- New parity database summary after copy: 9 users, 10 roles, 145 permissions, 328 role-permission mappings, 8 prodis, 11 skemas, 4 berita, 3 pengumuman, 3 panduan, 24 HKI proposals, 66 proposal members, 16 laporan rows, and 632 audit logs.

## GAP-004 - Auth Login Request And Response Drift From Legacy Contract

Status: fixed

Evidence:

- Legacy `POST /api/auth/login` validates `{ username, password }`, lowercases username, and returns `data.user` while setting the `jwt` cookie and CSRF cookie.
- New backend accepted `{ email, password }` and returned `data.token` in the JSON body.
- Legacy failed credentials return HTTP 400 with message `Email atau password salah`; new backend returned HTTP 401 with message `Invalid email or password`.
- Legacy soft-deleted users are found with `paranoid: false` and rejected with the message `Akun Anda telah dinonaktifkan. Hubungi admin untuk mengaktifkan kembali.`

Impact:

- Existing frontend login requests using `username` fail validation on the new backend.
- Existing frontend auth state expects `data.user`; returning `data.token` is response-shape drift and leaks an implementation detail that legacy kept in the cookie only.

Fix plan:

- Update new login schema to accept legacy `username/password`, trim and lowercase username, and keep `email/password` only as a non-legacy additive path.
- Load login users by username with `paranoid: false`, including role/prodi relations needed by the legacy response mapper.
- Return the token only to the controller for cookie setting; send `data.user` in the JSON body.
- Match legacy bad credential and soft-deleted-account HTTP status/message.
- Add an auth contract test and run build, api-docs, test, smoke, and HTTP parity checks.

Verification:

- Added `src/modules/auth/auth.contract.test.ts`; the test first failed because `{ username, password }` was rejected by the new schema.
- Updated login schema, repository, service, controller, and OpenAPI route annotation.
- `npm.cmd test`, `npm.cmd run build`, and `npm.cmd run api-docs` passed after the auth contract patch.
- First DB-backed HTTP parity run still exposed GAP-005 before login could be verified end-to-end.
- Final DB-backed HTTP parity passed auth login, `/api/auth/me`, `/api/users/me`, `/api/users/search`, `/api/users/admin/list`, and logout with 20 total checks and 0 failures.

## GAP-005 - Global Sequelize `paranoid` Default Queries Missing `deleted_at` Columns

Status: fixed

Evidence:

- First DB-backed HTTP parity run started both old and new servers and produced `phase6-http-parity-results.json` with 19/20 failures.
- New backend returned HTTP 500 for login and public/master endpoints.
- `phase6-new-server.log` showed `Unknown column 'prodiRelation.deleted_at' in 'on clause'` during `POST /api/auth/login`.
- The same log showed `Unknown column 'Berita.deleted_at'`, `Pengumuman.deleted_at`, `Panduan.deleted_at`, `Skema.deleted_at`, and `BidangFokus.deleted_at` in public/master reads.

Root cause:

- `src/config/database.ts` configured Sequelize global `define.paranoid: true`.
- Legacy-compatible migrations do not add `deleted_at` to most public/master tables. Only models that truly support soft delete should opt into paranoid behavior.

Fix plan:

- Change the global Sequelize default to `paranoid: false`.
- Keep `User` explicitly `paranoid: true` because the legacy auth contract depends on soft-deleted user detection.
- Rerun build, api-docs, test, and DB-backed HTTP parity.

Verification:

- `npm.cmd run build` passed after changing the global paranoid default.
- Second DB-backed HTTP parity run reduced failures from 19/20 to 10/20.
- Login, master data options, proposal options, search anggota, admin dashboard stats, notification unread count, and logout passed old/new parity.
- Final `npm.cmd run phase6:http-parity` passed with 20 total checks and 0 failures.

## GAP-006 - Legacy CamelCase Timestamp Tables Queried As Snake Case

Status: fixed

Evidence:

- After GAP-005, public content endpoints still returned HTTP 500 in the new backend.
- `phase6-new-server.log` showed `Unknown column 'created_at' in 'field list'` for `berita`, `pengumuman`, `panduan`, and `hkis`.
- DB inspection showed those legacy tables use `createdAt` and `updatedAt`, not `created_at` and `updated_at`.
- Dashboard counts also failed because HKI-related reads queried `hkis.created_at`.

Root cause:

- Sequelize global `define.underscored: true` mapped timestamps to snake case for models whose legacy tables are camelCase.

Fix plan:

- Add model-level `underscored: false` to `Berita`, `Pengumuman`, `Panduan`, `HKI`, `HakiProposal`, and `MemberProposal`.
- Keep snake-case models unchanged.
- Rerun build and DB-backed HTTP parity.

Verification:

- After the timestamp mapping fix, DB-backed HTTP parity reduced remaining failures to auth/admin-list and audit-log response drift only.
- Final `npm.cmd run phase6:http-parity` passed public content and dashboard checks with 20 total checks and 0 failures.

## GAP-007 - `/api/users/admin/list` Exposed Extra `updatedAt`

Status: fixed

Evidence:

- After auth aliases and public/dashboard fixes, DB-backed parity had 2/20 failures.
- `GET /api/users/admin/list?page=1&limit=2` returned HTTP 200 in both backends, but the body signature differed.
- The new backend included `data[].updatedAt`; the legacy admin-list serializer omits `updatedAt` while still returning `createdAt`, `deletedAt`, `is_active`, role fields, prodi fields, and `prodi_jenjang`.

Impact:

- Frontend code that compares or renders the legacy admin-list shape sees response drift.
- The drift is only on the admin list response; login/current-user responses should keep `updatedAt` because legacy includes it there.

Fix plan:

- Split `AuthAdminUserResponseDto` from the full current-user DTO instead of extending it.
- Map admin-list users explicitly and omit `updatedAt` only for admin-list rows.

Verification:

- Final `npm.cmd run phase6:http-parity` passed `user-admin-list` with matching body signatures.

## GAP-008 - `/api/audit-logs` Response Used New Starter Fields Instead Of Legacy Audit Contract

Status: fixed

Evidence:

- After GAP-007, `GET /api/audit-logs?page=1&limit=2` returned HTTP 200 in both backends, but the body signature differed.
- Legacy exposes `description`, `endpoint`, `http_method`, `ip_address`, `user_agent`, `user_name`, `entity_type`, `entity_id`, `old_value`, `new_value`, `user`, and `createdAt`.
- New backend exposed starter fields `request_id` and `updatedAt`, and did not expose the legacy request-context fields.

Impact:

- Audit-log screens lose legacy context columns and receive extra internal fields.
- The endpoint violates no response-shape drift for a Phase 6 cutover-critical module.

Fix plan:

- Add a legacy audit contract migration and SQL patch for `entity_type`, `description`, `old_value`, `new_value`, `user_name`, `ip_address`, `user_agent`, `http_method`, and `endpoint`.
- Extend the audit model/repository while keeping starter audit persistence compatible.
- Serialize `/api/audit-logs` to the exact legacy public fields and omit `request_id`/`updatedAt`.
- Refresh legacy fixture data from `sipriti_db` into the new columns.

Verification:

- `npm.cmd run db:migrate` applied `20260604060000-add-legacy-audit-log-contract`.
- `npm.cmd run phase6:copy-legacy-fixture` updated 642 audit rows with legacy audit columns.
- Final `npm.cmd run phase6:http-parity` passed `audit-logs` with matching body signatures.

## GAP-009 - Legacy Audit Fixture Broke First Audit Contract Migration Attempt

Status: fixed

Evidence:

- First run of `npm.cmd run db:migrate` for the audit contract migration failed with `Incorrect datetime value: '0000-00-00 00:00:00' for column 'updated_at' at row 1`.
- The failed run had already added the new legacy audit columns, so the migration had to be safe for partial rerun.
- The next rerun exposed a SQL syntax error near `before` because `before`/`after` are reserved identifiers in the backfill query.

Root cause:

- The initial migration attempted unnecessary `changeColumn` operations on existing starter audit columns, causing MySQL to rebuild rows that contained legacy zero datetimes in `updated_at`.
- The JSON backfill query referenced starter columns `before` and `after` without identifier quoting.

Fix plan:

- Keep the migration additive for the response contract and avoid rebuilding old audit columns that are not needed for parity.
- Quote `before` and `after` in backfill SQL.
- Make the migration safe when columns were already added by a failed prior run.

Verification:

- Rerun `npm.cmd run db:migrate` applied the migration successfully.
- A later rerun of `npm.cmd run db:migrate` reported `No migrations were executed, database schema was already up to date`.
- `npm.cmd run phase6:migration-check` passed with 15 migrations and 10 SQL patches.

## GAP-010 - Auth Register Drifted From Current Legacy Runtime Contract

Status: fixed

Evidence:

- Legacy `POST /api/auth/register` request validation accepts `role_id` but the legacy service reads `role_ids`, so the currently running legacy backend fails registration with Sequelize validation errors instead of creating a user.
- When required profile fields are absent, the legacy response message is an array such as `nidn: User.nidn cannot be null`, `institusi: User.institusi cannot be null`, and `role_id: User.role_id cannot be null`.
- When required profile fields are present, the legacy response message is the string `role_id: User.role_id cannot be null`.
- The new backend initially validated `role_id` values as UUIDs and could drift from the current legacy runtime behavior.

Impact:

- A frontend retrying the exact legacy register payload could see a different validation layer, different message type, or a successful create that the legacy backend does not perform in the current codebase.
- This is a legacy bug, but strict parity requires the new backend not to silently change public behavior during cutover.

Fix:

- Updated the new register schema to accept legacy string `role_id` entries without UUID-only validation.
- Preserved legacy duplicate username/email/NIDN/prodi checks before returning the same runtime validation message.
- Extended the shared HTTP error contract so API failure messages can be either `string` or `string[]`, matching legacy behavior.
- Added an auth contract test for the legacy register schema.

Verification:

- Manual old/new register parity passed for the current legacy runtime contract.
- `npm.cmd test` passed with 14 tests.
- `npm.cmd run build`, `npm.cmd run api-docs`, `npm.cmd run phase6:smoke`, and `npm.cmd run phase6:http-parity` passed after the fix.

## GAP-011 - RBAC Compatibility Params Rejected Legacy Seeded IDs

Status: fixed

Evidence:

- Legacy seeded role IDs include deterministic values such as `a1a1...`, which are string IDs but not valid RFC UUID version values accepted by Zod `uuid()`.
- New `/api/rbac/roles/:id/permissions` and `/api/rbac/roles/:id/users` returned HTTP 400 for legacy fixture IDs before reaching service logic.

Impact:

- Admin RBAC pages using legacy role IDs could fail validation on the new backend even though the IDs exist in the database.

Fix:

- Updated RBAC compatibility param schemas to accept non-empty string IDs, matching the legacy DB contract.
- Kept service/repository ownership and existence checks as the source of truth after validation.

Verification:

- Manual authenticated parity passed for `/api/rbac/permissions`, `/api/rbac/roles`, `/api/rbac/roles/:id/permissions`, `/api/rbac/roles/:id/users`, `/api/rbac/users`, and user-role endpoints.
- `npm.cmd run phase6:smoke` passed 30/30 checks.

## GAP-012 - RBAC Permission Metadata Drifted Into An `other` Group

Status: fixed

Evidence:

- `/api/rbac/permissions` initially grouped some rows under `other` in the new backend.
- The fixture copy inserted missing permissions but did not refresh metadata columns for existing permission rows.
- New-only permissions `edit_hki` and `delete_hki` had null `module` and `description`.

Impact:

- The RBAC permission response shape and grouping could drift from legacy, causing admin permission screens to render different groups.

Fix:

- Updated `phase6:copy-legacy-fixture` to refresh metadata columns for existing `roles` and `permissions` rows when source/target columns are compatible.
- Added the legacy auth/RBAC compatibility migration and SQL patch updates for HKI permission metadata.
- Backfilled local `new_sipriti_db` so all permissions have a module value.

Verification:

- Manual old/new RBAC permission parity passed.
- `npm.cmd run phase6:migration-check` passed with 16 migrations and 11 SQL patches.
- `npm.cmd run api-docs` passed and synced 203 Zod schemas.

## GAP-013 - Legacy Admin Usulan List Fails Locally With Missing Import

Status: documented legacy defect, not copied

Evidence:

- Legacy `GET /api/admin/usulan` returns HTTP 500 in the local parity run.
- The legacy stack trace points to `sipriti_backend/src/modules/usulan/usulan.service.js:119` with `ReferenceError: TahunAkademik is not defined`.
- The new backend returns HTTP 200 for the same compatibility endpoint.

Impact:

- Strict bug-for-bug parity would require breaking the new endpoint to match a legacy runtime defect.
- Copying this defect would reduce cutover safety and does not preserve intended business logic.

Decision:

- Do not copy the legacy missing-import failure.
- Keep the new endpoint working and record the difference as an intentional defect avoidance.
- If production parity policy requires bug-for-bug behavior, this item needs explicit product approval before changing the new backend.

Verification:

- Manual previous-gap parity completed with 22 total checks and 0 failed after treating this legacy-only 500 as a documented defect.
- `npm.cmd run phase6:http-parity` passed the critical frontend matrix with 20/20 checks.
