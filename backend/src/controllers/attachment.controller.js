// ─────────────────────────────────────────────────────────────
// Attachment Controller
// ─────────────────────────────────────────────────────────────

import attachmentService from "../services/attachment.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const uploadAttachment = asyncHandler(async (req, res) => {
    const attachment = await attachmentService.uploadAttachment(
        req.file,
        req.body,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.created(res, "File uploaded and attached successfully", attachment);
});

export const deleteAttachment = asyncHandler(async (req, res) => {
    await attachmentService.deleteAttachment(
        req.params.id,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.ok(res, "Attachment deleted successfully");
});
