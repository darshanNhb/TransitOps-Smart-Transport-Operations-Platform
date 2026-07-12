// ─────────────────────────────────────────────────────────────
// Activity Log Controller
// ─────────────────────────────────────────────────────────────

import activityLogRepository from "../repositories/activityLog.repository.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getActivityLogs = asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.resource) where.resource = req.query.resource;
    if (req.query.action) where.action = req.query.action;

    const { data, pagination } = await activityLogRepository.findAll(
        req.user.organizationId,
        req.query,
        {
            where,
            include: {
                user: { select: { name: true, email: true } },
            },
        }
    );
    ApiResponse.paginated(res, "Activity logs list retrieved", data, pagination);
});
