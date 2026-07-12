// ─────────────────────────────────────────────────────────────
// 404 Not Found Handler
// ─────────────────────────────────────────────────────────────
// Must be registered AFTER all routes. Catches any request that
// did not match a defined route and returns a structured 404.
// ─────────────────────────────────────────────────────────────

import ApiError from "../utils/ApiError.js";

const notFound = (req, res, next) => {
    next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export default notFound;
