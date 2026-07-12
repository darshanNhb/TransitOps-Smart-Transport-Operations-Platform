// ─────────────────────────────────────────────────────────────
// Activity Log Router
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import { getActivityLogs } from "../../controllers/activityLog.controller.js";
import authenticate from "../../middleware/authenticate.js";
import authorize from "../../middleware/authorize.js";
import validate from "../../middleware/validate.js";
import { paginationQuery } from "../../validations/common.js";

const router = Router();

// Secure all endpoints in this router
router.use(authenticate);

router.get("/", validate(paginationQuery), authorize("report", "read"), getActivityLogs);

export default router;
