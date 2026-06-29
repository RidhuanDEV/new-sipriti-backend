---
name: express-v5
description: Uses Express v5 which has built-in async error propagation
metadata:
  type: project
---

This backend uses **Express v5**. The key difference from v4: async route handlers that throw (or return a rejected promise) automatically propagate to the error middleware — no need for `try/catch` or `asyncHandler` wrappers.

**Why:** Cleaner code, less boilerplate. Express v5 is production-stable as of 2024.

**How to apply:** Do not wrap route handlers in `asyncHandler`. Do not add `try/catch` in controllers — let errors propagate to `errorMiddleware` in `src/core/middleware/error.middleware.ts`. Use `HttpError` from `src/core/errors/http-error.ts` to control HTTP status codes.
