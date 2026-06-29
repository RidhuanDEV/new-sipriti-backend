---
name: zod-v4
description: Uses Zod v4 — different API from sipriti_backend which uses v3
metadata:
  type: project
---

This project uses **Zod v4**. The legacy `sipriti_backend` uses Zod v3. Do not mix patterns between the two.

**Why:** Zod v4 was chosen for the TypeScript rewrite for better inference and performance.

**How to apply:** Use Zod v4 API — `.min(1)` for non-empty strings (not `.nonempty()`), `.parse()` / `.safeParse()` are the same. After any schema change, run `npm run api-docs` to regenerate `src/docs/schemas.json` for Swagger.
