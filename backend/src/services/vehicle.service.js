// ─────────────────────────────────────────────────────────────
// Vehicle Service — Fleet Management Business Logic
// ─────────────────────────────────────────────────────────────

import vehicleRepository from "../repositories/vehicle.repository.js";
import activityLogService from "./activityLog.service.js";
import ApiError from "../utils/ApiError.js";
import { getDiff } from "../utils/diff.js";

class VehicleService {
    /**
     * Get paginated fleet list.
     */
    async getVehicles(query, organizationId) {
        // Build custom query filters if status/availability passed
        const where = {};
        if (query.status) where.status = query.status;
        if (query.availability !== undefined) {
            where.availability = query.availability === "true" || query.availability === true;
        }

        return vehicleRepository.findAll(organizationId, query, { where });
    }

    /**
     * Get single vehicle profile.
     */
    async getVehicleById(id, organizationId) {
        const vehicle = await vehicleRepository.findById(id, organizationId);
        if (!vehicle) {
            throw ApiError.notFound("Vehicle not found");
        }
        return vehicle;
    }

    /**
     * Create a new vehicle.
     */
    async createVehicle(data, userId, organizationId, req) {
        // Validate unique vehicleNumber per tenant
        const dupNum = await vehicleRepository.findByVehicleNumber(data.vehicleNumber, organizationId);
        if (dupNum) {
            throw ApiError.conflict("Vehicle number already registered inside this organization");
        }

        // Validate unique registrationNumber per tenant
        const dupReg = await vehicleRepository.findByRegistrationNumber(data.registrationNumber, organizationId);
        if (dupReg) {
            throw ApiError.conflict("Registration number already registered inside this organization");
        }

        const vehicle = await vehicleRepository.create({
            ...data,
            organizationId,
            createdById: userId,
            purchaseDate: new Date(data.purchaseDate),
            insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : null,
            fitnessExpiry: data.fitnessExpiry ? new Date(data.fitnessExpiry) : null,
        });

        // Audit Log
        await activityLogService.log({
            userId,
            action: "CREATE",
            resource: "Vehicle",
            resourceId: vehicle.id,
            newData: vehicle,
            req,
            organizationId,
        });

        return vehicle;
    }

    /**
     * Update vehicle metadata and specs.
     */
    async updateVehicle(id, data, userId, organizationId, req) {
        const original = await this.getVehicleById(id, organizationId);

        // Validate uniqueness if number is updating
        if (data.vehicleNumber && data.vehicleNumber !== original.vehicleNumber) {
            const dup = await vehicleRepository.findByVehicleNumber(data.vehicleNumber, organizationId);
            if (dup) throw ApiError.conflict("Vehicle number already in use");
        }

        if (data.registrationNumber && data.registrationNumber !== original.registrationNumber) {
            const dup = await vehicleRepository.findByRegistrationNumber(data.registrationNumber, organizationId);
            if (dup) throw ApiError.conflict("Registration number already in use");
        }

        // Validate odometer is increasing
        if (data.currentOdometer !== undefined && data.currentOdometer < original.currentOdometer) {
            throw ApiError.badRequest("New odometer reading cannot be less than the current odometer reading");
        }

        // Parse date types
        const payload = { ...data };
        if (payload.purchaseDate) payload.purchaseDate = new Date(payload.purchaseDate);
        if (payload.insuranceExpiry) payload.insuranceExpiry = new Date(payload.insuranceExpiry);
        if (payload.fitnessExpiry) payload.fitnessExpiry = new Date(payload.fitnessExpiry);

        const updated = await vehicleRepository.update(id, {
            ...payload,
            updatedById: userId,
        });

        // Generate JSON diff payload for auditing
        const diff = getDiff(original, data);
        if (diff) {
            await activityLogService.log({
                userId,
                action: "UPDATE",
                resource: "Vehicle",
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
     * Soft-delete vehicle from fleet operations.
     */
    async deleteVehicle(id, userId, organizationId, req) {
        // Verify existence
        const vehicle = await this.getVehicleById(id, organizationId);

        // Soft delete
        const result = await vehicleRepository.softDelete(id, userId);

        await activityLogService.log({
            userId,
            action: "DELETE",
            resource: "Vehicle",
            resourceId: id,
            oldData: vehicle,
            req,
            organizationId,
        });

        return result;
    }
}

export default new VehicleService();
