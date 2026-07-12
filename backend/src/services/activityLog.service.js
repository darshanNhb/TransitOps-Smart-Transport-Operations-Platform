// ─────────────────────────────────────────────────────────────
// Activity Log Service — Auditing compliance
// ─────────────────────────────────────────────────────────────
// Asynchronously registers audit records for structural updates.
// Integrates with request correlation IDs and user-agent context.
// Design resiliently: failure to audit must not crash operational
// requests.
// ─────────────────────────────────────────────────────────────

import prisma from "../config/prisma.js";
import logger from "../config/logger.js";

class ActivityLogService {
    /**
     * Write an audit log entry.
     */
    async log({ userId, action, resource, resourceId, oldData, newData, req, organizationId }) {
        try {
            const ipAddress = req?.ip || null;
            const userAgent = req?.get("User-Agent") || null;
            const requestId = req?.correlationId || null;

            await prisma.activityLog.create({
                data: {
                    userId,
                    action,
                    resource,
                    resourceId,
                    oldData: oldData ? oldData : undefined,
                    newData: newData ? newData : undefined,
                    ipAddress,
                    userAgent,
                    requestId,
                    organizationId,
                },
            });
        } catch (error) {
            logger.error(`Failed to write audit log for ${action} ${resource}:${resourceId}`, error);
        }
    }
}

export default new ActivityLogService();
