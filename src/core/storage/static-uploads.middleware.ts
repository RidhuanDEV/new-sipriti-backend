import express from "express";
import type { Router } from "express";
import type { ServerResponse } from "node:http";
import { getUploadDir, PUBLIC_STATIC_SUBDIRS } from "./storage-paths.js";

function setPublicUploadHeaders(res: ServerResponse): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
}

export function staticUploadsMiddleware(
  subdirs: ReadonlyArray<string> = PUBLIC_STATIC_SUBDIRS,
): Router {
  const router = express.Router();

  for (const subdir of subdirs) {
    router.use(
      `/uploads/${subdir}`,
      express.static(getUploadDir(subdir), {
        index: false,
        dotfiles: "deny",
        setHeaders: setPublicUploadHeaders,
      }),
    );
  }

  return router;
}
