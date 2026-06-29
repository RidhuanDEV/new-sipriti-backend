# SIPRITI Backend Migration Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the legacy SIPRITI backend into `new_sipriti_backend` without changing existing business logic, endpoint URLs, permission behavior, response expectations, or frontend-facing contracts, while adopting the strict TypeScript modular rules of the new codebase.

**Architecture:** Use a modular monolith. Preserve the legacy `/api` contract during migration, implement compatibility adapters only at HTTP boundaries, and keep domain rules inside typed services/policies. Migrate capability-by-capability with explicit source-of-truth inventory before code changes.

**Tech Stack:** Node.js 22+, Express 5, TypeScript strict, ES modules with `.js` local imports, Sequelize, MySQL, Zod v4, Swagger auto-sync, JWT, RBAC, Pino, local upload storage.

---

## Non-Negotiable Migration Rules

These rules apply to every phase:

- Do not change existing endpoint URLs, HTTP methods, request fields, response fields, or permission behavior unless a phase explicitly creates a compatibility adapter and documents the frontend impact.
- Treat `sipriti_backend` as the legacy source of truth for logic and endpoint behavior.
- Treat `new_sipriti_backend/DEVELOPER_GUIDE.md` as the structure and TypeScript source of truth.
- Treat `sipriti_backend/md/RULES-PERUBAHAN-CODE.md` as the migration compliance source of truth for database, permission, endpoint, audit, and typing rules.
- Do not introduce `any`. Existing `any` in the new starter must be removed before using the affected file as a pattern.
- Do not use forced casts to hide type mismatch. Define the real contract from model attributes, Zod schemas, DTOs, and mappers.
- Every schema or permission change must have migration, seeder when applicable, and SQL patch.
- Every endpoint input/output change must update frontend services, hooks, pages, components, and types, or must be explicitly marked as backend-compatible with no frontend change required.
- Audit default follows the old rules file: non-blocking, outside the main transaction, `throwOnError: false`, and warning log on failure. Domain-critical exceptions must be written explicitly.
- Every phase must end with build and documentation checks.

## Source Documents

Read these before every phase:

- `new_sipriti_backend/DEVELOPER_GUIDE.md`
- `new_sipriti_backend/SIPRITI_BACKEND_MIGRATION_GAP.md`
- `sipriti_backend/md/RULES-PERUBAHAN-CODE.md`
- `sipriti_backend/md/API_ENDPOINT_INVENTORY_COMPLETE.md`
- `sipriti_backend/src/routes/index.js`
- `sipriti_backend/src/models/index.js`
- `new_sipriti_backend/src/routes/index.ts`
- `new_sipriti_backend/src/database/models/index.ts`
- `new_sipriti_backend/package.json`
- `sipriti_backend/package.json`

## Global File Structure Target

The new backend should keep this structure:

```text
new_sipriti_backend/
  MIGRATION_EXECUTION_PLAN.md
  SIPRITI_BACKEND_MIGRATION_GAP.md
  docs/
    adr/
    migration/
      endpoint-inventory.md
      table-inventory.md
      frontend-contract-inventory.md
      phase-status.md
  sql/
    patch-DD-mmm-YYYY-description.sql
  src/
    app.ts
    routes/index.ts
    types/
      api/
      auth.ts
      models/
    core/
      auth/
      csrf/
      storage/
      audit/
      middleware/
      http/
      logger/
    database/
      migrations/
      models/
      seeders/
        rbac-source.ts
    modules/
      <feature>/
        dto/
        mappers/
        policies/
        queries/
        <feature>.model.ts
        <feature>.repository.ts
        <feature>.service.ts
        <feature>.controller.ts
        <feature>.routes.ts
        <feature>.schema.ts
```

## Required Verification Commands

Run these after each phase unless the phase explicitly changes scripts first:

```powershell
npm.cmd run build
npm.cmd run api-docs
```

If a phase adds tests:

```powershell
npm.cmd test
```

If endpoint behavior is changed or added:

```powershell
npm.cmd run build
npm.cmd run api-docs
```

Then run manual HTTP smoke checks against the exact endpoints listed in that phase.

## Phase Gates

Each phase has a gate. Do not start the next phase until the current gate is satisfied.

| Phase | Gate |
| --- | --- |
| Phase 0 | Contract inventory, ADRs, migration conventions, and no-new-`any` guardrails are documented. |
| Phase 1 | Foundation compatibility works: response envelope, auth mode, RBAC model direction, audit policy, storage shell, and error handling. |
| Phase 2 | Master data endpoints behave like legacy endpoints and can support auth/proposal scope. |
| Phase 3 | Public content and upload-backed content modules are migrated without breaking public reads. |
| Phase 4 | Proposal create/update/detail/submit/search/forward core behavior matches legacy behavior. |
| Phase 5 | Review, reports, PDF, HKI, official signatures, monev, notifications, and bulk import are migrated. |
| Phase 6 | Cutover evidence shows old and new backend parity for critical flows. |

---

# Phase 0 - Contract Inventory and Guardrail Setup

## Goal

Create the migration control plane. This phase must not migrate domain logic yet. It documents existing contracts, decisions, and enforcement points so the following phases do not drift.

## Files

