// ─────────────────────────────────────────────────────────────
// Notification Controller
// ─────────────────────────────────────────────────────────────

import notificationService from "../services/notification.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getNotifications = asyncHandler(async (req, res) => {
    const { data, pagination } = await notificationService.getNotifications(
        req.user.id,
        req.query,
        req.user.organizationId
    );
    ApiResponse.paginated(res, "Notifications list retrieved", data, pagination);
});

export const markAsRead = asyncHandler(async (req, res) => {
    await notificationService.markAsRead(req.params.id, req.user.id, req.user.organizationId);
    ApiResponse.ok(res, "Notification marked as read");
});

export const markAllAsRead = asyncHandler(async (req, res) => {
    await notificationService.markAllAsRead(req.user.id, req.user.organizationId);
    ApiResponse.ok(res, "All notifications marked as read");
});
