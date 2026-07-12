// ─────────────────────────────────────────────────────────────
// Authentication Middleware
// ─────────────────────────────────────────────────────────────
// Extracts the Bearer token from the Authorization header,
// verifies it, loads the user from the database, and attaches
// `req.user` with the user's role and organization context.
//
// If the user is soft-deleted, locked, or inactive, access
// is denied even if the token is technically valid.
// ─────────────────────────────────────────────────────────────

import { verifyToken } from "../utils/jwt.js";
import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";

const authenticate = async (req, res, next) => {
    try {
        // Extract token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw ApiError.unauthorized("Access token is required");
        }

        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = verifyToken(token);

        // Load user with role
        const user = await prisma.user.findFirst({
            where: {
                id: decoded.userId,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
                organizationId: true,
                roleId: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!user) {
            throw ApiError.unauthorized("User not found or has been deleted");
        }

        if (user.status === "LOCKED") {
            throw ApiError.forbidden("Account is locked. Contact your administrator.");
        }

        if (user.status === "INACTIVE") {
            throw ApiError.forbidden("Account is inactive");
        }

        // Attach user context to request
        req.user = user;

        next();
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        // JWT verification errors
        return next(ApiError.unauthorized(error.message || "Invalid token"));
    }
};

export default authenticate;
