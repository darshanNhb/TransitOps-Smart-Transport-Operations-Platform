// ─────────────────────────────────────────────────────────────
// Notification Router
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import { getNotifications, markAsRead, markAllAsRead } from "../../controllers/notification.controller.js";
import authenticate from "../../middleware/authenticate.js";
import authorize from "../../middleware/authorize.js";
import validate from "../../middleware/validate.js";
import { uuidParam, paginationQuery } from "../../validations/common.js";

const router = Router();

// Secure all endpoints in this router
router.use(authenticate);

router.route("/")
    .get(validate(paginationQuery), authorize("notification", "read"), getNotifications)
    .patch(authorize("notification", "update"), markAllAsRead);

router.patch("/:id", validate(uuidParam), authorize("notification", "update"), markAsRead);

export default router;
