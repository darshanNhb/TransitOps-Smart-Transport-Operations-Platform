// ─────────────────────────────────────────────────────────────
// Trip Service — Fleet Dispatch & Operations Business Logic
// ─────────────────────────────────────────────────────────────

import tripRepository from "../repositories/trip.repository.js";
import vehicleRepository from "../repositories/vehicle.repository.js";
import driverRepository from "../repositories/driver.repository.js";
import activityLogService from "./activityLog.service.js";
import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";

class TripService {
    /**
     * Get paginated trips list.
     */
    async getTrips(query, organizationId) {
        const where = {};
        if (query.status) where.status = query.status;
        return tripRepository.findAll(organizationId, query, {
            where,
            include: {
                vehicle: { select: { name: true, vehicleNumber: true } },
                driver: { select: { name: true, employeeCode: true } },
            },
        });
    }

    /**
     * Get single trip details.
     */
    async getTripById(id, organizationId) {
        const trip = await tripRepository.findById(id, organizationId, {
            include: {
                vehicle: true,
                driver: true,
            },
        });
        if (!trip) {
            throw ApiError.notFound("Trip not found");
        }
        return trip;
    }

    /**
     * Schedule a new trip.
     */
    async createTrip(data, userId, organizationId, req) {
        // Validate unique tripNumber per tenant
        const dupTrip = await tripRepository.findByTripNumber(data.tripNumber, organizationId);
        if (dupTrip) {
            throw ApiError.conflict("Trip number already exists");
        }

        // Fetch vehicle and verify tenant and availability
        const vehicle = await vehicleRepository.findById(data.vehicleId, organizationId);
        if (!vehicle) throw ApiError.notFound("Vehicle not found");
        if (vehicle.status === "RETIRED") throw ApiError.badRequest("Vehicle is retired from fleet");
        if (!vehicle.availability) throw ApiError.badRequest("Vehicle is not available (allocated elsewhere)");

        // Fetch driver and verify tenant and availability
        const driver = await driverRepository.findById(data.driverId, organizationId);
        if (!driver) throw ApiError.notFound("Driver not found");
        if (driver.status === "SUSPENDED") throw ApiError.badRequest("Driver is suspended");
        if (!driver.availability) throw ApiError.badRequest("Driver is not available (allocated elsewhere)");

        // Verify driver license expiry
        if (new Date(driver.licenseExpiry) <= new Date()) {
            throw ApiError.badRequest("Driver license has expired");
        }

        // Verify cargo weight limit
        if (data.cargoWeight > vehicle.payloadCapacity) {
            throw ApiError.badRequest(`Cargo weight (${data.cargoWeight}kg) exceeds vehicle payload capacity (${vehicle.payloadCapacity}kg)`);
        }

        // Verify start odometer matches or exceeds current odometer
        if (data.startOdometer < vehicle.currentOdometer) {
            throw ApiError.badRequest(`Start odometer (${data.startOdometer}) cannot be less than the vehicle's current odometer (${vehicle.currentOdometer})`);
        }

        // Verify scheduling overlap
        const overlap = await tripRepository.findOverlappingActiveSchedule(
            data.vehicleId,
            data.driverId,
            new Date(data.dispatchTime),
            new Date(data.expectedArrival)
        );
        if (overlap) {
            throw ApiError.conflict("Vehicle or Driver has an overlapping active trip schedule during this timeframe");
        }

        // Save scheduled trip
        const trip = await tripRepository.create({
            ...data,
            organizationId,
            createdById: userId,
            dispatchTime: new Date(data.dispatchTime),
            expectedArrival: new Date(data.expectedArrival),
        });

        await activityLogService.log({
            userId,
            action: "CREATE",
            resource: "Trip",
            resourceId: trip.id,
            newData: trip,
            req,
            organizationId,
        });

        return trip;
    }

