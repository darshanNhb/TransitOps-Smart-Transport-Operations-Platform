// ─────────────────────────────────────────────────────────────
// Fuel Log Router
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import {
    getFuelLogs,
    getFuelLog,
    createFuelLog,
    deleteFuelLog,
} from "../../controllers/fuel.controller.js";
import authenticate from "../../middleware/authenticate.js";
import authorize from "../../middleware/authorize.js";
import validate from "../../middleware/validate.js";
import { createFuelLogSchema } from "../../validations/fuel.validation.js";
import { uuidParam, paginationQuery } from "../../validations/common.js";

const router = Router();

// Secure all endpoints in this router
router.use(authenticate);

router.route("/")
    .get(validate(paginationQuery), authorize("fuel", "read"), getFuelLogs)
    .post(validate(createFuelLogSchema), authorize("fuel", "create"), createFuelLog);

router.route("/:id")
    .get(validate(uuidParam), authorize("fuel", "read"), getFuelLog)
    .delete(validate(uuidParam), authorize("fuel", "delete"), deleteFuelLog);

export default router;
