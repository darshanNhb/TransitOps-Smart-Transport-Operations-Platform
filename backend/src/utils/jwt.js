// ─────────────────────────────────────────────────────────────
// JWT Utilities
// ─────────────────────────────────────────────────────────────
// Generates and verifies access and refresh tokens.
// Access tokens are short-lived (15m).
// Refresh tokens are long-lived (7d) and stored in the DB.
// ─────────────────────────────────────────────────────────────

import jwt from "jsonwebtoken";
import crypto from "crypto";
import env from "../config/env.js";

/**
 * Generate an access token (short-lived, stateless).
 */
export function generateAccessToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRY,
    });
}

/**
 * Generate a refresh token (long-lived, tracked in DB).
 */
export function generateRefreshToken(payload) {
    const jti = crypto.randomUUID();
    const token = jwt.sign({ ...payload, jti }, env.JWT_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRY,
    });
    return { token, jti };
}

/**
 * Verify and decode a JWT.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 */
export function verifyToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
}

/**
 * Generate a secure random token for password reset / email verification.
 */
export function generateSecureToken() {
    return crypto.randomBytes(32).toString("hex");
}
