// ─────────────────────────────────────────────────────────────
// Driver Router
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import {
    getDrivers,
    getDriver,
    createDriver,
    updateDriver,
    deleteDriver,
} from "../../controllers/driver.controller.js";
import authenticate from "../../middleware/authenticate.js";
import authorize from "../../middleware/authorize.js";
import validate from "../../middleware/validate.js";
import { createDriverSchema, updateDriverSchema } from "../../validations/driver.validation.js";
import { uuidParam, paginationQuery } from "../../validations/common.js";

const router = Router();

// Secure all endpoints in this router
router.use(authenticate);

router.route("/")
    .get(validate(paginationQuery), authorize("driver", "read"), getDrivers)
    .post(validate(createDriverSchema), authorize("driver", "create"), createDriver);

router.route("/:id")
    .get(validate(uuidParam), authorize("driver", "read"), getDriver)
    .put(validate(uuidParam.merge(updateDriverSchema)), authorize("driver", "update"), updateDriver)
    .delete(validate(uuidParam), authorize("driver", "delete"), deleteDriver);

export default router;
