// ─────────────────────────────────────────────────────────────
// Notification Service
// ─────────────────────────────────────────────────────────────

import notificationRepository from "../repositories/notification.repository.js";
import prisma from "../config/prisma.js";

class NotificationService {
    /**
     * Get user notifications.
     */
    async getNotifications(userId, query, organizationId) {
        const where = { userId };
        if (query.status) where.status = query.status;
        return notificationRepository.findAll(organizationId, query, { where });
    }

    /**
     * Mark a single notification as read.
     */
    async markAsRead(id, userId, organizationId) {
        await notificationRepository.markAsRead(id, userId, organizationId);
        return { success: true };
    }

    /**
     * Mark all unread notifications as read.
     */
    async markAllAsRead(userId, organizationId) {
        await notificationRepository.markAllAsRead(userId, organizationId);
        return { success: true };
    }

    /**
     * Create notification (service utility used by other business handlers).
     */
    async createNotification({ userId, title, message, type, priority, organizationId }) {
        return prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
                priority,
                organizationId,
                status: "UNREAD",
            },
        });
    }
}

export default new NotificationService();
