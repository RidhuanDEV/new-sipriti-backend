import { config } from "dotenv";
import { z } from "zod";

config();

const placeholderJwtSecrets = new Set([
  "change_this_to_a_random_string_at_least_32_chars",
]);

function isLocalhostOrigin(origin: string): boolean {
  try {
    const parsedOrigin = new URL(origin);
    return ["localhost", "127.0.0.1", "::1"].includes(parsedOrigin.hostname);
  } catch {
    return false;
  }
}

const envSchema = z
  .object({
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    FRONTEND_URL: z.string().default("http://localhost:5173"),
    AUTH_COOKIE_NAME: z.string().min(1).default("jwt"),
    JWT_COOKIE_EXPIRES_IN: z.coerce.number().int().positive().default(7),
    CSRF_ENABLED: z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
    CSRF_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
    COOKIE_DOMAIN: z.string().optional(),
    UPLOAD_ROOT_DIR: z.string().default("uploads"),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === "production") {
      if (placeholderJwtSecrets.has(value.JWT_SECRET)) {
        ctx.addIssue({
          code: "custom",
          path: ["JWT_SECRET"],
          message: "JWT_SECRET must be rotated from the development placeholder in production",
        });
      }

      if (value.FRONTEND_URL.split(",").some((origin) => isLocalhostOrigin(origin.trim()))) {
        ctx.addIssue({
          code: "custom",
          path: ["FRONTEND_URL"],
          message: "FRONTEND_URL must not default to localhost in production",
        });
      }
    }
  });

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment variables:");
  console.error(JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}

export const env = result.data;
export type Env = z.infer<typeof envSchema>;
