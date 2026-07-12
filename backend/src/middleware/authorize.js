// ─────────────────────────────────────────────────────────────
// Authorization Middleware — Dynamic RBAC
// ─────────────────────────────────────────────────────────────
// Usage:
//   router.post("/vehicles", authenticate, authorize("vehicle", "create"), ctrl);
//
// This middleware NEVER checks role names. It resolves the
// user's roleId against the permission cache and verifies
// whether that role holds the required resource:action pair.
//
// Adding a new role or permission requires ZERO code changes —
// only database inserts.
// ─────────────────────────────────────────────────────────────

import ApiError from "../utils/ApiError.js";
import permissionCache from "../services/permissionCache.js";

/**
 * @param {string} resource - e.g. "vehicle", "driver", "trip"
 * @param {string} action   - e.g. "create", "read", "update", "delete"
 */
const authorize = (resource, action) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.roleId) {
                throw ApiError.unauthorized("Authentication required");
            }

            const hasPermission = await permissionCache.hasPermission(
                req.user.roleId,
                resource,
                action
            );

            if (!hasPermission) {
                throw ApiError.forbidden(
                    `You do not have permission to ${action} ${resource}`
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

export default authorize;
