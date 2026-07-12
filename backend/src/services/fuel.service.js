// ─────────────────────────────────────────────────────────────
// Fuel Log Service — Fuel Analytics & Auto-Expense Operations
// ─────────────────────────────────────────────────────────────

import fuelRepository from "../repositories/fuel.repository.js";
import vehicleRepository from "../repositories/vehicle.repository.js";
import activityLogService from "./activityLog.service.js";
import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";

class FuelService {
    /**
     * Get paginated fuel logs.
     */
    async getFuelLogs(query, organizationId) {
        return fuelRepository.findAll(organizationId, query, {
            include: {
                vehicle: { select: { name: true, vehicleNumber: true } },
            },
        });
    }

    /**
     * Get single fuel log details.
     */
    async getFuelLogById(id, organizationId) {
        const log = await fuelRepository.findById(id, organizationId, {
            include: { vehicle: true },
        });
        if (!log) {
            throw ApiError.notFound("Fuel log not found");
        }
        return log;
    }

    /**
     * Create a fuel log. Atomic transaction creates FuelLog, updates Vehicle Odometer,
     * and automatically generates an associated Expense of category FUEL.
     */
    async createFuelLog(data, userId, organizationId, req) {
        // Fetch vehicle and verify tenant
        const vehicle = await vehicleRepository.findById(data.vehicleId, organizationId);
        if (!vehicle) throw ApiError.notFound("Vehicle not found");

        // Verify odometer is monotonic (increasing)
        if (data.odometerReading < vehicle.currentOdometer) {
            throw ApiError.badRequest(`Submitted odometer (${data.odometerReading}) cannot be less than current odometer (${vehicle.currentOdometer})`);
        }

        // Calculate total cost
        const totalCost = parseFloat((data.fuelQuantity * data.pricePerLiter).toFixed(2));

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create FuelLog record
            const fuelLog = await tx.fuelLog.create({
                data: {
                    ...data,
                    totalCost,
                    organizationId,
                    createdById: userId,
                    date: new Date(data.date),
                },
            });

            // 2. Update Vehicle odometer
            await tx.vehicle.update({
                where: { id: data.vehicleId },
                data: {
                    currentOdometer: data.odometerReading,
                },
            });

            // 3. Auto-generate Expense
            const expense = await tx.expense.create({
                data: {
                    organizationId,
                    vehicleId: data.vehicleId,
                    amount: totalCost,
                    category: "FUEL",
                    description: `Refueling at ${data.fuelStation || "Unknown Station"} (Receipt: ${data.receiptNumber || "N/A"})`,
                    paymentMethod: "CASH", // Default payment mapping, could be parameter-driven
                    date: new Date(data.date),
                    createdById: userId,
                },
            });

            return { fuelLog, expense };
        });

        await activityLogService.log({
            userId,
            action: "CREATE",
            resource: "FuelLog",
            resourceId: result.fuelLog.id,
            newData: result.fuelLog,
            req,
            organizationId,
        });

        return result.fuelLog;
    }

    /**
     * Soft delete a fuel log.
     */
    async deleteFuelLog(id, userId, organizationId, req) {
        const log = await this.getFuelLogById(id, organizationId);
        const result = await fuelRepository.softDelete(id, userId);

        await activityLogService.log({
            userId,
            action: "DELETE",
            resource: "FuelLog",
            resourceId: id,
            oldData: log,
            req,
            organizationId,
        });

        return result;
    }
}

export default new FuelService();
