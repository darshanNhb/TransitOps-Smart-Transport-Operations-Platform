// ─────────────────────────────────────────────────────────────
// Trip Router
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import {
    getTrips,
    getTrip,
    createTrip,
    dispatchTrip,
    completeTrip,
    cancelTrip,
} from "../../controllers/trip.controller.js";
import authenticate from "../../middleware/authenticate.js";
import authorize from "../../middleware/authorize.js";
import validate from "../../middleware/validate.js";
import { createTripSchema, completeTripSchema } from "../../validations/trip.validation.js";
import { uuidParam, paginationQuery } from "../../validations/common.js";

const router = Router();

// Secure all endpoints in this router
router.use(authenticate);

router.route("/")
    .get(validate(paginationQuery), authorize("trip", "read"), getTrips)
    .post(validate(createTripSchema), authorize("trip", "create"), createTrip);

router.route("/:id")
    .get(validate(uuidParam), authorize("trip", "read"), getTrip);

router.patch("/:id/dispatch", validate(uuidParam), authorize("trip", "dispatch"), dispatchTrip);
router.patch("/:id/complete", validate(uuidParam.merge(completeTripSchema)), authorize("trip", "update"), completeTrip);
router.patch("/:id/cancel", validate(uuidParam), authorize("trip", "update"), cancelTrip);

export default router;
