// ─────────────────────────────────────────────────────────────
// Zod Validation Middleware
// ─────────────────────────────────────────────────────────────
// Wraps a Zod schema and validates req.body, req.query, and/or
// req.params. Returns structured 400 errors on failure.
// Usage: router.post("/", validate(createVehicleSchema), ctrl);
// ─────────────────────────────────────────────────────────────

import ApiError from "../utils/ApiError.js";

/**
 * @param {import("zod").ZodObject} schema - Zod schema with optional
 *   `body`, `query`, `params` keys.
 */
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
    });

    if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
            field: issue.path.slice(1).join("."), // remove "body"/"query" prefix
            message: issue.message,
        }));

        return next(ApiError.badRequest("Validation failed", errors));
    }

    // Replace only body (query and params are read-only in Express 5)
    if (result.data.body) {
        req.body = result.data.body;
    }

    next();
};

export default validate;
