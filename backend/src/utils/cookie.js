// ─────────────────────────────────────────────────────────────
// Cookie Utilities
// ─────────────────────────────────────────────────────────────
// Helpers for setting and clearing the refresh token cookie.
// ─────────────────────────────────────────────────────────────

import env from "../config/env.js";
import { durationToMs } from "../helpers/dateHelper.js";

const REFRESH_COOKIE_NAME = "refreshToken";

function getCookieOptions() {
    return {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: env.isProduction ? "strict" : "lax",
        path: "/api/v1/auth",
        maxAge: durationToMs(env.JWT_REFRESH_EXPIRY),
    };
}

/**
 * Set the refresh token as an HTTP-only cookie.
 */
export function setRefreshCookie(res, token) {
    res.cookie(REFRESH_COOKIE_NAME, token, getCookieOptions());
}

/**
 * Clear the refresh token cookie.
 */
export function clearRefreshCookie(res) {
    res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: env.isProduction ? "strict" : "lax",
        path: "/api/v1/auth",
    });
}

/**
 * Extract the refresh token from cookies.
 */
export function getRefreshCookie(req) {
    return req.cookies?.[REFRESH_COOKIE_NAME] || null;
}