- Create: `new_sipriti_backend/docs/adr/ADR-001-preserve-legacy-api-contract.md`
- Create: `new_sipriti_backend/docs/adr/ADR-002-auth-cookie-bearer-csrf.md`
- Create: `new_sipriti_backend/docs/adr/ADR-003-rbac-multi-role-prodi-scope.md`
- Create: `new_sipriti_backend/docs/adr/ADR-004-response-envelope.md`
- Create: `new_sipriti_backend/docs/adr/ADR-005-audit-policy.md`
- Create: `new_sipriti_backend/docs/adr/ADR-006-upload-storage-policy.md`
- Create: `new_sipriti_backend/docs/adr/ADR-007-migration-sql-patch-workflow.md`
- Create: `new_sipriti_backend/docs/migration/endpoint-inventory.md`
- Create: `new_sipriti_backend/docs/migration/table-inventory.md`
- Create: `new_sipriti_backend/docs/migration/frontend-contract-inventory.md`
- Create: `new_sipriti_backend/docs/migration/phase-status.md`
- Create: `new_sipriti_backend/sql/.gitkeep`
- Modify: `new_sipriti_backend/package.json`
- Inspect: `sipriti_backend/md/API_ENDPOINT_INVENTORY_COMPLETE.md`
- Inspect: `sipriti_backend/src/routes/index.js`
- Inspect: `sipriti_backend/src/models/*.js`
- Inspect: `sipriti_backend/migrations/*.js`
- Inspect: `sipriti_backend/src/lib/seedRBAC.js`
- Inspect: `new_sipriti_backend/src/**/*.ts`

## Tasks

- [ ] **Step 1: Write ADR-001**

  Decision: preserve legacy `/api` endpoint URLs and response behavior during migration. New cleaner contracts may be added in a separate approved cleanup phase under `/api/v2`, but Phase 1 to Phase 6 must keep frontend-facing parity.

- [ ] **Step 2: Write ADR-002**

  Decision: support cookie `jwt` first, bearer fallback, CORS credentials, and CSRF compatibility while the existing frontend still uses cookie-auth flows.

- [ ] **Step 3: Write ADR-003**

  Decision: support multi-role RBAC with `UserRole`, permission union, legacy `role_id` fallback during migration, role hierarchy, and `kode_prodi` scoping.

- [ ] **Step 4: Write ADR-004**

  Decision: expose legacy-compatible response envelope for migrated `/api` endpoints:

  ```json
  {
    "success": true,
    "message": "Pesan Bahasa Indonesia",
    "data": {},
    "meta": {}
  }
  ```

  Error shape:

  ```json
  {
    "success": false,
    "message": "Pesan Bahasa Indonesia",
    "error": "ERROR_CODE"
  }
  ```

- [ ] **Step 5: Write ADR-005**

  Decision: default audit is non-blocking and outside business transactions following `RULES-PERUBAHAN-CODE.md`. Domain-critical exceptions must be declared per service.

- [ ] **Step 6: Write ADR-006**

  Decision: preserve local upload URL behavior `/uploads/<subdir>/<filename>` with path guard, magic byte validation, MIME validation, UUID filename, static no-index serving, and `nosniff` headers.

- [ ] **Step 7: Write ADR-007**

  Decision: every schema or permission change in the TypeScript backend still requires both Sequelize migration and idempotent SQL patch.

- [ ] **Step 8: Create endpoint inventory**

  Build `docs/migration/endpoint-inventory.md` from actual route mounts. Minimum columns:

  ```text
  legacy_module | legacy_mount | method | endpoint | auth | permission | request_source | response_source | new_module | status
  ```

  Initial status values:

  ```text
  not_started
  inventory_verified
  migrated
  parity_verified
  deferred
  ```

- [ ] **Step 9: Create table inventory**

  Build `docs/migration/table-inventory.md` from legacy models and migrations. Minimum columns:

  ```text
  legacy_model | table_name | primary_key | key_columns | owner_context | new_module | migration_strategy | status
  ```

- [ ] **Step 10: Create frontend contract inventory**

  Build `docs/migration/frontend-contract-inventory.md` with known frontend impact locations from old rules:

  ```text
  backend_endpoint | frontend_service | frontend_hook | frontend_page_or_component | frontend_type | change_required | status
  ```

- [ ] **Step 11: Create phase status tracker**

  Add a tracker with each phase, owner, start date, gate, verification command, and status.

- [ ] **Step 12: Add `sql/` directory**

  Add `new_sipriti_backend/sql/.gitkeep` so production SQL patch workflow exists in the new backend.

- [ ] **Step 13: Audit current TypeScript `any` usage**

  Run:

  ```powershell
  rg "\bany\b|as unknown|catch \(err: any\)" src
  ```

  Expected: current violations are listed and copied into `docs/migration/phase-status.md` as Phase 1 cleanup items.

- [ ] **Step 14: Add or confirm test command**

  If `package.json` has no test script, add:

  ```json
  {
    "scripts": {
      "test": "tsx --test \"src/**/*.test.ts\""
    }
  }
  ```

  Do not add a new dependency if `tsx` already exists.

- [ ] **Step 15: Verify Phase 0**

  Run:

  ```powershell
  npm.cmd run build
  npm.cmd run api-docs
  npm.cmd test
  ```

  Expected:

  - Build exits 0.
  - API docs generation exits 0.
  - Test command exits 0, even if no tests are found.

## Phase 0 Execution Prompt

