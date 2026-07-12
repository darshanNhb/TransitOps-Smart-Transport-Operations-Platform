// ─────────────────────────────────────────────────────────────
// Expense Controller
// ─────────────────────────────────────────────────────────────

import expenseService from "../services/expense.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getExpenses = asyncHandler(async (req, res) => {
    const { data, pagination } = await expenseService.getExpenses(req.query, req.user.organizationId);
    ApiResponse.paginated(res, "Expenses retrieved successfully", data, pagination);
});

export const getExpense = asyncHandler(async (req, res) => {
    const expense = await expenseService.getExpenseById(req.params.id, req.user.organizationId);
    ApiResponse.ok(res, "Expense details retrieved", expense);
});

export const createExpense = asyncHandler(async (req, res) => {
    const expense = await expenseService.createExpense(
        req.body,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.created(res, "Expense registered successfully", expense);
});

export const updateExpense = asyncHandler(async (req, res) => {
    const expense = await expenseService.updateExpense(
        req.params.id,
        req.body,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.ok(res, "Expense updated successfully", expense);
});

export const approveExpense = asyncHandler(async (req, res) => {
    const expense = await expenseService.approveExpense(
        req.params.id,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.ok(res, "Expense approved successfully", expense);
});

export const deleteExpense = asyncHandler(async (req, res) => {
    await expenseService.deleteExpense(
        req.params.id,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.ok(res, "Expense soft-deleted successfully");
});
