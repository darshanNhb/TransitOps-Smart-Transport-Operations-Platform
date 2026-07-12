// ─────────────────────────────────────────────────────────────
// Notification Repository
// ─────────────────────────────────────────────────────────────

import BaseRepository from "./baseRepository.js";
import prisma from "../config/prisma.js";

class NotificationRepository extends BaseRepository {
    constructor() {
        super("notification", false);
    }

    async markAsRead(id, userId, organizationId) {
        return prisma.notification.updateMany({
            where: { id, userId, organizationId },
            data: { status: "READ" },
        });
    }

    async markAllAsRead(userId, organizationId) {
        return prisma.notification.updateMany({
            where: { userId, organizationId, status: "UNREAD" },
            data: { status: "READ" },
        });
    }
}

export default new NotificationRepository();