```text
You are executing Phase 0 of the SIPRITI backend migration in D:\Ridhuan Ngoding Moment\React\PRPM.

Base context:
- Read new_sipriti_backend/DEVELOPER_GUIDE.md.
- Read new_sipriti_backend/SIPRITI_BACKEND_MIGRATION_GAP.md.
- Read sipriti_backend/md/RULES-PERUBAHAN-CODE.md.
- Read sipriti_backend/md/API_ENDPOINT_INVENTORY_COMPLETE.md.
- Use sipriti_backend as the logic and endpoint source of truth.
- Use new_sipriti_backend as the TypeScript structure source of truth.
- Do not migrate domain modules yet.
- Preserve existing endpoints and logic; document decisions before code.
- No any, no fake compatibility assumptions, no endpoint drift.

Task:
Create the ADRs and migration inventory documents listed in Phase 0 of new_sipriti_backend/MIGRATION_EXECUTION_PLAN.md. Add sql/.gitkeep. Add a test script only if package.json does not already have one. Run build, api-docs, and test. Report exact verification output and any blockers.
```

---

# Phase 1 - Foundation Compatibility

## Goal

Make the new backend capable of hosting legacy-compatible modules without breaking frontend expectations.

## Files

- Modify: `new_sipriti_backend/src/utils/response.ts`
- Modify: `new_sipriti_backend/src/core/middleware/error.middleware.ts`
- Modify: `new_sipriti_backend/src/core/auth/auth.middleware.ts`
- Create: `new_sipriti_backend/src/core/auth/session.middleware.ts`
- Create: `new_sipriti_backend/src/core/csrf/csrf.middleware.ts`
- Modify: `new_sipriti_backend/src/app.ts`
- Modify: `new_sipriti_backend/src/config/env.ts`
- Modify: `new_sipriti_backend/src/types/express.d.ts`
- Create: `new_sipriti_backend/src/types/auth.ts`
- Create: `new_sipriti_backend/src/types/api/common.ts`
- Modify: `new_sipriti_backend/src/core/audit/audit.service.ts`
- Modify: `new_sipriti_backend/src/constants/audit.constants.ts`
- Create: `new_sipriti_backend/src/core/storage/storage-paths.ts`
- Create: `new_sipriti_backend/src/core/storage/file-validation.ts`
- Create: `new_sipriti_backend/src/core/storage/upload-filename.ts`
- Create: `new_sipriti_backend/src/core/storage/static-uploads.middleware.ts`
- Modify: `new_sipriti_backend/package.json`
- Modify: `new_sipriti_backend/src/database/models/associations.ts`
- Modify: `new_sipriti_backend/src/database/models/index.ts`
- Create: `new_sipriti_backend/src/modules/roles/user-role.model.ts`
- Create: `new_sipriti_backend/src/database/migrations/YYYYMMDDHHMMSS-create-user-roles.ts`
- Create: `new_sipriti_backend/sql/patch-DD-mmm-YYYY-create-user-roles.sql`

## Tasks

- [ ] **Step 1: Add API response contracts**

  Define:

  ```ts
  export interface ApiSuccess<TData, TMeta = undefined> {
    success: true;
    message: string;
    data?: TData;
    meta?: TMeta;
  }

  export interface ApiFailure<TCode extends string = string> {
    success: false;
    message: string;
    error: TCode;
  }
  ```

  Place this in `src/types/api/common.ts`.

- [ ] **Step 2: Update response helper**

  `sendSuccess` must support legacy-compatible `message`, optional `data`, optional `meta`, and status code. `sendCreated` must include message. `sendNoContent` remains 204.

- [ ] **Step 3: Update error middleware**

  Ensure known errors return:

  ```json
  {
    "success": false,
    "message": "Pesan aman",
    "error": "ERROR_CODE"
  }
  ```

  Include request ID in logs, not necessarily in legacy response unless ADR-004 decides to expose it.

- [ ] **Step 4: Add auth context types**

  `AuthenticatedUserContext` must include:

  ```ts
  id: string;
  name: string;
  username: string;
  email: string | null;
  nidn: string | null;
  roleId: string | null;
  roles: ReadonlyArray<{ id: string; name: string }>;
  permissions: ReadonlyArray<string>;
  prodi: { id: string; kodeProdi: string; namaProdi: string } | null;
  ```

- [ ] **Step 5: Add session middleware**

  Implement cookie `jwt` first, bearer fallback. It must load user DB record and RBAC context, not only trust JWT payload.

- [ ] **Step 6: Add CSRF compatibility**

  If cookie auth remains enabled, add CSRF token issue/verify middleware compatible with legacy header `X-CSRF-Token`.

- [ ] **Step 7: Configure CORS and cookie parser**

  Add environment variables:

  ```env
  FRONTEND_URL=http://localhost:5173
  AUTH_COOKIE_NAME=jwt
  JWT_COOKIE_EXPIRES_IN=7
  CSRF_ENABLED=true
  ```

  CORS must use explicit origins and `credentials: true`.

- [ ] **Step 8: Add `UserRole` model**

  Add typed model matching legacy `user_roles` intent. Include unique pair constraint for `(user_id, role_id)`.

- [ ] **Step 9: Add migration and SQL patch for `user_roles`**

  Migration must have `up()` and `down()`. SQL patch must be idempotent.

- [ ] **Step 10: Update RBAC direction**

  Keep existing roles/permissions modules but prepare them for multi-role. Existing single-role behavior must not break.

