// ─────────────────────────────────────────────────────────────
// Expense Router
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import {
    getExpenses,
    getExpense,
    createExpense,
    updateExpense,
    approveExpense,
    deleteExpense,
} from "../../controllers/expense.controller.js";
import authenticate from "../../middleware/authenticate.js";
import authorize from "../../middleware/authorize.js";
import validate from "../../middleware/validate.js";
import { createExpenseSchema, updateExpenseSchema } from "../../validations/expense.validation.js";
import { uuidParam, paginationQuery } from "../../validations/common.js";

const router = Router();

// Secure all endpoints in this router
router.use(authenticate);

router.route("/")
    .get(validate(paginationQuery), authorize("expense", "read"), getExpenses)
    .post(validate(createExpenseSchema), authorize("expense", "create"), createExpense);

router.route("/:id")
    .get(validate(uuidParam), authorize("expense", "read"), getExpense)
    .put(validate(uuidParam.merge(updateExpenseSchema)), authorize("expense", "update"), updateExpense)
    .delete(validate(uuidParam), authorize("expense", "delete"), deleteExpense);

router.patch("/:id/approve", validate(uuidParam), authorize("expense", "approve"), approveExpense);

export default router;
