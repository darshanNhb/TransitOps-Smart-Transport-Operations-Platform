// ─────────────────────────────────────────────────────────────
// Expense Service — Financial Business Logic
// ─────────────────────────────────────────────────────────────

import expenseRepository from "../repositories/expense.repository.js";
import vehicleRepository from "../repositories/vehicle.repository.js";
import tripRepository from "../repositories/trip.repository.js";
import maintenanceRepository from "../repositories/maintenance.repository.js";
import activityLogService from "./activityLog.service.js";
import ApiError from "../utils/ApiError.js";
import { getDiff } from "../utils/diff.js";

class ExpenseService {
    /**
     * Get paginated expenses.
     */
    async getExpenses(query, organizationId) {
        const where = {};
        if (query.category) where.category = query.category;
        return expenseRepository.findAll(organizationId, query, {
            where,
            include: {
                vehicle: { select: { name: true, vehicleNumber: true } },
                trip: { select: { tripNumber: true } },
                approvedBy: { select: { name: true } },
            },
        });
    }

    /**
     * Get single expense details.
     */
    async getExpenseById(id, organizationId) {
        const expense = await expenseRepository.findById(id, organizationId, {
            include: {
                vehicle: true,
                trip: true,
                maintenance: true,
                approvedBy: true,
            },
        });
        if (!expense) {
            throw ApiError.notFound("Expense not found");
        }
        return expense;
    }

    /**
     * Create an expense. Performs cross-relation tenant validation.
     */
    async createExpense(data, userId, organizationId, req) {
        // Enforce same-tenant mapping across all foreign keys
        if (data.vehicleId) {
            const vehicle = await vehicleRepository.findById(data.vehicleId, organizationId);
            if (!vehicle) throw ApiError.badRequest("Linked vehicle not found inside this organization");
        }

        if (data.tripId) {
            const trip = await tripRepository.findById(data.tripId, organizationId);
            if (!trip) throw ApiError.badRequest("Linked trip not found inside this organization");
        }

        if (data.maintenanceId) {
            const maintenance = await maintenanceRepository.findById(data.maintenanceId, organizationId);
            if (!maintenance) throw ApiError.badRequest("Linked maintenance not found inside this organization");
        }

        const expense = await expenseRepository.create({
            ...data,
            organizationId,
            createdById: userId,
            date: new Date(data.date),
        });

        await activityLogService.log({
            userId,
            action: "CREATE",
            resource: "Expense",
            resourceId: expense.id,
            newData: expense,
            req,
            organizationId,
        });

        return expense;
    }

    /**
     * Update an expense before approval.
     */
    async updateExpense(id, data, userId, organizationId, req) {
        const original = await this.getExpenseById(id, organizationId);

        if (original.approvedById) {
            throw ApiError.badRequest("Cannot update an expense that has already been approved");
        }

        // Validate cross-relations
        if (data.vehicleId) {
            const vehicle = await vehicleRepository.findById(data.vehicleId, organizationId);
            if (!vehicle) throw ApiError.badRequest("Linked vehicle not found inside organization");
        }
        if (data.tripId) {
            const trip = await tripRepository.findById(data.tripId, organizationId);
            if (!trip) throw ApiError.badRequest("Linked trip not found inside organization");
        }
        if (data.maintenanceId) {
            const maintenance = await maintenanceRepository.findById(data.maintenanceId, organizationId);
            if (!maintenance) throw ApiError.badRequest("Linked maintenance not found inside organization");
        }

        const payload = { ...data };
        if (payload.date) payload.date = new Date(payload.date);

        const updated = await expenseRepository.update(id, {
            ...payload,
            updatedById: userId,
        });

        const diff = getDiff(original, data);
        if (diff) {
            await activityLogService.log({
                userId,
                action: "UPDATE",
                resource: "Expense",
                resourceId: id,
                oldData: diff.oldData,
                newData: diff.newData,
                req,
                organizationId,
            });
        }

        return updated;
    }

    /**
     * Approve an expense.
     */
    async approveExpense(id, approvedById, organizationId, req) {
        const expense = await this.getExpenseById(id, organizationId);

        if (expense.approvedById) {
            throw ApiError.badRequest("Expense is already approved");
        }

        const updated = await expenseRepository.update(id, {
            approvedById,
        });

        await activityLogService.log({
            userId: approvedById,
            action: "APPROVE",
            resource: "Expense",
            resourceId: id,
            oldData: expense,
            newData: updated,
            req,
            organizationId,
        });

        return updated;
    }

    /**
     * Soft delete an expense.
     */
    async deleteExpense(id, userId, organizationId, req) {
        const expense = await this.getExpenseById(id, organizationId);

        if (expense.approvedById) {
            throw ApiError.badRequest("Cannot delete an approved expense");
        }

        const result = await expenseRepository.softDelete(id, userId);

        await activityLogService.log({
            userId,
            action: "DELETE",
            resource: "Expense",
            resourceId: id,
            oldData: expense,
            req,
            organizationId,
        });

        return result;
    }
}

export default new ExpenseService();