- [ ] **Step 11: Align audit policy**

  Update audit service docs and behavior so default calls can be non-blocking with `throwOnError: false`. Do not leave comments that claim all audit writes must be in the same transaction.

- [ ] **Step 12: Add storage shell**

  Implement shared helpers for:

  - upload root resolution;
  - safe public URL conversion;
  - UUIDv7 filename generation;
  - MIME allowlist;
  - magic byte validation extension point;
  - static upload headers.

- [ ] **Step 13: Remove foundation `any`**

  Clean `any` in files touched by this phase. For Express `Request` response body generic, use `unknown` only with explicit narrowing or define a local response body type.

- [ ] **Step 14: Verify Phase 1**

  Run:

  ```powershell
  npm.cmd run build
  npm.cmd run api-docs
  npm.cmd test
  ```

  Smoke check:

  - `GET /health`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`

## Phase 1 Execution Prompt

```text
You are executing Phase 1 of the SIPRITI backend migration in D:\Ridhuan Ngoding Moment\React\PRPM.

Base context:
- Phase 0 documents must exist and be read first.
- Preserve /api legacy behavior.
- Backend lama auth uses cookie jwt first, bearer fallback, CSRF token, credentials CORS, and req.user loaded from DB with role and prodi.
- Backend baru must keep strict TypeScript, ESM .js local imports, Zod v4, Sequelize, and new module structure.
- Follow sipriti_backend/md/RULES-PERUBAHAN-CODE.md.
- No any. Define true contracts.

Task:
Implement Phase 1 foundation compatibility only. Do not migrate master data, content, or proposal modules. Add response compatibility, auth/session compatibility, CSRF compatibility if cookie auth remains enabled, multi-role RBAC foundation, audit policy alignment, and storage shell. Add required migration and SQL patch for user_roles. Run build, api-docs, test, and smoke checks for auth/health. Report exact endpoint behavior and any frontend-impacting differences.
```

---

# Phase 2 - Master Data Migration

## Goal

Migrate master data modules needed by auth, RBAC scope, dropdowns, and proposal forms before migrating proposal logic.

## Migration Order

1. `prodi`
2. `skema`
3. `bidangfokus`
4. `tahunakademik`
5. `output`
6. `sertifikatmutu`
7. options/dropdown routes

## Files

For each module, create the standard Developer Guide structure:

```text
src/modules/<feature>/
  dto/
  mappers/
  policies/
  queries/
  <feature>.model.ts
  <feature>.repository.ts
  <feature>.service.ts
  <feature>.controller.ts
  <feature>.routes.ts
  <feature>.schema.ts
