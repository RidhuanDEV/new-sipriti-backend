import express from "express";
import helmet from "helmet";
import cors from "cors";
import type { CorsOptions } from "cors";
import { env } from "./config/env.js";
import { configureZodLocale } from "./core/validation/zod-error-map.js";
import {
  attachOptionalSession,
  cookieParserMiddleware,
} from "./core/auth/session.middleware.js";
import { csrfProtection } from "./core/csrf/csrf.middleware.js";
import { requestIdMiddleware } from "./core/middleware/request-id.middleware.js";
import { accessLogMiddleware } from "./core/middleware/access-log.middleware.js";
import { rateLimitMiddleware } from "./core/middleware/rate-limit.middleware.js";
import { errorMiddleware } from "./core/middleware/error.middleware.js";
import { staticUploadsMiddleware } from "./core/storage/static-uploads.middleware.js";
import { setupSwagger } from "./docs/swagger.js";
import { loadRoutes } from "./routes/index.js";
import { sendSuccess } from "./utils/response.js";

// Configure Zod to return Bahasa Indonesia validation messages globally.
configureZodLocale();

const app = express();
const configuredOrigins = env.FRONTEND_URL.split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);
const developmentOrigins =
  env.NODE_ENV === "production"
    ? []
    : ["http://localhost:5173", "http://127.0.0.1:5173"];
const allowedOrigins = new Set([...configuredOrigins, ...developmentOrigins]);
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin tidak diizinkan oleh CORS"));
  },
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-CSRF-Token",
    "X-Request-Id",
  ],
  exposedHeaders: ["X-CSRF-Token", "X-Request-Id"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};

app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  }),
);
app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParserMiddleware);
app.use(requestIdMiddleware);
app.use(accessLogMiddleware);
app.use(rateLimitMiddleware);
app.use(staticUploadsMiddleware());

setupSwagger(app);

app.get("/health", (_req, res) => {
  sendSuccess(res, { message: "OK", data: { status: "ok" } });
});

app.use("/api", csrfProtection, attachOptionalSession);
await loadRoutes(app);

app.use(errorMiddleware);

export { app };
