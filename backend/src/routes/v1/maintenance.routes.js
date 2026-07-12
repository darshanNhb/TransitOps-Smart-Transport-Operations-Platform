// ─────────────────────────────────────────────────────────────
// Maintenance Router
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import {
    getMaintenances,
    getMaintenance,
    createMaintenance,
    startMaintenance,
    completeMaintenance,
    cancelMaintenance,
} from "../../controllers/maintenance.controller.js";
import authenticate from "../../middleware/authenticate.js";
import authorize from "../../middleware/authorize.js";
import validate from "../../middleware/validate.js";
import { createMaintenanceSchema, completeMaintenanceSchema } from "../../validations/maintenance.validation.js";
import { uuidParam, paginationQuery } from "../../validations/common.js";

const router = Router();

// Secure all endpoints in this router
router.use(authenticate);

router.route("/")
    .get(validate(paginationQuery), authorize("maintenance", "read"), getMaintenances)
    .post(validate(createMaintenanceSchema), authorize("maintenance", "create"), createMaintenance);

router.route("/:id")
    .get(validate(uuidParam), authorize("maintenance", "read"), getMaintenance);

router.patch("/:id/start", validate(uuidParam), authorize("maintenance", "update"), startMaintenance);
router.patch("/:id/complete", validate(uuidParam.merge(completeMaintenanceSchema)), authorize("maintenance", "update"), completeMaintenance);
router.patch("/:id/cancel", validate(uuidParam), authorize("maintenance", "update"), cancelMaintenance);

export default router;