```

Also modify:

- `new_sipriti_backend/src/routes/index.ts`
- `new_sipriti_backend/src/database/models/index.ts`
- `new_sipriti_backend/src/database/models/associations.ts`
- `new_sipriti_backend/src/constants/modules.constants.ts`
- `new_sipriti_backend/src/constants/permissions.constants.ts`
- `new_sipriti_backend/src/database/seeders/rbac-source.ts`
- `new_sipriti_backend/src/docs/schemas.json` via `npm.cmd run api-docs`
- `new_sipriti_backend/docs/migration/endpoint-inventory.md`
- `new_sipriti_backend/docs/migration/table-inventory.md`

## Legacy Sources

- `sipriti_backend/src/routes/admin.routes.js`
- `sipriti_backend/src/routes/options.routes.js`
- `sipriti_backend/src/modules/prodi/*`
- `sipriti_backend/src/modules/skema/*`
- `sipriti_backend/src/modules/bidangfokus/*`
- `sipriti_backend/src/modules/tahunakademik/*`
- `sipriti_backend/src/modules/output/*`
- `sipriti_backend/src/modules/sertifikatmutu/*`
- `sipriti_backend/src/models/prodi.js`
- `sipriti_backend/src/models/skema.js`
- `sipriti_backend/src/models/bidangfokus.js`
- `sipriti_backend/src/models/tahunakademik.js`
- `sipriti_backend/src/models/output.js`
- `sipriti_backend/src/models/sertifikatmutu.js`

## Tasks Per Module

- [ ] **Step 1: Inventory legacy contract**

  For the module, record exact endpoints, auth, permission, request body, response, table, indexes, and relations.

- [ ] **Step 2: Create model**

  Match legacy table and columns. Use native UUIDv7 only for new rows if the legacy table expects UUID values. Do not rename existing DB columns unless mapper handles API contract explicitly.

- [ ] **Step 3: Create schema and DTOs**

  Zod schema must mirror legacy validation behavior. DTOs must use `z.infer<typeof schema>` when the schema is the source of truth.

- [ ] **Step 4: Create mapper**

  Mapper must preserve legacy response field names if frontend consumes them.

- [ ] **Step 5: Create repository**

  Repository contains direct DB access only. No business rule in repository.

- [ ] **Step 6: Create service**

  Service contains duplicate checks, status rules, transaction, cache invalidation, and audit call.

- [ ] **Step 7: Create policy**

  Preserve legacy permissions. Do not collapse permissions into broad `manage_master_data`.

- [ ] **Step 8: Create controller and routes**

  Route URLs must match legacy endpoints, including admin and options routes.

- [ ] **Step 9: Add migrations and SQL patches only when schema differs**

  If the new backend points to an existing legacy schema unchanged, no schema migration is needed. If any schema or permission is added/changed, create migration and SQL patch.

- [ ] **Step 10: Update inventories**

  Mark module status as `migrated` after build succeeds and `parity_verified` after smoke checks match legacy behavior.

- [ ] **Step 11: Verify module**

  Run:

  ```powershell
  npm.cmd run build
  npm.cmd run api-docs
  npm.cmd test
  ```

  Smoke check the module's list, detail, create, update, delete, and options endpoints where applicable.

## Phase 2 Gate

- `prodi` is available to auth context and scope checks.
- All migrated master data endpoints preserve legacy URLs and response shape.
- Permission seed source includes all required module permissions.
- Build and docs generation pass.

## Phase 2 Execution Prompt

```text
You are executing Phase 2 of the SIPRITI backend migration in D:\Ridhuan Ngoding Moment\React\PRPM.

Base context:
- Phase 0 and Phase 1 must be complete.
- Read new_sipriti_backend/DEVELOPER_GUIDE.md and follow its module structure exactly.
- Read sipriti_backend/md/RULES-PERUBAHAN-CODE.md.
- Master data migration order is prodi, skema, bidangfokus, tahunakademik, output, sertifikatmutu, then options routes.
- Preserve legacy endpoint URLs and response shapes.
- Use legacy source files for exact logic and validation.
- No any, no broad master-data permission shortcut, no endpoint drift.

Task:
Migrate Phase 2 master data modules only. For each module, inventory the legacy contract first, then implement model, schema, DTO, mapper, repository, service, policy, controller, routes, permissions, migrations/SQL patches only when needed, and smoke tests/checks. Update migration inventories after each module. Run build, api-docs, and test before reporting.
```

---

# Phase 3 - Public Content and Upload-Backed Content

## Goal

Migrate public-facing content modules without breaking public reads, slugs, file URLs, image URLs, or admin permissions.

## Migration Order

1. `files`
2. `upload`
3. richtext upload
4. `berita`
5. `pengumuman`
6. `panduan`
7. `publicpage`
8. `carousel`
9. `landing-slider`
10. `capaian`
11. `kategori-publikasi`
12. `publikasi`
13. `mitra-kerja-riset`
14. `product-riset`
15. `penghargaan-riset`
16. `hibah-internal`

## Legacy Sources

- `sipriti_backend/index.js` for static upload serving behavior.
- `sipriti_backend/src/middleware/upload*.js`
- `sipriti_backend/src/lib/uploadPaths.js`
- `sipriti_backend/src/lib/uploadFilename.js`
- `sipriti_backend/src/lib/fileSecurityValidation.js`
- `sipriti_backend/src/lib/imageValidation.js`
- `sipriti_backend/src/lib/imageProcessing.js`
- `sipriti_backend/src/modules/files/*`
- `sipriti_backend/src/modules/upload/*`
- content module folders under `sipriti_backend/src/modules/*`
- related models under `sipriti_backend/src/models/*.js`

## Tasks

- [ ] **Step 1: Complete files/upload foundation**

  Implement `modules/files` and `modules/upload` before content modules. Preserve `/uploads/<subdir>/<filename>` URL behavior.

- [ ] **Step 2: Add static serving**

  Static serving must deny index, deny dotfiles, set `X-Content-Type-Options: nosniff`, and set `Referrer-Policy: no-referrer`.

- [ ] **Step 3: Add upload validations**

  Every upload path must validate size, MIME, magic bytes, and extension allowlist. Filename must be UUID-based.

- [ ] **Step 4: Migrate richtext upload**

  Preserve:

  - `POST /api/upload/richtext`
  - `DELETE /api/upload/richtext/:filename`

- [ ] **Step 5: Migrate simple public content**

  Start with modules that have simple CRUD and public GET routes. Preserve slug behavior for `berita` and `pengumuman`.

- [ ] **Step 6: Migrate image-heavy content**

  Migrate `carousel` and `landing-slider` only after upload validations pass.

- [ ] **Step 7: Migrate publication/reporting content**

  Migrate `capaian`, `kategori-publikasi`, `publikasi`, `mitra-kerja-riset`, `product-riset`, `penghargaan-riset`, and `hibah-internal`.

- [ ] **Step 8: Verify public and admin behavior**

  Smoke check:

  - public list/detail endpoints without auth;
  - admin create/update/delete endpoints with permission;
  - upload endpoints with valid and invalid files;
  - static file URL retrieval.

## Phase 3 Gate

- Public content endpoints return same field names as legacy.
- Upload security behavior is present.
- Static file URLs still work.
- Admin content permissions match legacy.

## Phase 3 Execution Prompt

```text
You are executing Phase 3 of the SIPRITI backend migration in D:\Ridhuan Ngoding Moment\React\PRPM.

Base context:
- Phase 0, Phase 1, and Phase 2 must be complete.
- Read legacy upload/static behavior from sipriti_backend/index.js and upload-related middleware/lib files.
- Preserve public URLs and endpoint URLs exactly.
- Do not migrate proposal workflow in this phase.
- All upload file flows require size, MIME, magic byte, UUID filename, path guard, rate limit, and safe static headers.
- Public read endpoints must not leak internal fields.
- No any and no response shape drift.

Task:
Migrate files/upload/richtext upload first, then public/content modules in the Phase 3 order. For each module, preserve legacy logic, permissions, endpoint URLs, request fields, response fields, slug behavior, and upload URL behavior. Add migrations/SQL patches only when schema or permission changes. Run build, api-docs, test, and manual upload/public endpoint smoke checks.
```

---

# Phase 4 - Proposal Core Migration

## Goal

Migrate the core proposal workflow while preserving the exact business logic for penelitian, pengabdian, proposal members, detail serializers, search, submit, and forward.

## Migration Order

1. shared proposal aggregate models and associations
2. `proposal`
3. `invites`
4. `notification`
5. `research` mounted as `/api/penelitian` and `/api/usulan-penelitian`
6. `pengabdian` mounted as `/api/pengabdian` and `/api/usulan-pengabdian`
7. `penelitian-proposal`
8. `pengabdian-proposal`
9. `jadwal-proposal`
10. `luaran-proposal`
11. `rab-proposal`
12. search anggota

## Legacy Sources

- `sipriti_backend/src/modules/proposal/*`
- `sipriti_backend/src/modules/research/*`
- `sipriti_backend/src/modules/pengabdian/*`
- `sipriti_backend/src/modules/invites*`
- `sipriti_backend/src/modules/notification/*`
- `sipriti_backend/src/modules/search-anggota/*`
- `sipriti_backend/src/modules/penelitian-proposal/*`
- `sipriti_backend/src/modules/pengabdian-proposal/*`
- `sipriti_backend/src/modules/jadwal-proposal/*`
- `sipriti_backend/src/modules/luaran-proposal/*`
- `sipriti_backend/src/modules/rab-proposal/*`
- proposal-related models under `sipriti_backend/src/models`
- proposal-related migrations under `sipriti_backend/migrations`

## Tasks

- [ ] **Step 1: Inventory proposal aggregate**

  Document tables and ownership for:

  - `hakiproposal`
  - `memberproposal`
  - `mahasiswa`
  - `mitraproposal`
  - `penelitianproposal`
  - `pengabdianproposal`
  - `jadwalproposal`
  - `luaranproposal`
  - `rabproposal`

- [ ] **Step 2: Define proposal policies**

  Preserve:

  - ketua-only rules;
  - member invite rules;
  - status transition rules;
  - prodi-scoped access;
  - forward eligibility;
  - edit restrictions after submit/review.

- [ ] **Step 3: Migrate base proposal and invite behavior**

  Preserve endpoints:

  - `POST /api/proposal`
  - `POST /api/proposal/:proposalId/invite`
  - `POST /api/proposal/:proposalId/respond`
  - `POST /api/proposal/:proposalId/review`
  - `/api/invites/*`

- [ ] **Step 4: Migrate notification dependency**

  Preserve notification read, unread count, invite accept/reject, and business messages.

- [ ] **Step 5: Migrate penelitian**

  Preserve both mounts:

  - `/api/penelitian`
  - `/api/usulan-penelitian`

  Preserve landing public endpoint, options endpoint, create, update, detail, submit, delete, search, by-prodi, and forward.

- [ ] **Step 6: Migrate pengabdian**

  Preserve both mounts:

  - `/api/pengabdian`
  - `/api/usulan-pengabdian`

  Preserve the same behavior category as penelitian.

- [ ] **Step 7: Migrate nested proposal sections**

  Preserve nested routes:

  - `/api/proposals/:id/penelitian`
  - `/api/proposals/:id/pengabdian`
  - `/api/proposals/:id/jadwal`
  - `/api/proposals/:id/luaran`
  - `/api/proposals/:id/rab`

- [ ] **Step 8: Migrate search anggota**

  Preserve:

  - `GET /api/usulan/search-anggota`

  Ensure identity fields are not empty unless legacy data is actually empty.

- [ ] **Step 9: Add semantic audit**

  Add non-blocking audit for create/update/delete and explicit semantic audit for submit/forward.

- [ ] **Step 10: Verify Phase 4**

  Smoke check at least:

  - create penelitian draft;
  - update penelitian;
  - submit penelitian;
  - create pengabdian draft;
  - update pengabdian;
  - submit pengabdian;
  - search proposal;
  - by-prodi list;
  - forward eligible proposal;
  - reject forward when not ketua;
  - nested jadwal/luaran/rab update.

## Phase 4 Gate

- Core proposal create/update/detail/submit/search/forward parity is verified.
- Both legacy aliases still work.
- No frontend endpoint changes are required.
- Proposal policy is centralized, not duplicated in controllers.

## Phase 4 Execution Prompt

```text
You are executing Phase 4 of the SIPRITI backend migration in D:\Ridhuan Ngoding Moment\React\PRPM.

Base context:
- Phase 0 to Phase 3 must be complete.
- sipriti_backend is the source of truth for proposal logic and endpoints.
- Preserve /api/penelitian and /api/usulan-penelitian aliases.
- Preserve /api/pengabdian and /api/usulan-pengabdian aliases.
- Preserve nested /api/proposals/:id/* routes.
- Do not simplify status transitions, ketua checks, prodi checks, forward rules, or response serializers.
- Put business rules in services/policies, not controllers.
- No any and no endpoint drift.

Task:
Migrate proposal core only: proposal, invites, notifications needed by proposal, penelitian, pengabdian, nested proposal sections, and search anggota. Inventory each endpoint before implementation. Match old request/response contracts exactly. Add semantic audit and required migrations/SQL patches. Run build, api-docs, test, and smoke checks for create/update/submit/detail/search/by-prodi/forward/nested section flows.
```

---

# Phase 5 - Review, Reports, PDF, HKI, Monev, Official Signatures, Bulk Import

## Goal

Migrate the advanced workflow modules after proposal core is stable.

## Migration Order

1. `proposal-review`
2. `laporan-usulan`
3. `proposal-final-pdf`
4. `official-signatures`
5. `hki`
6. `hki-review`
7. `monevproposal`
8. `monev-internal`
9. `dashboard`
10. `admin-dashboard`
11. `auditlog`
12. `bulk-import`

## Legacy Sources

- `sipriti_backend/src/modules/proposal-review/*`
- `sipriti_backend/src/modules/laporan-usulan/*`
- `sipriti_backend/src/modules/proposal-final-pdf/*`
- `sipriti_backend/src/modules/official-signatures/*`
- `sipriti_backend/src/modules/hki/*`
- `sipriti_backend/src/modules/hki-review/*`
- `sipriti_backend/src/modules/monevproposal/*`
- `sipriti_backend/src/modules/monev-internal/*`
- `sipriti_backend/src/modules/dashboard/*`
- `sipriti_backend/src/modules/admin-dashboard/*`
- `sipriti_backend/src/modules/auditlog/*`
- `sipriti_backend/src/modules/bulk-import/*`
- `sipriti_backend/src/services/academic-math-pdf.service.js`
- `sipriti_backend/src/services/richtext-parser.service.js`
- `sipriti_backend/src/services/richtext-image-lifecycle.service.js`
- PDF builder files under `sipriti_backend/src/modules/proposal-final-pdf`

## Tasks

- [ ] **Step 1: Migrate proposal review**

  Preserve approve, reject, resubmit, detail, list, reviewer/admin permissions, and notification side effects.

- [ ] **Step 2: Migrate laporan usulan**

  Preserve upload, validation, overwrite status, report type behavior, and eligibility rules.

- [ ] **Step 3: Migrate final PDF**

  Preserve final PDF eligibility:

  - proposal exists;
  - proposal type is `hibah_internal`;
  - proposal status is `Approved`;
  - logged-in user is ketua;
  - laporan akhir is validated or `Sesuai` when required by latest rules;
  - required template data exists.

- [ ] **Step 4: Migrate official signatures**

  Preserve `kode_prodi` scope and permission `manage_signature`.

- [ ] **Step 5: Migrate HKI and HKI review**

  Preserve submit, approve, reject, file behavior, output relation, and revision columns.

- [ ] **Step 6: Migrate monev modules**

  Preserve monev proposal sections and internal monev schedule/upload behavior.

- [ ] **Step 7: Migrate dashboard modules**

  Preserve dashboard counts, latest statuses, admin dashboard stats, and role/prodi filtering.

- [ ] **Step 8: Migrate auditlog viewer**

  Preserve `/api/audit-logs` behavior and permission `view_audit_log`.

- [ ] **Step 9: Migrate bulk import**

  Preserve:

  - template download behavior;
  - selected members hidden-sheet enforcement;
  - template tamper rejection;
  - old template rejection;
  - atomic transaction import;
  - duplicate detection;
  - exactly one ketua;
  - `Bidang Tugas` required.

- [ ] **Step 10: Verify Phase 5**

  Smoke check:

  - proposal approval/rejection;
  - laporan upload and validation;
  - final PDF download/generation;
  - official signature CRUD and prodi scope;
  - HKI submit/review;
  - monev list/upload;
  - dashboard stats;
  - audit log list/detail;
  - bulk template download/import happy and tamper cases.

## Phase 5 Gate

- Advanced workflows match old behavior.
- PDF output and upload paths work.
- Bulk import is tamper-safe.
- Dashboard and audit views are operational.

## Phase 5 Execution Prompt

```text
You are executing Phase 5 of the SIPRITI backend migration in D:\Ridhuan Ngoding Moment\React\PRPM.

Base context:
- Phase 0 to Phase 4 must be complete.
- Proposal core is already stable.
- Preserve old workflow logic for review, laporan, PDF, HKI, monev, dashboard, auditlog, and bulk import.
- Read sipriti_backend/md/RULES-PERUBAHAN-CODE.md before touching database, permission, or endpoint contracts.
- For PDF and richtext, read the legacy parser and builder services before implementing.
- Bulk import must preserve hidden-sheet selected-member enforcement and tamper rejection.
- No any, no endpoint drift, no response drift.

Task:
Migrate Phase 5 advanced workflow modules in order. Inventory each endpoint and table before code. Preserve existing logic and response contracts. Add migrations/SQL patches for any schema/permission changes. Run build, api-docs, test, and smoke checks for review, laporan, PDF, signatures, HKI, monev, dashboard, auditlog, and bulk import tamper cases.
```

---

# Phase 6 - Cutover, Parity Verification, and Cleanup

## Goal

Prove that the new backend can replace the old backend without breaking frontend behavior, then remove or archive temporary migration scaffolding safely.

## Files

- Create: `new_sipriti_backend/docs/migration/cutover-runbook.md`
- Create: `new_sipriti_backend/docs/migration/parity-report.md`
- Create: `new_sipriti_backend/docs/migration/rollback-runbook.md`
- Modify: `new_sipriti_backend/docs/migration/phase-status.md`
- Inspect: all endpoint inventory and table inventory statuses

## Tasks

- [ ] **Step 1: Build parity test matrix**

  Include critical flows:

  - login/logout/me;
  - RBAC permission list and user role assignment;
  - prodi/skema/bidangfokus/tahunakademik options;
  - public berita/pengumuman/panduan;
  - upload and static file read;
  - penelitian create/update/submit/detail/search/forward;
  - pengabdian create/update/submit/detail/search/forward;
  - proposal review approve/reject/resubmit;
  - laporan upload/validation;
  - PDF final;
  - HKI submit/review;
  - monev;
  - dashboard;
  - audit logs;
  - bulk import template and import.

- [ ] **Step 2: Run old backend fixture capture**

  Capture response JSON for the critical matrix from `sipriti_backend`.

- [ ] **Step 3: Run new backend fixture capture**

  Capture response JSON for the same matrix from `new_sipriti_backend`.

- [ ] **Step 4: Compare contracts**

  Compare:

  - HTTP status;
  - response top-level keys;
  - field names;
  - enum/status values;
  - error codes/messages;
  - permission failures;
  - upload URLs;
  - pagination meta.

- [ ] **Step 5: Verify database migration path**

  Run migration and SQL patch in dev/staging. Verify rerunning SQL patches is safe.

- [ ] **Step 6: Verify rollback path**

  Run migration undo where safe. Document manual rollback for production SQL patches.

- [ ] **Step 7: Prepare cutover runbook**

  Include:

  - backup step;
  - maintenance window;
  - env variable checklist;
  - migration order;
  - SQL patch order;
  - smoke checks;
  - rollback trigger;
  - rollback command/manual steps;
  - post-cutover monitoring.

- [ ] **Step 8: Final verification**

  Run:

  ```powershell
  npm.cmd run build
  npm.cmd run api-docs
  npm.cmd test
  ```

  Then run the full smoke matrix.

## Phase 6 Gate

- Parity report shows no endpoint or logic differences for critical flows.
- Any intentional additional behavior is documented and does not break legacy frontend.
- Rollback runbook exists.
- Cutover runbook exists.
- Build, docs, tests, and smoke matrix pass.

## Phase 6 Execution Prompt

```text
You are executing Phase 6 of the SIPRITI backend migration in D:\Ridhuan Ngoding Moment\React\PRPM.

Base context:
- Phase 0 to Phase 5 must be complete.
- The goal is cutover readiness, not new feature work.
- Do not change endpoint behavior unless parity checks reveal a bug and the fix preserves legacy behavior.
- Compare old backend and new backend responses for critical frontend flows.
- Verify migration, SQL patch idempotency, rollback, and smoke checks.

Task:
Create cutover, rollback, and parity reports. Capture old/new response fixtures for critical flows, compare contracts, fix any parity mismatch, and document intentional additions. Run build, api-docs, test, migration/SQL patch checks, and full smoke matrix. Report cutover readiness with evidence.
```

---

# Cross-Phase Prompt Template

Use this when starting any single module inside a phase:

```text
You are migrating one SIPRITI backend module into new_sipriti_backend.

Base context:
- Legacy backend source: sipriti_backend.
- New backend target: new_sipriti_backend.
- Read new_sipriti_backend/DEVELOPER_GUIDE.md.
- Read new_sipriti_backend/MIGRATION_EXECUTION_PLAN.md.
- Read new_sipriti_backend/SIPRITI_BACKEND_MIGRATION_GAP.md.
- Read sipriti_backend/md/RULES-PERUBAHAN-CODE.md.
- Preserve old endpoint URLs, request fields, response fields, permissions, status logic, and side effects.
- Follow new module structure: dto, mappers, policies, queries, model, repository, service, controller, routes, schema.
- Use Zod v4 for request/query/param schema.
- Use DTOs and mappers for response contracts.
- Use repository only for DB access.
- Use service for business rules and transactions.
- Use policy for authorization/resource ownership.
- Use ESM local imports with .js extension.
- No any. No forced casts. No fake compatibility assumptions.

Task:
1. Inventory the legacy module endpoints, models, permissions, request/response contracts, and side effects.
2. Implement the module in new_sipriti_backend using the Developer Guide structure.
3. Add or update migrations, seeders, SQL patches, constants, and associations only when needed.
4. Add OpenAPI annotations and run schema sync.
5. Update migration inventories.
6. Run npm.cmd run build, npm.cmd run api-docs, npm.cmd test.
7. Smoke check the exact legacy endpoints.
8. Report any difference from legacy behavior. If there is a difference, treat it as a bug unless explicitly approved.
```

# Recommended Commit Slices

Use small commits per phase:

```text
docs: add migration ADRs and inventories
chore: add migration sql patch workflow
refactor: align response and error contracts
feat: add legacy-compatible auth session middleware
feat: add multi-role rbac foundation
feat: add upload storage foundation
feat: migrate prodi module
feat: migrate skema module
feat: migrate penelitian proposal flow
test: add proposal parity coverage
docs: add cutover and rollback runbooks
```

# Final Acceptance Criteria

Migration is complete only when:

- All endpoints in `docs/migration/endpoint-inventory.md` are `parity_verified` or explicitly `deferred` with reason.
- All tables in `docs/migration/table-inventory.md` have owner context and migration strategy.
- No frontend-facing endpoint drift exists.
- No frontend-facing response drift exists.
- No permission drift exists.
- `npm.cmd run build` passes.
- `npm.cmd run api-docs` passes.
- `npm.cmd test` passes.
- SQL patches are idempotent in dev/staging.
- Rollback runbook is written.
- Cutover runbook is written.
