# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**SIPRITI** backend — modular Express + TypeScript REST API for a university research & community-service proposal management system. Uses Sequelize (MySQL), Zod v4 validation, JWT auth via HTTP-only cookie, granular RBAC, and CSRF protection.

## Companion Projects

| Project | Path | Port | Status |
|---|---|---|---|
| `SIPRITI` | `../SIPRITI` | 5173 | React frontend (active) |
| `sipriti_backend` | `../sipriti_backend` | 3001 | Legacy JS backend (**current production**, being replaced by this) |

This backend runs on port **3000**. The legacy backend runs on **3001**.

When adding or renaming an API route, check `../SIPRITI/src/config/env.ts` (`API_ENDPOINTS`) — the frontend must have a matching entry. Response shape changes are **breaking changes** for the frontend.

Permission constants in `src/constants/permissions.constants.ts` must stay in sync with what `../SIPRITI` passes to `can()` / `canAny()`.

## Project Memory

See `MEMORY.md` for key architectural decisions (ESM + `.js` rule, Express v5 async behavior, Zod v4, migration status). Add new decisions there — not in CLAUDE.md.

## Commands

```bash
npm run dev           # Start with hot-reload (tsx watch src/server.ts)
npm run build         # Compile TypeScript → dist/
npm run start         # Run compiled dist/server.js

# Database
npm run db:migrate    # Build then run all pending Sequelize migrations
npm run db:migrate:undo  # Undo last migration
npm run db:seed       # Build then seed all
npm run db:seed:undo  # Undo all seeds

# Code generation
npm run make:crud <name-in-kebab-case>  # Scaffold a complete CRUD module
npm run api-docs                         # Sync Zod schemas → src/docs/schemas.json (Swagger)
```

## Environment

Copy `.env.example` → `.env`:

```
PORT=3000
NODE_ENV=development
JWT_SECRET=<at-least-32-random-chars>
DATABASE_URL=mysql://root:password@localhost:3306/myapp
FRONTEND_URL=http://localhost:5173
CSRF_ENABLED=true
CSRF_SAMESITE=lax
UPLOAD_ROOT_DIR=uploads
```

Env is validated at startup via Zod in `src/config/env.ts`. The process exits if required vars are missing or invalid.

## Architecture

### Modular pattern

Every business feature lives entirely in its own folder under `src/modules/<feature>/`:

```
src/modules/<feature>/
├── dto/                      # TypeScript types for request/response shapes
├── mappers/                  # DB model → HTTP response DTO transforms
├── policies/                 # Ownership / resource-level authorization checks
├── queries/                  # Filter/sort allowlists, default Sequelize includes
├── <feature>.model.ts        # Sequelize model definition
├── <feature>.repository.ts   # Database queries only (no business logic)
├── <feature>.service.ts      # Business logic, cache, audit logs, transactions
├── <feature>.controller.ts   # req/res parsing and delegation to service
├── <feature>.routes.ts       # Route declarations, RBAC middleware, Swagger JSDoc
└── <feature>.schema.ts       # Zod v4 validation schemas
```

All routes are registered in `src/routes/index.ts` under the `/api` prefix.

### Core infrastructure (`src/core/`)

| Path | Purpose |
|---|---|
| `auth/auth.middleware.ts` | JWT authentication via HTTP-only cookie; populates `req.user` |
| `auth/rbac.middleware.ts` | `requirePermission()` / `requireAnyPermission()` route guards |
| `auth/session.middleware.ts` | Attaches optional session (used for public routes) |
| `csrf/csrf.middleware.ts` | CSRF protection; frontend must send `X-CSRF-Token` header |
| `cache/cache.service.ts` | In-memory caching |
| `audit/audit.service.ts` | Structured audit log writes |
| `errors/http-error.ts` | `HttpError.unauthorized()`, `.forbidden()`, `.notFound()` etc. |
| `middleware/validate.middleware.ts` | Zod validation middleware factory |
| `storage/` | File upload handling (multer), image processing (sharp), path utilities |

### Authentication & RBAC flow

1. `authenticate` middleware validates JWT cookie → populates `req.user` with `{ id, permissions[] }`
2. `requirePermission(name)` or `requireAnyPermission([names])` checks `req.user.permissions`
3. Policies in `<module>/policies/` handle row-level ownership checks within service/controller

### UUID generation

Use `generateUuidV7()` from `src/utils/uuid.ts` for all primary keys. **Never** use the `uuid` npm package directly in application code. Model default:

```typescript
id: {
  type: DataTypes.UUID,
  defaultValue: () => generateUuidV7(),
  primaryKey: true,
}
```

### ES Module imports

This project uses `"type": "module"`. All local file imports **must include the `.js` extension**:

```typescript
import { fn } from "./utils/helper.js";   // correct
import { fn } from "./utils/helper";       // wrong — will fail at runtime
```

### Zod → Swagger workflow

1. Define schemas in `<module>.schema.ts` using Zod v4
2. Run `npm run api-docs` to regenerate `src/docs/schemas.json`
3. In `*.routes.ts`, reference schemas via `$ref: '#/components/schemas/CreateFeature'` (the generator strips the "Schema" suffix and PascalCases the name)
4. Swagger UI is available at `/docs`

### Adding a new module

```bash
npm run make:crud my-feature   # generates all boilerplate files
npm run api-docs               # register new Zod schemas in Swagger
```

Then implement domain-specific columns and business logic.

### TypeScript rules

- No `any`, no `unknown`
- No arbitrary `as` casts unless extending third-party module types
- Delete unused imports and dead code immediately when refactoring

### Utility helpers

- `src/utils/response.ts` — `sendSuccess()`, `sendError()` for consistent response shape
- `src/utils/pagination.ts` — pagination helpers
- `src/core/database/query-builder.ts` — reusable Sequelize query construction
