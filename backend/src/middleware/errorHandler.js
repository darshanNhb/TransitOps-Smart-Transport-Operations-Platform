// ─────────────────────────────────────────────────────────────
// Global Error Handler Middleware
// ─────────────────────────────────────────────────────────────
// Catches all errors from the middleware chain and normalizes
// them into a consistent JSON response. Handles:
//   - ApiError (operational)
//   - Prisma known/validation errors
//   - Zod validation errors
//   - JWT errors
//   - Unknown / programmer errors
// Stack traces are NEVER sent in production.
// ─────────────────────────────────────────────────────────────

import ApiError from "../utils/ApiError.js";
import logger from "../config/logger.js";
import env from "../config/env.js";

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    // Log the full error internally
    logger.error(err.message, {
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
    });

    // ── Operational ApiError ──────────────────────────────────
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
    }

    // ── Zod Validation Error ─────────────────────────────────
    if (err.name === "ZodError") {
        const errors = err.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
        });
    }

    // ── Prisma Known Request Error ───────────────────────────
    if (err.code && err.code.startsWith("P")) {
        const prismaResponse = handlePrismaError(err);
        return res.status(prismaResponse.statusCode).json({
            success: false,
            message: prismaResponse.message,
            errors: [],
        });
    }

    // ── JWT Errors ───────────────────────────────────────────
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            success: false,
            message: "Invalid token",
            errors: [],
        });
    }

    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            success: false,
            message: "Token expired",
            errors: [],
        });
    }

    // ── Unknown Error ────────────────────────────────────────
    return res.status(500).json({
        success: false,
        message: env.isProduction
            ? "Internal server error"
            : err.message || "Internal server error",
        errors: [],
        ...(env.isDevelopment && { stack: err.stack }),
    });
};

// ── Prisma Error Mapper ──────────────────────────────────────
function handlePrismaError(err) {
    switch (err.code) {
        case "P2002":
            return {
                statusCode: 409,
                message: `A record with this ${err.meta?.target?.join(", ") || "value"} already exists`,
            };
        case "P2025":
            return {
                statusCode: 404,
                message: "Record not found",
            };
        case "P2003":
            return {
                statusCode: 400,
                message: "Related record not found (foreign key constraint failed)",
            };
        case "P2014":
            return {
                statusCode: 400,
                message: "This change would violate a required relation",
            };
        default:
            return {
                statusCode: 500,
                message: "Database error",
            };
    }
}

export default errorHandler;
