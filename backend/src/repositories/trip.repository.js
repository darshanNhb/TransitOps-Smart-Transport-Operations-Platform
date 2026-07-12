// ─────────────────────────────────────────────────────────────
// Trip Repository
// ─────────────────────────────────────────────────────────────

import BaseRepository from "./baseRepository.js";
import prisma from "../config/prisma.js";

class TripRepository extends BaseRepository {
    constructor() {
        super("trip");
    }

    async findByTripNumber(tripNumber, organizationId) {
        return this.findOne(organizationId, { tripNumber });
    }

    /**
     * Check if vehicle or driver is already booked in a scheduling window.
     * Overlap rule: (NewStart <= ExistingEnd) AND (NewEnd >= ExistingStart)
     */
    async findOverlappingActiveSchedule(vehicleId, driverId, startTime, expectedArrival, excludeTripId = null) {
        return prisma.trip.findFirst({
            where: {
                id: excludeTripId ? { not: excludeTripId } : undefined,
                deletedAt: null,
                status: { in: ["SCHEDULED", "DISPATCHED"] },
                OR: [
                    { vehicleId },
                    { driverId },
                ],
                dispatchTime: { lte: expectedArrival },
                expectedArrival: { gte: startTime },
            },
        });
    }
}

export default new TripRepository();
