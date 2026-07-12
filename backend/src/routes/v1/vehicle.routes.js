// ─────────────────────────────────────────────────────────────
// Vehicle Router
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import {
    getVehicles,
    getVehicle,
    createVehicle,
    updateVehicle,
    deleteVehicle,
} from "../../controllers/vehicle.controller.js";
import authenticate from "../../middleware/authenticate.js";
import authorize from "../../middleware/authorize.js";
import validate from "../../middleware/validate.js";
import { createVehicleSchema, updateVehicleSchema } from "../../validations/vehicle.validation.js";
import { uuidParam, paginationQuery } from "../../validations/common.js";

const router = Router();

// Secure all endpoints in this router
router.use(authenticate);

router.route("/")
    .get(validate(paginationQuery), authorize("vehicle", "read"), getVehicles)
    .post(validate(createVehicleSchema), authorize("vehicle", "create"), createVehicle);

router.route("/:id")
    .get(validate(uuidParam), authorize("vehicle", "read"), getVehicle)
    .put(validate(uuidParam.merge(updateVehicleSchema)), authorize("vehicle", "update"), updateVehicle)
    .delete(validate(uuidParam), authorize("vehicle", "delete"), deleteVehicle);

export default router;
