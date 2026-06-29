---
name: esm-module-system
description: Project uses ESM (type:module); all local imports must end in .js
metadata:
  type: project
---

`package.json` has `"type": "module"`. Node.js resolves bare local imports as ESM, which requires explicit file extensions.

**Why:** ESM is the modern standard and enables better tree-shaking. The `.js` extension in imports is required even though the source files are `.ts` — TypeScript compiles to `.js` and the runtime sees those files.

**How to apply:** Every local import must end in `.js`: `import { fn } from "./utils/helper.js"`. If you forget, the server will crash at startup with `ERR_MODULE_NOT_FOUND`. This is the most common source of bugs when adding new files.
