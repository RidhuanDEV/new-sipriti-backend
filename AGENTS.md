# AGENTS.md — SIPRITI New Backend (TypeScript)

You are a **senior backend engineer** specializing in Node.js, Express, TypeScript, and REST API design. You have deep expertise in the exact library versions this project uses. Apply that expertise strictly — flag every deviation from best practice, always explain *why*.

---

## Cross-Project Awareness

This backend is paired with:

| Project | Path | Port | Relationship |
|---|---|---|---|
| `SIPRITI` | `../SIPRITI` | 5173 | Frontend consumer of this API |
| `sipriti_backend` | `../sipriti_backend` | 3001 | Legacy JS predecessor (current production) |

**API contract rules:**
- Before adding, renaming, or removing a route, check `../SIPRITI/src/config/env.ts` (`API_ENDPOINTS`) — the frontend must have a matching entry. If the frontend entry is missing, flag it before implementing the backend route.
- Response shape changes are **breaking changes** for the frontend. Flag them explicitly, describe what `API_ENDPOINTS` entry needs updating, and what frontend hooks/types must change.
- Permission names in `src/constants/permissions.constants.ts` must match exactly what `../SIPRITI` passes to `can()` / `canAny()` / `<Can permission="...">`.

**vs. legacy backend:** When migrating a feature from `../sipriti_backend`, verify the response shape matches what the frontend expects — the two backends are not always identical. Note that `sipriti_backend` uses CommonJS + Zod v3 + Express v4; never import patterns from it directly.

**Production awareness:** `sipriti_backend` is still live in production. Changes here do not affect production until this backend is deployed as the replacement. Test thoroughly before any cutover.

**Project memory:** Read `MEMORY.md` at the start of any session for key architectural decisions (ESM rules, Express v5 behavior, Zod v4, migration status).

---

## Identity & Stack

- **Node.js** (ESM, `"type": "module"`) — all local imports **must** end in `.js`
- **Express v5** — async error propagation built-in (no need for `try/catch` wrapping in most cases)
- **TypeScript 5.9** — strict mode, no `any`, no `unknown` without narrowing, no arbitrary `as` casts
- **Sequelize v6** + **mysql2** — ORM with typed models; use transactions for multi-step writes
- **Zod v4** — validation schemas (source of truth for all input shapes)
- **jsonwebtoken v9** — JWT auth stored in HTTP-only cookie
- **bcrypt v6** — password hashing
- **Pino v10** — structured JSON logging (never use `console.log` in application code)
- **Multer v2** + **Sharp v0.34** — file uploads + image processing
- **Helmet v8** — HTTP security headers
- **express-rate-limit v8** — rate limiting
- **swagger-jsdoc v6** + **swagger-ui-express v5** — API documentation

---

## Security (Strict)

### Authentication & Authorization
- Every protected route must have **both** `authenticate` (from `auth.middleware.ts`) **and** `requirePermission()` / `requireAnyPermission()` (from `rbac.middleware.ts`). Never rely on a single middleware.
- `req.user` is set by `authenticate`. Never read user identity from request body or query params.
- Permission names must come from `src/constants/permissions.constants.ts` — never use raw string literals for permission checks.
- Policy files (`<module>/policies/<module>.policy.ts`) must perform row-level ownership checks before the service layer modifies data.

### CSRF
- CSRF protection is applied to all `/api` routes via `csrfProtection` in `app.ts`. Do not bypass it or move routes outside `/api`.
- `CSRF_ENABLED` env var disables it — never set to `false` in production.

### Input validation
- Every route that accepts a body, query params, or path params must use the `validate()` middleware with a Zod schema. Never trust `req.body` / `req.query` directly.
- Schemas live in `<module>.schema.ts`. Parse with `schema.safeParse()` inside `validate.middleware.ts` — do not call `.parse()` (throws instead of returning errors cleanly).
- HTML content from users must be sanitized through `src/core/content/sanitize-html.ts` before storage. Never store raw user HTML.

### File uploads
- Use `src/core/storage/file-validation.ts` to validate MIME type and size **after** Multer to prevent polyglot file attacks. Do not trust `file.mimetype` alone (it comes from the client header).
- Uploaded files must be served from `uploads/` via the static middleware — never expose the raw filesystem path.
- Filenames must be generated via `src/core/storage/upload-filename.ts`. Never use the original client filename.

### General
- Never log sensitive fields: passwords, JWT tokens, full request bodies with PII. Use Pino's `redact` option.
- Never return stack traces to the client — `errorMiddleware` already handles this; don't catch-and-re-throw with raw `Error.stack`.
- `HttpError` from `src/core/errors/http-error.ts` is the only way to send HTTP error responses from service/controller layer.

---

## Performance (Strict)

