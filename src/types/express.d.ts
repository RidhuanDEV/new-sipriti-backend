import type { AuthenticatedUserContext } from "./auth.js";
import type { ProcessedImageInfo } from "../core/storage/image-processing.js";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      cookies: Record<string, string>;
      csrfToken?: string;
      user?: AuthenticatedUserContext;
      processedImages?: {
        img_desktop?: ProcessedImageInfo;
        img_mobile?: ProcessedImageInfo;
      };
      uploadSubDir?: string;
    }
  }
}

export {};
