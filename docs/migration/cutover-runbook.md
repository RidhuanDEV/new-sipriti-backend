# SIPRITI Backend Cutover Runbook

Date: 2026-06-04

Status: conditional. Do not cut over production traffic until `docs/migration/parity-report.md` is updated with DB-backed old/new fixture parity for the critical matrix.

## Objective

Replace `sipriti_backend` with `new_sipriti_backend` while preserving legacy `/api` endpoint behavior, response fields, permissions, workflow logic, upload URLs, and frontend contracts.

## Go / No-Go Gate

Go only when all of these are true:

- `npm.cmd run build` exits 0.
- `npm.cmd run api-docs` exits 0.
- `npm.cmd test` exits 0.
- `npm.cmd run phase6:migration-check` exits 0.
- `npm.cmd run phase6:smoke` exits 0.
- Sequelize migrations have run successfully in staging.
- SQL patches have been run twice in staging without changing the second run result.
- Old and new response fixtures match for every critical flow in `parity-report.md`.
- Upload/static files are readable through legacy `/uploads/<subdir>/<filename>` URLs.
- Bulk import happy-path and tamper cases pass.
- Rollback procedure has been rehearsed or reviewed by the deploy owner.

## Pre-Cutover Checklist

1. Announce a maintenance window and freeze writes to proposal, laporan, HKI, monev, upload, and bulk import flows.
2. Confirm no background import or PDF generation process is running.
3. Back up the MySQL database with a transaction-safe dump.
4. Back up the upload directory used by `UPLOAD_ROOT_DIR`.
5. Record the currently deployed legacy backend commit/build artifact.
6. Record the target `new_sipriti_backend` commit/build artifact.
7. Verify production environment variables.

## Environment Checklist

| variable | required | notes |
| --- | --- | --- |
| `NODE_ENV` | yes | `production` for production cutover |
| `PORT` | yes | must match process manager/reverse proxy target |
| `DATABASE_URL` | yes | point to the intended MySQL schema |
| `JWT_SECRET` | yes | minimum 32 chars; preserve existing auth compatibility if tokens must survive |
| `FRONTEND_URL` | yes | comma-separated allowed origins if multiple frontends are active |
| `AUTH_COOKIE_NAME` | yes | keep `jwt` unless frontend has been updated |
| `JWT_COOKIE_EXPIRES_IN` | yes | keep legacy-compatible duration |
| `CSRF_ENABLED` | yes | keep `true` for cookie auth |
| `CSRF_SAMESITE` | yes | normally `lax`; use `none` only with HTTPS secure-cookie policy |
| `COOKIE_DOMAIN` | optional | required only for shared-domain cookie deployment |
| `UPLOAD_ROOT_DIR` | yes | must point to the migrated upload directory |

## Migration And Patch Order

Run Sequelize migrations in timestamp order:

```text
20260309144500-create-roles.ts
20260309144501-create-permissions.ts
20260309144502-create-role-permissions.ts
20260309144614-create-user.ts
20260309200001-create-audit-logs.ts
20260603000000-create-user-roles.ts
20260603020000-create-phase2-master-data.ts
20260603021000-seed-phase2-permissions.ts
20260603030000-create-phase3-public-content.ts
20260603031000-seed-phase3-permissions.ts
20260603040000-create-phase4-proposal-core.ts
20260603041000-seed-phase4-permissions.ts
20260603050000-create-phase5-advanced-workflows.ts
20260603051000-seed-phase5-permissions.ts
```

Production SQL patches, if applied manually, must be applied in this order:

```text
patch-03-jun-2026-create-user-roles.sql
patch-03-jun-2026-phase2-master-data.sql
patch-03-jun-2026-phase2-permissions.sql
patch-03-jun-2026-phase3-public-content.sql
patch-03-jun-2026-phase3-permissions.sql
patch-03-jun-2026-phase4-proposal-core.sql
patch-03-jun-2026-phase4-permissions.sql
patch-03-jun-2026-phase5-advanced-workflows.sql
patch-03-jun-2026-phase5-permissions.sql
```

Run `npm.cmd run phase6:migration-check` before applying patches. In staging, rerun the SQL patches once to prove idempotency before production use.

## Cutover Steps

1. Stop or drain legacy backend traffic.
2. Confirm frontend maintenance mode or write freeze is active.
3. Back up database and upload storage.
4. Deploy `new_sipriti_backend` build artifact.
5. Apply migrations or SQL patches according to the selected deployment strategy.
6. Run RBAC seed if this is a fresh environment.
7. Start the new backend process.
8. Run local process checks:

```powershell
npm.cmd run build
npm.cmd run api-docs
npm.cmd test
npm.cmd run phase6:migration-check
npm.cmd run phase6:smoke
```

9. Run DB-backed smoke with seeded credentials:
   - login/logout/me;
   - RBAC permission and role assignment;
   - master data options;
   - public content list/detail;
   - upload and static file read;
   - penelitian and pengabdian create/update/submit/detail/search/forward;
   - nested proposal sections;
   - proposal review approve/reject/resubmit;
   - laporan upload/validation;
   - final PDF generation;
   - official signature CRUD and prodi scope;
   - HKI submit/review;
   - monev list/upload;
   - dashboard/admin dashboard;
   - audit log list/detail;
   - bulk import template, happy import, and tamper rejection.
10. Flip reverse proxy or service routing to the new backend.
11. Monitor logs, auth failures, validation failures, upload failures, DB errors, and slow requests.
12. End maintenance window only after smoke and monitoring are clean.

## Post-Cutover Monitoring

Watch these signals for at least one business day:

- HTTP 5xx rate by route group;
- auth 401/403 spike after login;
- CSRF 403 spike on mutating requests;
- Sequelize connection and query errors;
- upload validation failures;
- proposal submit/approve/forward failures;
- laporan/PDF generation failures;
- bulk import template/import rejection reasons;
- audit log write warnings;
- frontend error reports for missing response fields.

## Rollback Triggers

Rollback immediately if any of these occur:

- login or auth cookie flow fails for valid users;
- proposal create/update/submit or approval fails on valid fixture data;
- upload/static file URLs break;
- bulk import accepts tampered templates or rejects valid templates;
- DB migration corrupts existing data or blocks core reads;
- frontend shows missing fields due response drift;
- sustained 5xx rate on critical routes after cutover.

Use `rollback-runbook.md` for the rollback path.