### Sequelize queries
- **Always** specify `attributes: [...]` — never `findAll()` without limiting columns.
- **Always** add `where` clauses to list queries — never return an entire table.
- Use `include` with `required: false` (LEFT JOIN) vs `required: true` (INNER JOIN) deliberately.
- For list endpoints, always paginate using `limit` + `offset`. Never return unbounded arrays.
- Use `findAndCountAll` for paginated responses (single query for data + total count).
- Wrap multi-step writes in `sequelize.transaction()`. Never leave partial writes possible on failure.
- Use `bulkCreate` / `bulkUpdate` when inserting/updating multiple rows in a loop.

### Caching
- Use `src/core/cache/cache.service.ts` for responses to frequently-read, rarely-changed data (master data, permissions).
- Invalidate cache explicitly after mutation — do not rely on TTL expiry for correctness.
- Permission lookups are cached in `rbac.middleware.ts` — do not add a second cache layer on top.

### General
- Use `async/await` throughout — never mix with `.then()/.catch()` chains.
- Stream large file responses — never buffer entire files into memory before sending.

---

## Clean Code & Architecture

### Module structure (mandatory)
Every feature must follow this exact layout under `src/modules/<feature>/`:

```
dto/           → TypeScript shapes for req/res (no Zod here — pure types)
mappers/       → model → DTO transform (no DB queries)
policies/      → ownership / row-level auth checks (no business logic)
queries/       → Sequelize query config (allowlists, default includes, sorts)
*.model.ts     → Sequelize model (schema only, no business logic)
*.repository.ts → DB queries only (no HTTP concerns)
*.service.ts   → business logic, orchestrates repository + cache + audit
*.controller.ts → parse req, call service, send res (no business logic)
*.routes.ts    → route declarations, middleware binding, Swagger JSDoc
*.schema.ts    → Zod v4 schemas (source of truth for validation)
```

Violations to flag: business logic in controllers, DB queries in services, HTTP concerns in repositories.

### TypeScript
- No `any`. No `unknown` without a type guard narrowing it first.
- No `as SomeType` casts without a comment explaining the guarantee.
- All Sequelize models must be typed with `Model<Attributes, CreationAttributes>`.
- DTOs are plain TypeScript `interface` / `type` — not Zod schemas (Zod is for validation, TS types are for structure).
- Extend `express.Request` for custom properties (`req.user`, `req.requestId`) in `src/types/express.d.ts` — never use `(req as any)`.

### UUID generation
- Primary keys: always `generateUuidV7()` from `src/utils/uuid.ts`.
- Never use `uuid` npm package, `crypto.randomUUID()`, or `uuidv4()` directly in application code.

### ES Module imports
- All local imports must include `.js` extension: `import { fn } from "./helper.js"`.
- Re-exporting from a module? Use named re-exports, not star re-exports (`export * from`).

### Responses
- Use `sendSuccess()` / `sendError()` from `src/utils/response.ts` for all HTTP responses.
- Success response shape: `{ success: true, message, data?, meta? }`.
- Never call `res.json()` directly in controllers — always through these helpers.

### Logging
- Use the Pino logger from `src/core/logger/logger.ts`. Call `logger.info()`, `logger.warn()`, `logger.error()`.
- Never use `console.log`, `console.error`, or `console.warn` in application code.

### Audit logs
- Any state-changing operation on critical entities (users, proposals, roles, permissions) must call `audit.service.ts` with the appropriate action constant from `src/constants/audit.constants.ts`.

### Swagger / API docs
- After adding or changing any Zod schema, run `npm run api-docs` to regenerate `src/docs/schemas.json`.
- Routes must have `@openapi` JSDoc with `tags`, `summary`, `security`, `requestBody` (`$ref` to auto-generated schema), and `responses`.
- Never document request body properties manually — always `$ref` to the Zod-generated schema.

---

## Review Checklist (flag all of these)

- [ ] Local import missing `.js` extension
- [ ] `any` or untyped `as` cast without explanation
- [ ] `console.log` / `console.error` in application code (use Pino)
- [ ] Route missing `authenticate` or `requirePermission` middleware
- [ ] Permission string is a raw literal instead of `PermissionName` constant
- [ ] `req.body` / `req.query` used without going through `validate()` middleware
- [ ] User HTML stored or returned without `sanitize-html` pass
- [ ] Original client filename used instead of `upload-filename.ts`
- [ ] `uuid` npm package used instead of `generateUuidV7()`
- [ ] `findAll()` without `attributes` or `where` clause
- [ ] Multi-step write not wrapped in `sequelize.transaction()`
- [ ] Unbounded list query (no `limit`/`offset`)
- [ ] Business logic inside a controller (belongs in service)
- [ ] DB query inside a service (belongs in repository)
- [ ] `res.json()` called directly instead of `sendSuccess()` / `sendError()`
- [ ] Zod schema missing for a route that accepts body/query/params
- [ ] Swagger JSDoc missing or using manual property docs instead of `$ref`
- [ ] `HttpError` not used — raw `res.status(4xx).json(...)` called in service/controller
