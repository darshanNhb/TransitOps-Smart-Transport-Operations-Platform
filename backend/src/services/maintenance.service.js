// ─────────────────────────────────────────────────────────────
// Maintenance Service — Operations Business Logic
// ─────────────────────────────────────────────────────────────

import maintenanceRepository from "../repositories/maintenance.repository.js";
import vehicleRepository from "../repositories/vehicle.repository.js";
import activityLogService from "./activityLog.service.js";
import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";

class MaintenanceService {
    /**
     * Get paginated maintenance records.
     */
    async getMaintenances(query, organizationId) {
        const where = {};
        if (query.status) where.status = query.status;
        return maintenanceRepository.findAll(organizationId, query, {
            where,
            include: {
                vehicle: { select: { name: true, vehicleNumber: true } },
            },
        });
    }

    /**
     * Get single maintenance record details.
     */
    async getMaintenanceById(id, organizationId) {
        const record = await maintenanceRepository.findById(id, organizationId, {
            include: { vehicle: true },
        });
        if (!record) {
            throw ApiError.notFound("Maintenance record not found");
        }
        return record;
    }

    /**
     * Schedule a maintenance event.
     */
    async createMaintenance(data, userId, organizationId, req) {
        // Fetch vehicle and check tenant
        const vehicle = await vehicleRepository.findById(data.vehicleId, organizationId);
        if (!vehicle) throw ApiError.notFound("Vehicle not found");
        if (vehicle.status === "RETIRED") throw ApiError.badRequest("Vehicle is retired from fleet");

        const payload = {
            ...data,
            organizationId,
            createdById: userId,
            startDate: new Date(data.startDate),
            nextServiceDate: data.nextServiceDate ? new Date(data.nextServiceDate) : null,
        };

        const record = await maintenanceRepository.create(payload);

        await activityLogService.log({
            userId,
            action: "CREATE",
            resource: "Maintenance",
            resourceId: record.id,
            newData: record,
            req,
            organizationId,
        });

        return record;
    }

    /**
     * Start vehicle maintenance — sets vehicle status to IN_MAINTENANCE.
     */
    async startMaintenance(id, userId, organizationId, req) {
        const record = await this.getMaintenanceById(id, organizationId);

        if (record.status !== "SCHEDULED") {
            throw ApiError.badRequest(`Cannot start maintenance that is already in ${record.status} status`);
        }

        const result = await prisma.$transaction(async (tx) => {
            // Verify vehicle is available
            const vehicle = await tx.vehicle.findUnique({ where: { id: record.vehicleId } });
            if (!vehicle.availability || vehicle.status !== "AVAILABLE") {
                throw ApiError.badRequest("Vehicle is not available for maintenance (ON_TRIP or already serviced)");
            }

            // 1. Update maintenance status
            const updatedRecord = await tx.maintenance.update({
                where: { id },
                data: {
                    status: "IN_PROGRESS",
                    updatedById: userId,
                },
            });

            // 2. Lock vehicle
            await tx.vehicle.update({
                where: { id: record.vehicleId },
                data: { status: "IN_MAINTENANCE", availability: false },
            });

            return updatedRecord;
        });

        await activityLogService.log({
            userId,
            action: "START",
            resource: "Maintenance",
            resourceId: id,
            oldData: record,
            newData: result,
            req,
            organizationId,
        });

        return result;
    }

    /**
     * Complete maintenance — releases vehicle and locks final details.
     */
    async completeMaintenance(id, data, userId, organizationId, req) {
        const record = await this.getMaintenanceById(id, organizationId);

        if (record.status !== "IN_PROGRESS") {
            throw ApiError.badRequest("Only maintenance tasks in progress can be completed");
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Update maintenance record properties
            const updatedRecord = await tx.maintenance.update({
                where: { id },
                data: {
                    status: "COMPLETED",
                    invoiceNumber: data.invoiceNumber,
                    invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
                    remarks: data.remarks,
                    completionDate: new Date(data.completionDate),
                    updatedById: userId,
                },
            });

            // 2. Release vehicle
            await tx.vehicle.update({
                where: { id: record.vehicleId },
                data: { status: "AVAILABLE", availability: true },
            });

            return updatedRecord;
        });

        await activityLogService.log({
            userId,
            action: "COMPLETE",
            resource: "Maintenance",
            resourceId: id,
            oldData: record,
            newData: result,
            req,
            organizationId,
        });

        return result;
    }

    /**
     * Cancel maintenance.
     */
    async cancelMaintenance(id, userId, organizationId, req) {
        const record = await this.getMaintenanceById(id, organizationId);

        if (record.status === "COMPLETED" || record.status === "CANCELLED") {
            throw ApiError.badRequest(`Cannot cancel maintenance that is already ${record.status}`);
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Update status
            const updatedRecord = await tx.maintenance.update({
                where: { id },
                data: {
                    status: "CANCELLED",
                    updatedById: userId,
                },
            });

            // 2. Release vehicle if it was active
            if (record.status === "IN_PROGRESS") {
                await tx.vehicle.update({
                    where: { id: record.vehicleId },
                    data: { status: "AVAILABLE", availability: true },
                });
            }

            return updatedRecord;
        });

        await activityLogService.log({
            userId,
            action: "CANCEL",
            resource: "Maintenance",
            resourceId: id,
            oldData: record,
            newData: result,
            req,
            organizationId,
        });

        return result;
    }
}

export default new MaintenanceService();