    /**
     * Dispatch a scheduled trip — locks vehicle & driver availability in a transaction.
     */
    async dispatchTrip(id, userId, organizationId, req) {
        const trip = await this.getTripById(id, organizationId);

        if (trip.status !== "SCHEDULED") {
            throw ApiError.badRequest(`Cannot dispatch a trip that is in ${trip.status} status`);
        }

        // Execute status changes and locks atomically
        const result = await prisma.$transaction(async (tx) => {
            // Verify vehicle is still available
            const vehicle = await tx.vehicle.findUnique({ where: { id: trip.vehicleId } });
            if (!vehicle.availability || vehicle.status !== "AVAILABLE") {
                throw ApiError.badRequest("Assigned vehicle is no longer available for dispatch");
            }

            // Verify driver is still available
            const driver = await tx.driver.findUnique({ where: { id: trip.driverId } });
            if (!driver.availability || driver.status !== "AVAILABLE") {
                throw ApiError.badRequest("Assigned driver is no longer available for dispatch");
            }

            // 1. Update trip status
            const updatedTrip = await tx.trip.update({
                where: { id },
                data: {
                    status: "DISPATCHED",
                    updatedById: userId,
                },
            });

            // 2. Lock vehicle
            await tx.vehicle.update({
                where: { id: trip.vehicleId },
                data: { status: "ON_TRIP", availability: false },
            });

            // 3. Lock driver
            await tx.driver.update({
                where: { id: trip.driverId },
                data: { status: "ON_TRIP", availability: false },
            });

            return updatedTrip;
        });

        await activityLogService.log({
            userId,
            action: "DISPATCH",
            resource: "Trip",
            resourceId: id,
            oldData: trip,
            newData: result,
            req,
            organizationId,
        });

        return result;
    }

    /**
     * Complete a dispatched trip — releases vehicle & driver and increments odometer.
     */
    async completeTrip(id, data, userId, organizationId, req) {
        const trip = await this.getTripById(id, organizationId);

        if (trip.status !== "DISPATCHED") {
            throw ApiError.badRequest("Only dispatched trips can be completed");
        }

        // Validate ending odometer is greater than starting odometer
        if (data.endOdometer <= trip.startOdometer) {
            throw ApiError.badRequest(`Ending odometer (${data.endOdometer}) must be greater than start odometer (${trip.startOdometer})`);
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Update trip properties
            const updatedTrip = await tx.trip.update({
                where: { id },
                data: {
                    status: "COMPLETED",
                    actualDistance: data.actualDistance,
                    actualFuel: data.actualFuel,
                    endOdometer: data.endOdometer,
                    actualArrival: new Date(data.actualArrival),
                    completionTime: new Date(),
                    updatedById: userId,
                },
            });

            // 2. Release and update vehicle
            await tx.vehicle.update({
                where: { id: trip.vehicleId },
                data: {
                    status: "AVAILABLE",
                    availability: true,
                    currentOdometer: data.endOdometer,
                },
            });

            // 3. Release driver
            await tx.driver.update({
                where: { id: trip.driverId },
                data: {
                    status: "AVAILABLE",
                    availability: true,
                },
            });

            return updatedTrip;
        });

        await activityLogService.log({
            userId,
            action: "COMPLETE",
            resource: "Trip",
            resourceId: id,
            oldData: trip,
            newData: result,
            req,
            organizationId,
        });

        return result;
    }

    /**
     * Cancel a trip — restores statuses if trip was already active.
     */
    async cancelTrip(id, userId, organizationId, req) {
        const trip = await this.getTripById(id, organizationId);

        if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
            throw ApiError.badRequest(`Cannot cancel a trip that is already ${trip.status}`);
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Update trip status
            const updatedTrip = await tx.trip.update({
                where: { id },
                data: {
                    status: "CANCELLED",
                    updatedById: userId,
                },
            });

            // 2. Release vehicle and driver if they were active
            if (trip.status === "DISPATCHED") {
                await tx.vehicle.update({
                    where: { id: trip.vehicleId },
                    data: { status: "AVAILABLE", availability: true },
                });

                await tx.driver.update({
                    where: { id: trip.driverId },
                    data: { status: "AVAILABLE", availability: true },
                });
            }

            return updatedTrip;
        });

        await activityLogService.log({
            userId,
            action: "CANCEL",
            resource: "Trip",
            resourceId: id,
            oldData: trip,
            newData: result,
            req,
            organizationId,
        });

        return result;
    }
}

export default new TripService();
