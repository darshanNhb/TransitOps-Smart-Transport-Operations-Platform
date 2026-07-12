// ─────────────────────────────────────────────────────────────
// Environment Configuration — Single Source of Truth
// ─────────────────────────────────────────────────────────────
// Every module imports env values from here. process.env is
// never accessed directly anywhere else in the codebase.
// The server fails fast on startup if required vars are missing.
// ─────────────────────────────────────────────────────────────

import dotenv from "dotenv";
dotenv.config();

function required(key) {
    const value = process.env[key];
    if (!value) {
        console.error(`❌ Missing required environment variable: ${key}`);
        process.exit(1);
    }
    return value;
}

function optional(key, fallback) {
    return process.env[key] || fallback;
}

const env = Object.freeze({
    // Application
    NODE_ENV: optional("NODE_ENV", "development"),
    PORT: parseInt(optional("PORT", "5000"), 10),

    // Database
    DATABASE_URL: required("DATABASE_URL"),

    // JWT
    JWT_SECRET: required("JWT_SECRET"),
    JWT_ACCESS_EXPIRY: optional("JWT_ACCESS_EXPIRY", "15m"),
    JWT_REFRESH_EXPIRY: optional("JWT_REFRESH_EXPIRY", "7d"),

    // CORS
    CORS_ORIGIN: optional("CORS_ORIGIN", "http://localhost:5173"),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(optional("RATE_LIMIT_WINDOW_MS", "900000"), 10), // 15 min
    RATE_LIMIT_MAX: parseInt(optional("RATE_LIMIT_MAX", "100"), 10),

    // SMTP Config (Optional for Ethereal fallback)
    SMTP_HOST: optional("SMTP_HOST", ""),
    SMTP_PORT: parseInt(optional("SMTP_PORT", "587"), 10),
    SMTP_USER: optional("SMTP_USER", ""),
    SMTP_PASS: optional("SMTP_PASS", ""),

    // Computed
    get isDevelopment() { return this.NODE_ENV === "development"; },
    get isProduction() { return this.NODE_ENV === "production"; },
});

export default env;
