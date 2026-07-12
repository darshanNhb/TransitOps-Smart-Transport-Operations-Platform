// ─────────────────────────────────────────────────────────────
// Application Constants
// ─────────────────────────────────────────────────────────────
// Centralized constants to avoid magic strings throughout the
// codebase. Import individual named exports where needed.
// ─────────────────────────────────────────────────────────────

export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
};

export const TOKEN_TYPES = {
    ACCESS: "access",
    REFRESH: "refresh",
};

export const SORT_ORDER = {
    ASC: "asc",
    DESC: "desc",
};

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const PERMISSION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
