// ─────────────────────────────────────────────────────────────
// Express Application — Middleware Pipeline
// ─────────────────────────────────────────────────────────────
// Middleware order matters. The sequence below follows the
// industry-standard pipeline used in production Express apps:
//
//   1. Security headers  (helmet)
//   2. Compression        (gzip response bodies)
//   3. CORS               (cross-origin access control)
//   4. Rate limiting       (DDoS / brute-force protection)
//   5. Body parsers        (JSON, URL-encoded)
//   6. Cookies             (signed cookie parsing)
//   7. HTTP logging        (Morgan → Winston)
//   8. API routes          (versioned)
//   9. 404 catch-all
//  10. Global error handler
// ─────────────────────────────────────────────────────────────

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import env from "./config/env.js";
import logger from "./config/logger.js";
import apiRouter from "./routes/index.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";
import correlation from "./middleware/correlation.js";

const app = express();

// ── 0. Request Correlation Tracking ──────────────────────────
app.use(correlation);

// ── 1. Security Headers ─────────────────────────────────────
app.use(helmet());

// ── 2. Compression ──────────────────────────────────────────
app.use(compression());

// ── 3. CORS ─────────────────────────────────────────────────
app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── 4. Rate Limiting ────────────────────────────────────────
const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests, please try again later",
    },
});
app.use("/api", limiter);

// ── 5. Body Parsers ─────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── 6. Cookies ──────────────────────────────────────────────
app.use(cookieParser());

// ── 7. HTTP Logging ─────────────────────────────────────────
const morganFormat = env.isDevelopment ? "dev" : "combined";
app.use(morgan(morganFormat, { stream: logger.stream }));

// ── 8. API Routes ───────────────────────────────────────────
app.use("/api", apiRouter);

// ── 9. 404 Catch-All ────────────────────────────────────────
app.use(notFound);

// ── 10. Global Error Handler ────────────────────────────────
app.use(errorHandler);

export default app;